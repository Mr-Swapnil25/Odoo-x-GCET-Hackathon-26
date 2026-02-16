import React, { useEffect } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, EmptyState, StatCard, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from '../components/UI';
import { AlertTriangle, CalendarClock, ClipboardList, CheckCircle2, Loader2, CalendarCheck } from 'lucide-react';

export const Reports = () => {
  const { reports, fetchReports } = useStore();

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (!reports) {
    return (
      <EmptyState title="No report data" description="Generate tasks to see analytics." />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Task Reports</h1>
        <p className="text-sm text-slate-400">High-level insights and deadline risk view.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        <StatCard title="Total" value={reports.total} icon={<ClipboardList className="w-5 h-5" />} />
        <StatCard title="Pending" value={reports.pending} icon={<Loader2 className="w-5 h-5" />} />
        <StatCard title="In Progress" value={reports.inProgress} icon={<CalendarClock className="w-5 h-5" />} />
        <StatCard title="Completed" value={reports.completed} icon={<CheckCircle2 className="w-5 h-5" />} />
        <StatCard title="Due Soon" value={reports.dueSoon} icon={<CalendarCheck className="w-5 h-5" />} />
        <StatCard title="Overdue" value={reports.overdue} icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Overdue Tasks</h2>
        </CardHeader>
        <CardContent>
          {(!reports.overdueTasks || reports.overdueTasks.length === 0) ? (
            <EmptyState title="No overdue tasks" description="Everything is on schedule." />
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
                    <TableCell>{task.status}</TableCell>
                    <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

