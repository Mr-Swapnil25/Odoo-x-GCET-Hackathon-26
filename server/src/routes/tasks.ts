import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  dueDate: z.string().min(1)
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  dueDate: z.string().nullable().optional()
});

router.get('/', requireAuth, async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const baseQuery = `
    SELECT t.*, u.id as assigned_id, u.name as assigned_name, u.email as assigned_email
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assigned_to
  `;
  const orderBy = ' ORDER BY t.created_at DESC';

  if (isAdmin) {
    const result = await pool.query(baseQuery + orderBy);
    return res.json({ tasks: result.rows.map(mapTask) });
  }

  const result = await pool.query(baseQuery + ' WHERE t.assigned_to = $1' + orderBy, [req.user?.id]);
  return res.json({ tasks: result.rows.map(mapTask) });
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid task payload' });
  }

  const { title, description, assignedTo, priority, status, dueDate } = parsed.data;
  const result = await pool.query(
    `INSERT INTO tasks (title, description, assigned_to, priority, status, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, description || null, assignedTo || null, priority, status || 'PENDING', dueDate || null]
  );

  return res.status(201).json({ task: mapTask(result.rows[0]) });
});

router.patch('/:id', requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid task payload' });
  }

  const isAdmin = req.user?.role === 'ADMIN';
  const updates = parsed.data;

  if (!isAdmin) {
    if (!updates.status || Object.keys(updates).length !== 1) {
      return res.status(403).json({ error: 'Only status updates are allowed' });
    }
  }

  const taskResult = await pool.query('SELECT assigned_to FROM tasks WHERE id = $1', [req.params.id]);
  if (taskResult.rowCount === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const assignedTo = taskResult.rows[0].assigned_to;
  if (!isAdmin && assignedTo !== req.user?.id) {
    return res.status(403).json({ error: 'Not allowed to update this task' });
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title) {
    values.push(updates.title);
    fields.push(`title = $${values.length}`);
  }
  if (typeof updates.description !== 'undefined') {
    values.push(updates.description || null);
    fields.push(`description = $${values.length}`);
  }
  if (typeof updates.assignedTo !== 'undefined') {
    values.push(updates.assignedTo || null);
    fields.push(`assigned_to = $${values.length}`);
  }
  if (updates.priority) {
    values.push(updates.priority);
    fields.push(`priority = $${values.length}`);
  }
  if (updates.status) {
    values.push(updates.status);
    fields.push(`status = $${values.length}`);
  }
  if (typeof updates.dueDate !== 'undefined') {
    values.push(updates.dueDate || null);
    fields.push(`due_date = $${values.length}`);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(req.params.id);

  const result = await pool.query(
    `UPDATE tasks SET ${fields.join(', ')}, updated_at = now() WHERE id = $${values.length} RETURNING *`,
    values
  );

  return res.json({ task: mapTask(result.rows[0]) });
});

router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const result = await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  return res.json({ success: true });
});

router.get('/:id/comments', requireAuth, async (req, res) => {
  const taskCheck = await pool.query('SELECT assigned_to FROM tasks WHERE id = $1', [req.params.id]);
  if (taskCheck.rowCount === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const isAdmin = req.user?.role === 'ADMIN';
  if (!isAdmin && taskCheck.rows[0].assigned_to !== req.user?.id) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  const result = await pool.query(
    `SELECT c.id, c.task_id, c.user_id, c.comment, c.created_at, u.name as user_name
     FROM task_comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.task_id = $1
     ORDER BY c.created_at ASC`,
    [req.params.id]
  );

  return res.json({
    comments: result.rows.map((row) => ({
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      userName: row.user_name,
      comment: row.comment,
      createdAt: row.created_at
    }))
  });
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const comment = String(req.body?.comment || '').trim();
  if (!comment) {
    return res.status(400).json({ error: 'Comment is required' });
  }

  const taskCheck = await pool.query('SELECT assigned_to FROM tasks WHERE id = $1', [req.params.id]);
  if (taskCheck.rowCount === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const isAdmin = req.user?.role === 'ADMIN';
  if (!isAdmin && taskCheck.rows[0].assigned_to !== req.user?.id) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  const result = await pool.query(
    `INSERT INTO task_comments (task_id, user_id, comment)
     VALUES ($1, $2, $3)
     RETURNING id, task_id, user_id, comment, created_at`,
    [req.params.id, req.user?.id, comment]
  );

  return res.status(201).json({
    comment: {
      id: result.rows[0].id,
      taskId: result.rows[0].task_id,
      userId: result.rows[0].user_id,
      comment: result.rows[0].comment,
      createdAt: result.rows[0].created_at
    }
  });
});

const mapTask = (row: any) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  assignedTo: row.assigned_to,
  assignedUser: row.assigned_id
    ? { id: row.assigned_id, name: row.assigned_name, email: row.assigned_email }
    : null,
  priority: row.priority,
  status: row.status,
  dueDate: row.due_date,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

export default router;

