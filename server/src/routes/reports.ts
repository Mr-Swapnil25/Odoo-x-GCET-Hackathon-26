import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/summary', requireAuth, requireRole('ADMIN'), async (_req, res) => {
  const totalRes = await pool.query('SELECT COUNT(*)::int as count FROM tasks');
  const pendingRes = await pool.query("SELECT COUNT(*)::int as count FROM tasks WHERE status = 'PENDING'");
  const progressRes = await pool.query("SELECT COUNT(*)::int as count FROM tasks WHERE status = 'IN_PROGRESS'");
  const completedRes = await pool.query("SELECT COUNT(*)::int as count FROM tasks WHERE status = 'COMPLETED'");
  const overdueRes = await pool.query(
    "SELECT COUNT(*)::int as count FROM tasks WHERE due_date IS NOT NULL AND due_date < CURRENT_DATE AND status <> 'COMPLETED'"
  );
  const dueSoonRes = await pool.query(
    "SELECT COUNT(*)::int as count FROM tasks WHERE due_date IS NOT NULL AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'"
  );

  const overdueTasksRes = await pool.query(
    `SELECT t.*, u.id as assigned_id, u.name as assigned_name, u.email as assigned_email
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.due_date IS NOT NULL AND t.due_date < CURRENT_DATE AND t.status <> 'COMPLETED'
     ORDER BY t.due_date ASC
     LIMIT 10`
  );

  const overdueTasks = overdueTasksRes.rows.map((row) => ({
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
  }));

  res.json({
    reports: {
      total: totalRes.rows[0].count,
      pending: pendingRes.rows[0].count,
      inProgress: progressRes.rows[0].count,
      completed: completedRes.rows[0].count,
      overdue: overdueRes.rows[0].count,
      dueSoon: dueSoonRes.rows[0].count,
      overdueTasks
    }
  });
});

export default router;

