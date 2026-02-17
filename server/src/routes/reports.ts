import { Router } from 'express';
import prisma from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/summary', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const [total, todo, inProgress, done, overdue, dueSoon] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: 'TODO' } }),
    prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { status: 'DONE' } }),
    prisma.task.count({
      where: {
        deadline: { not: null, lt: today },
        status: { not: 'DONE' },
      },
    }),
    prisma.task.count({
      where: {
        deadline: { not: null, gte: today, lte: weekFromNow },
      },
    }),
  ]);

  const overdueTasksRaw = await prisma.task.findMany({
    where: {
      deadline: { not: null, lt: today },
      status: { not: 'DONE' },
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { deadline: 'asc' },
    take: 10,
  });

  const overdueTasks = overdueTasksRaw.map((task) => ({
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
  }));

  res.json({
    reports: {
      total,
      pending: todo,
      inProgress,
      completed: done,
      overdue,
      dueSoon,
      overdueTasks
    }
  });
});

export default router;
