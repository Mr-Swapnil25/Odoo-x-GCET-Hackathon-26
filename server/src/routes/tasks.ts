import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import type { TaskStatus, Priority } from '../generated/prisma/index.js';

const router = Router();

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  dueDate: z.string().min(1).nullable().optional()
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  dueDate: z.string().nullable().optional()
});

router.get('/', requireAuth, async (req, res) => {
  const isAdmin = req.user?.role === 'ADMIN';

  const tasks = await prisma.task.findMany({
    where: isAdmin ? {} : { assignedToId: req.user?.id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json({
    tasks: tasks.map(mapTask)
  });
});

router.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid task payload' });
  }

  const { title, description, assignedTo, priority, status, dueDate } = parsed.data;
  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      assignedToId: assignedTo || null,
      createdById: req.user?.id,
      priority: priority as Priority,
      status: (status || 'TODO') as TaskStatus,
      deadline: dueDate ? new Date(dueDate) : null,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  return res.status(201).json({ task: mapTask(task) });
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

  const existingTask = await prisma.task.findUnique({
    where: { id: req.params.id },
    select: { assignedToId: true },
  });

  if (!existingTask) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (!isAdmin && existingTask.assignedToId !== req.user?.id) {
    return res.status(403).json({ error: 'Not allowed to update this task' });
  }

  const data: any = {};
  if (updates.title) data.title = updates.title;
  if (typeof updates.description !== 'undefined') data.description = updates.description || null;
  if (typeof updates.assignedTo !== 'undefined') data.assignedToId = updates.assignedTo || null;
  if (updates.priority) data.priority = updates.priority;
  if (updates.status) data.status = updates.status;
  if (typeof updates.dueDate !== 'undefined') data.deadline = updates.dueDate ? new Date(updates.dueDate) : null;

  const task = await prisma.task.update({
    where: { id: req.params.id },
    data,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  return res.json({ task: mapTask(task) });
});

router.delete('/:id', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    return res.json({ success: true });
  } catch {
    return res.status(404).json({ error: 'Task not found' });
  }
});

router.get('/:id/comments', requireAuth, async (req, res) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    select: { assignedToId: true },
  });

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const isAdmin = req.user?.role === 'ADMIN';
  if (!isAdmin && task.assignedToId !== req.user?.id) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  const comments = await prisma.comment.findMany({
    where: { taskId: req.params.id },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return res.json({
    comments: comments.map((c) => ({
      id: c.id,
      taskId: c.taskId,
      userId: c.userId,
      userName: c.user.name,
      comment: c.content,
      createdAt: c.createdAt
    }))
  });
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  const comment = String(req.body?.comment || '').trim();
  if (!comment) {
    return res.status(400).json({ error: 'Comment is required' });
  }

  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    select: { assignedToId: true },
  });

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const isAdmin = req.user?.role === 'ADMIN';
  if (!isAdmin && task.assignedToId !== req.user?.id) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  const created = await prisma.comment.create({
    data: {
      content: comment,
      taskId: req.params.id,
      userId: req.user!.id,
    },
  });

  return res.status(201).json({
    comment: {
      id: created.id,
      taskId: created.taskId,
      userId: created.userId,
      comment: created.content,
      createdAt: created.createdAt
    }
  });
});

const mapTask = (task: any) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  assignedTo: task.assignedToId,
  assignedUser: task.assignedTo
    ? { id: task.assignedTo.id, name: task.assignedTo.name, email: task.assignedTo.email }
    : null,
  priority: task.priority,
  status: task.status,
  dueDate: task.deadline,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt
});

export default router;
