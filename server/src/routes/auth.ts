import { Router } from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const bootstrapSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/bootstrap-admin', async (req, res) => {
  const parsed = bootstrapSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const existing = await pool.query('SELECT COUNT(*)::int as count FROM users');
  if (existing.rows[0].count > 0) {
    return res.status(403).json({ error: 'Bootstrap disabled' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [parsed.data.name, parsed.data.email, passwordHash, 'ADMIN']
    );

    const user = result.rows[0];
    const token = signToken({ id: user.id, role: user.role });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Failed to create admin' });
  }
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid login payload' });
  }

  const { email, password } = parsed.data;
  const result = await pool.query(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rowCount === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = result.rows[0];
  if (!user.password_hash) {
    return res.status(400).json({ error: 'Use Google sign-in for this account' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({ id: user.id, role: user.role });
  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const userId = req.user?.id;
  const result = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = result.rows[0];
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at
    }
  });
});

// Profile self-update (name only, users cannot change their own email or role)
const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100),
});

router.patch('/profile', requireAuth, async (req, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Name is required (1-100 characters)' });
  }

  const userId = req.user?.id;
  const result = await pool.query(
    'UPDATE users SET name = $1, updated_at = now() WHERE id = $2 RETURNING id, name, email, role, created_at',
    [parsed.data.name, userId]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = result.rows[0];
  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at,
    },
  });
});

// Password change (self-service)
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.post('/change-password', requireAuth, async (req, res) => {
  const parsed = passwordChangeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Current password and new password (min 6 chars) are required' });
  }

  const userId = req.user?.id;
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = result.rows[0];
  if (!user.password_hash) {
    return res.status(400).json({ error: 'Cannot change password for Google-linked accounts' });
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [newHash, userId]);

  return res.json({ success: true });
});

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

router.get('/google', (req, res, next) => {
  if (!googleEnabled) {
    return res.status(503).json({ error: 'Google OAuth not configured' });
  }
  return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
  '/google/callback',
  (req, res, next) => {
    if (!googleEnabled) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const safeBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
      return res.redirect(`${safeBase}/#/login?error=oauth_unconfigured`);
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const safeBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
    return passport.authenticate('google', { session: false, failureRedirect: `${safeBase}/#/login?error=oauth_failed` })(req, res, next);
  },
  (req, res) => {
    const user = req.user as { id: string; role: 'ADMIN' | 'USER' };
    const token = signToken({ id: user.id, role: user.role });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const safeBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
    res.redirect(`${safeBase}/#/auth/callback?token=${token}`);
  }
);

router.get('/google/failure', (_req, res) => {
  res.status(401).json({ error: 'Google authentication failed' });
});

export default router;

