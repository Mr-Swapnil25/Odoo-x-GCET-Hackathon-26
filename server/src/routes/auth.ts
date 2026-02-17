import { Router } from 'express';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { z } from 'zod';
import prisma from '../prisma.js';
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

  const count = await prisma.user.count();
  if (count > 0) {
    return res.status(403).json({ error: 'Bootstrap disabled' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: passwordHash,
        role: 'ADMIN',
      },
      select: { id: true, name: true, email: true, role: true },
    });

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
    if (error?.code === 'P2002') {
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
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, password: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  if (!user.password) {
    return res.status(400).json({ error: 'Use Google sign-in for this account' });
  }

  const ok = await bcrypt.compare(password, user.password);
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
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
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return res.status(404).json({ error: 'User not found' });
  }
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.password) {
    return res.status(400).json({ error: 'Cannot change password for Google-linked accounts' });
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!ok) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: newHash },
  });

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
