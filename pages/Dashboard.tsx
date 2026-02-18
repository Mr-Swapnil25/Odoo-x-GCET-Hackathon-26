import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useStore } from '../store';
import { generateOverdueNotifications, useNotificationStore } from '../lib/notificationStore';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFormattedDate(): string {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return now.toLocaleDateString('en-US', options);
}

function getSolDate(): number {
  // Mock Sol date (Mars days) - you can customize this logic
  const startDate = new Date('2023-01-01');
  const now = new Date();
  const diff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getTimeOverdue(dueDate: string): string {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = now.getTime() - due.getTime();
  
  if (diff < 0) return 'Not overdue';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `-${hours}h ${minutes}m`;
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

  const firstName = currentUser?.name?.split(' ')[0] || 'Commander';
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

  const overdueTasks = useMemo(() => {
    if (isAdmin && reports?.overdueTasks) {
      return reports.overdueTasks.slice(0, 12); // Limit to 12 tasks
    }
    return tasks
      .filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED')
      .slice(0, 12);
  }, [isAdmin, reports, tasks]);

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-alert-red/10 text-alert-red border-alert-red/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Aurora Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-aurora-move"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-cyan/10 rounded-full blur-[120px] animate-aurora-move" style={{ animationDelay: '-5s' }}></div>
        <div className="absolute top-[20%] right-[30%] w-[30%] h-[30%] bg-electric-indigo/10 rounded-full blur-[100px] animate-aurora-move" style={{ animationDelay: '-2s' }}></div>
        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-grid-overlay opacity-[0.03]"></div>
        {/* Floating Particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/40 rounded-full"></div>
        <div className="absolute top-3/4 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full"></div>
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white/30 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/2 w-2 h-2 bg-primary/30 rounded-full blur-[1px]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 space-y-8">
        {/* Hero Section */}
        <header className="relative flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
          <div className="relative z-10">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/30 blur-[60px] rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/50">System Online</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg font-display">
              {typedGreeting}
              {!typingDone && (
                <span className="inline-block w-3 h-8 md:h-10 ml-1 bg-primary align-middle animate-cursor-blink"></span>
              )}
            </h1>
            <p className="text-white/40 mt-2 font-mono text-sm">
              {isAdmin ? 'System Admin' : 'Personnel'} | {getFormattedDate()} | Sol {getSolDate()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="glass-panel px-4 py-2 rounded-full text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>Filter Date</span>
            </button>
            <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(72,72,229,0.4)] transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New Directive</span>
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Stat Card 1 - Total Users (Admin only) */}
          {isAdmin && (
            <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-36 group hover:bg-white/3 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="p-1.5 rounded-full bg-primary/20 text-primary">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Total Users</p>
                <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-primary transition-colors">
                  {stats.totalUsers}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>Active</span>
              </div>
            </div>
          )}

          {/* Stat Card 2 - Total Tasks */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-36 group hover:bg-white/[0.03] transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className="p-1.5 rounded-full bg-neon-cyan/20 text-neon-cyan">
                <span className="material-symbols-outlined text-[20px]">task</span>
              </div>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Total Tasks</p>
              <h3 className="text-3xl font-bold text-white mt-1 group-hover:text-neon-cyan transition-colors">
                {stats.total}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+5%</span>
              <span className="text-white/30 ml-1">efficiency</span>
            </div>
          </div>

          {/* Stat Card 3 - Completed */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-36 group hover:bg-white/[0.03] transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-500">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </div>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Completed</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.completed}</h3>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1 mt-2">
              <div 
                className="bg-emerald-500 h-1 rounded-full" 
                style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          {/* Stat Card 4 - Pending */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-36 group hover:bg-white/[0.03] transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className="p-1.5 rounded-full bg-amber-500/20 text-amber-500">
                <span className="material-symbols-outlined text-[20px]">pending</span>
              </div>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Pending</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.pending}</h3>
            </div>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-mono">
              <span>awaiting review</span>
            </div>
          </div>

          {/* Stat Card 5 - In Progress */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between h-36 group hover:bg-white/[0.03] transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-50 group-hover:opacity-100 transition-opacity">
              <div className="p-1.5 rounded-full bg-blue-500/20 text-blue-500">
                <span className="material-symbols-outlined text-[20px]">rotate_right</span>
              </div>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium uppercase tracking-wider">In Progress</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.inProgress}</h3>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+4%</span>
            </div>
          </div>

          {/* Stat Card 6 - Overdue (Alert) */}
          <div className={`glass-panel p-5 rounded-2xl flex flex-col justify-between h-36 group hover:bg-white/[0.03] transition-colors relative overflow-hidden ${stats.overdue > 0 ? 'border-alert-red/50 animate-pulse-glow' : ''}`}>
            <div className="absolute top-0 right-0 p-3">
              <div className={`p-1.5 rounded-full bg-alert-red/20 text-alert-red ${stats.overdue > 0 ? 'animate-pulse' : ''}`}>
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
            </div>
            <div>
              <p className="text-alert-red text-xs font-bold uppercase tracking-wider">Critical Overdue</p>
              <h3 className="text-3xl font-bold text-white mt-1">{stats.overdue}</h3>
            </div>
            <div className="flex items-center gap-1 text-alert-red text-xs font-mono">
              <span className="material-symbols-outlined text-[14px]">priority_high</span>
              <span>Action Required</span>
            </div>
          </div>
        </section>

        {/* Overdue Tasks Table */}
        <section className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-2 rounded-full bg-alert-red animate-pulse"></div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                {isAdmin ? 'Critical Overdue Tasks' : 'My Tasks'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 uppercase tracking-widest font-mono hidden md:block">
                Sector 7-G
              </span>
              <button className="text-white/60 hover:text-white transition-colors">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {overdueTasks.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-4">
                  <span className="material-symbols-outlined text-emerald-500 text-[32px]">check_circle</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">All Clear!</h3>
                <p className="text-white/40 text-sm">
                  {isAdmin ? 'No overdue tasks. Everything is on track.' : 'No tasks assigned yet.'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-medium text-white/40 uppercase tracking-wider border-b border-white/5 bg-white/2">
                    <th className="px-6 py-4 font-mono">Task Directive</th>
                    <th className="px-6 py-4 font-mono">Assigned Officer</th>
                    <th className="px-6 py-4 font-mono">Priority Level</th>
                    <th className="px-6 py-4 font-mono">Status</th>
                    <th className="px-6 py-4 font-mono text-right">Deadline</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {overdueTasks.map((task) => (
                    <tr key={task.id} className="glass-table-row border-b border-white/5 group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white group-hover:text-primary transition-colors">
                            {task.title}
                          </span>
                          <span className="text-xs text-white/40 font-mono">ID: #{task.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-gradient-to-br from-primary to-electric-indigo flex items-center justify-center border border-white/10">
                            <span className="text-white text-xs font-bold">
                              {task.assignedUser?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="text-white/80">{task.assignedUser?.name || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(task.status)}`}>
                          <span className={`size-1.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-500' : task.status === 'IN_PROGRESS' ? 'bg-blue-500' : isOverdue(task.dueDate) ? 'bg-alert-red' : 'bg-white/40'}`}></span>
                          {task.status === 'IN_PROGRESS' ? 'In Progress' : task.status === 'COMPLETED' ? 'Completed' : isOverdue(task.dueDate) ? 'Overdue' : 'Pending'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-mono ${isOverdue(task.dueDate) && task.status !== 'COMPLETED' ? 'text-alert-red' : 'text-white/60'}`}>
                        {task.dueDate ? (
                          isOverdue(task.dueDate) && task.status !== 'COMPLETED' 
                            ? getTimeOverdue(task.dueDate)
                            : new Date(task.dueDate).toLocaleDateString()
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Bottom Status Bar */}
        <div className="flex justify-between items-center text-xs text-white/30 font-mono border-t border-white/5 pt-4">
          <div className="flex gap-4">
            <span>CPU: 34%</span>
            <span>MEM: 62%</span>
            <span>NET: 1.2 GB/s</span>
          </div>
          <div>ENCRYPTED CONNECTION // SECURE</div>
        </div>
      </div>
    </div>
  );
};
