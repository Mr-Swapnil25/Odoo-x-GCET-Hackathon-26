import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, EmptyState, useRoleTheme, cn } from '../components/UI';
import { CalendarCheck, AlertTriangle, CheckCircle2, ClipboardList, Loader2, Users } from 'lucide-react';
import { Tilt3DCard } from '../components/animations/Tilt3DCard';
import { CountUpNumber } from '../components/animations/CountUpNumber';
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer';
import { generateOverdueNotifications, useNotificationStore } from '../lib/notificationStore';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// Typewriter hook
function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    hasRun.current = true;
    let i = 0;
    setDisplayed('');
    setDone(false);
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

export const Dashboard = () => {
  const { currentUser, tasks, users, reports, fetchReports } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const theme = useRoleTheme();
  const { addNotification, notifications } = useNotificationStore();
  const overdueCheckedRef = useRef(false);

  useEffect(() => {
    if (isAdmin) fetchReports();
  }, [isAdmin, fetchReports]);

  // Generate overdue notifications on first dashboard load
  useEffect(() => {
    if (!overdueCheckedRef.current && tasks.length > 0) {
      overdueCheckedRef.current = true;
      generateOverdueNotifications(tasks, addNotification, notifications);
    }
  }, [tasks, addNotification, notifications]);

  const firstName = currentUser?.name?.split(' ')[0] || 'User';
  const greeting = `${getGreeting()}, ${firstName}`;
  const { displayed: typedGreeting, done: typingDone } = useTypewriter(greeting);

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

  const statCards = [
    ...(isAdmin ? [{ title: 'Total Users', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, isOverdue: false }] : []),
    { title: 'Total Tasks', value: stats.total, icon: <ClipboardList className="w-5 h-5" />, isOverdue: false },
    { title: 'Completed Today', value: stats.completedToday, icon: <CheckCircle2 className="w-5 h-5" />, isOverdue: false },
    { title: 'Pending Tasks', value: stats.pending, icon: <Loader2 className="w-5 h-5" />, isOverdue: false },
    { title: 'In Progress', value: stats.inProgress, icon: <CalendarCheck className="w-5 h-5" />, isOverdue: false },
    { title: 'Overdue', value: stats.overdue, icon: <AlertTriangle className="w-5 h-5" />, isOverdue: true },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold text-white">
          <span>{typedGreeting}</span>
          {!typingDone && <span className="typing-cursor" />}
        </h1>
        <p className={cn("text-sm", theme.textMuted)}>
          {getFormattedDate()} · {isAdmin ? 'Track team productivity and task progress.' : 'Here is a quick snapshot of your assigned work.'}
        </p>
      </div>

      {/* Stat Cards */}
      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4" staggerDelay={0.08}>
        {statCards.map((card, idx) => (
          <StaggerItem key={card.title} animation="scaleUp">
            <Tilt3DCard className={cn(
              "h-full",
              card.isOverdue && card.value > 0 && "animate-overdue-pulse rounded-xl"
            )}>
              <Card variant="elevated" className={cn("p-6 h-full", card.isOverdue && card.value > 0 && "border-red-500/30")}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className={cn("text-sm font-medium", theme.textMuted)}>{card.title}</p>
                    <p className="text-3xl font-bold text-white tracking-tight">
                      <CountUpNumber end={card.value} />
                    </p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-xl",
                    card.isOverdue && card.value > 0
                      ? "bg-red-500/10 text-red-400"
                      : theme.isAdmin
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-purple-500/10 text-purple-400"
                  )}>
                    {card.icon}
                  </div>
                </div>
              </Card>
            </Tilt3DCard>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Tasks Table */}
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
