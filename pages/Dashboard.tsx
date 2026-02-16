import React, { useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, EmptyState } from '../components/UI';
import { CalendarCheck, AlertTriangle, CheckCircle2, ClipboardList, Loader2, Users } from 'lucide-react';

export const Dashboard = () => {
  const { currentUser, tasks, users, reports, fetchReports } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [isAdmin, fetchReports]);

  const stats = useMemo(() => {
    if (isAdmin && reports) {
      const completedToday = tasks.filter((task) => {
        if (task.status !== 'COMPLETED' || !task.updatedAt) return false;
        const updated = new Date(task.updatedAt);
        const today = new Date();
        return updated.toDateString() === today.toDateString();
      }).length;
      return {
        totalUsers: users.length,
        total: reports.total,
        completedToday,
        pending: reports.pending,
        inProgress: reports.inProgress,
        completed: reports.completed,
        overdue: reports.overdue
      };
    }
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'PENDING').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length;
    const completedToday = tasks.filter((task) => {
      if (task.status !== 'COMPLETED' || !task.updatedAt) return false;
      const updated = new Date(task.updatedAt);
      const today = new Date();
      return updated.toDateString() === today.toDateString();
    }).length;
    return { totalUsers: users.length, total, completedToday, pending, inProgress, completed, overdue };
  }, [isAdmin, reports, tasks, users.length]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">Welcome back, {currentUser?.name || 'User'}</h1>
        <p className="text-sm text-slate-400">
          {isAdmin ? 'Track team productivity and task progress.' : 'Here is a quick snapshot of your assigned work.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        {isAdmin && (
          <StatCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-5 h-5" />} />
        )}
        <StatCard title="Total Tasks" value={stats.total} icon={<ClipboardList className="w-5 h-5" />} />
        <StatCard title="Tasks Completed Today" value={stats.completedToday} icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCard title="Pending Tasks" value={stats.pending} icon={<Loader2 className="w-5 h-5" />} />
        <StatCard title="In Progress" value={stats.inProgress} icon={<CalendarCheck className="w-5 h-5" />} />
        <StatCard title="Overdue" value={stats.overdue} icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Overdue Tasks</h2>
          </CardHeader>
          <CardContent>
            {(!reports?.overdueTasks || reports.overdueTasks.length === 0) ? (
              <EmptyState title="No overdue tasks" description="Everything is on track." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.overdueTasks.map(task => (
                    <TableRow key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{task.assignedUser?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge variant={task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning' : 'default'}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'info' : 'warning'}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">My Tasks</h2>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <EmptyState title="No tasks assigned" description="Check back after your manager assigns work." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map(task => (
                    <TableRow key={task.id}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>
                        <Badge variant={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'info' : 'warning'}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning' : 'default'}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

