import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'USER'])
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'USER']).optional()
});

router.get('/', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({
    users: result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at
    }))
  });
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid user payload' });
  }

  const { name, email, password, role } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash, role]
    );
    const user = result.rows[0];
    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

router.patch('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid user payload' });
  }

  const updates = parsed.data;
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name) {
    values.push(updates.name);
    fields.push(`name = $${values.length}`);
  }
  if (updates.email) {
    values.push(updates.email);
    fields.push(`email = $${values.length}`);
  }
  if (updates.role) {
    values.push(updates.role);
    fields.push(`role = $${values.length}`);
  }
  if (updates.password) {
    const hash = await bcrypt.hash(updates.password, 10);
    values.push(hash);
    fields.push(`password_hash = $${values.length}`);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = now() WHERE id = $${values.length} RETURNING id, name, email, role, created_at`,
      values
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
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const result = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ success: true });
});

export default router;

