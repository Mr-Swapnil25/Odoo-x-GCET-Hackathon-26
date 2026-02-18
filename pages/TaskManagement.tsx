import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Button, Input, Select, EmptyState, useRoleTheme, cn
} from '../components/UI';
import { GlassCard } from '../components/animations/GlassCard';
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer';
import {
  Plus, Check, Loader2, Clock, AlertTriangle, CalendarCheck, ArrowRight
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '../types';
import toast from 'react-hot-toast';

const KANBAN_COLUMNS: { status: TaskStatus; label: string; icon: React.ReactNode; gradient: string }[] = [
  { status: 'PENDING', label: 'Pending', icon: <Clock className="w-4 h-4" />, gradient: 'from-amber-500/20 to-amber-600/5' },
  { status: 'IN_PROGRESS', label: 'In Progress', icon: <Loader2 className="w-4 h-4" />, gradient: 'from-blue-500/20 to-blue-600/5' },
  { status: 'COMPLETED', label: 'Completed', icon: <Check className="w-4 h-4" />, gradient: 'from-emerald-500/20 to-emerald-600/5' },
];

export const TaskManagement = () => {
  const { currentUser, tasks, users, createTask, updateTask } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const theme = useRoleTheme();

  // Admin form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', assignedTo: '', priority: 'MEDIUM' as TaskPriority, dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);
    const res = await createTask({
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      assignedTo: formData.assignedTo || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate || undefined,
    } as any);
    setSubmitting(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      setFormData({ title: '', description: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' });
      toast.success('Task created');
    }
  }, [formData, createTask]);

  // User kanban columns
  const kanbanData = useMemo(() => {
    return KANBAN_COLUMNS.map(col => ({
      ...col,
      tasks: tasks.filter(t => t.status === col.status),
    }));
  }, [tasks]);

  if (isAdmin) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Task Management</h1>
            <p className={cn("text-sm mt-1", theme.textMuted)}>Create and manage tasks for your team</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
            {showForm ? 'Cancel' : <><Plus className="w-4 h-4 mr-1" /> New Task</>}
          </Button>
        </div>

        {/* Create Task Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <GlassCard elevation="high" gradientBorder className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                      <label className="block text-sm font-medium text-white mb-1.5">Title *</label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                        placeholder="Task title"
                        required
                      />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                      <label className="block text-sm font-medium text-white mb-1.5">Assign To</label>
                      <Select
                        value={formData.assignedTo}
                        onChange={(e) => setFormData(p => ({ ...p, assignedTo: e.target.value }))}
                      >
                        <option value="">Unassigned</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </Select>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <label className="block text-sm font-medium text-white mb-1.5">Priority</label>
                      <Select
                        value={formData.priority}
                        onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value as TaskPriority }))}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </Select>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                      <label className="block text-sm font-medium text-white mb-1.5">Due Date</label>
                      <Input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                      />
                    </motion.div>
                  </div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <label className="block text-sm font-medium text-white mb-1.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                      placeholder="Task description..."
                      rows={3}
                      className={cn(
                        "w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 resize-none focus:outline-none transition-all",
                        theme.isAdmin
                          ? "bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                          : "bg-[#1a1625] border border-[#2d2249] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30"
                      )}
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="flex justify-end">
                    <Button type="submit" disabled={submitting} className="relative overflow-hidden">
                      {submitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Creating...</>
                      ) : success ? (
                        <><Check className="w-4 h-4 mr-1" /> Created!</>
                      ) : (
                        <><Plus className="w-4 h-4 mr-1" /> Create Task</>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Assignments Table */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Recent Assignments</h2>
          </CardHeader>
          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <EmptyState title="No tasks yet" description="Create your first task above" />
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
                  {tasks.slice(0, 10).map(task => (
                    <TableRow key={task.id} className="table-row-hover">
                      <TableCell>
                        <span className="text-white font-medium">{task.title}</span>
                      </TableCell>
                      <TableCell>{task.assignedUser?.name || 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge variant={task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning' : 'default'}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={task.status === 'COMPLETED' ? 'success' : task.status === 'IN_PROGRESS' ? 'info' : 'warning'}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // USER VIEW: Kanban columns
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Task Status</h1>
        <p className={cn("text-sm mt-1", theme.textMuted)}>Manage your assigned tasks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {kanbanData.map((column) => (
          <div key={column.status}>
            {/* Column Header */}
            <div className={cn(
              "flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-gradient-to-r",
              column.gradient
            )}>
              <span className={cn(
                column.status === 'PENDING' ? 'text-amber-400' :
                  column.status === 'IN_PROGRESS' ? 'text-blue-400' : 'text-emerald-400'
              )}>
                {column.icon}
              </span>
              <h3 className="text-sm font-semibold text-white">{column.label}</h3>
              <span className={cn(
                "ml-auto text-xs font-medium px-2 py-0.5 rounded-full",
                theme.isAdmin ? "bg-slate-800 text-slate-400" : "bg-[#1a1625] text-[#a090cb]"
              )}>
                {column.tasks.length}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-3 min-h-[200px]">
              <AnimatePresence>
                {column.tasks.length === 0 ? (
                  <div className={cn(
                    "flex items-center justify-center h-[120px] rounded-xl border-2 border-dashed",
                    theme.isAdmin ? "border-slate-800 text-slate-600" : "border-[#2d2249] text-[#5e5680]"
                  )}>
                    <p className="text-xs">No tasks</p>
                  </div>
                ) : (
                  column.tasks.map((task, idx) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <GlassCard elevation="low" className={cn(
                        "p-4 border-l-4",
                        task.priority === 'HIGH' ? 'border-l-red-500' :
                          task.priority === 'MEDIUM' ? 'border-l-amber-500' : 'border-l-emerald-500'
                      )}>
                        <h4 className={cn(
                          "text-sm font-medium text-white mb-2",
                          task.status === 'COMPLETED' && "line-through opacity-60"
                        )}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className={cn("text-xs mb-3 line-clamp-2", theme.textMuted)}>{task.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning' : 'default'} className="text-[10px]">
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className={cn("text-[10px] flex items-center gap-1",
                                new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? "text-red-400" : theme.textMuted
                              )}>
                                <Clock className="w-3 h-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          {/* Quick status change */}
                          {task.status !== 'COMPLETED' && (
                            <button
                              onClick={() => {
                                const next: TaskStatus = task.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED';
                                updateTask(task.id, { status: next }).then(r => {
                                  if (r.error) toast.error(r.error);
                                  else toast.success(`Moved to ${next.replace('_', ' ')}`);
                                });
                              }}
                              className={cn(
                                "p-1.5 rounded-lg transition-all text-xs",
                                theme.isAdmin ? "text-blue-400 hover:bg-blue-500/10" : "text-purple-400 hover:bg-purple-500/10"
                              )}
                              title={task.status === 'PENDING' ? 'Start task' : 'Complete task'}
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
