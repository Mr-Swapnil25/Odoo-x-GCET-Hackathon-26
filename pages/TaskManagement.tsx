import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../components/UI';
import type { Task, TaskStatus, TaskPriority } from '../types';
import toast from 'react-hot-toast';

import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../components/UI';
import type { Task, TaskStatus, TaskPriority } from '../types';
import toast from 'react-hot-toast';

function getFormattedDate(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function getSolDate(): number {
  const startDate = new Date('2023-01-01');
  const now = new Date();
  const diff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export const TaskManagement = () => {
  const { currentUser, tasks, users, createTask, updateTask } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Form state
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    assignedTo: '', 
    priority: 'MEDIUM' as TaskPriority, 
    dueDate: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { 
      toast.error('Task title is required'); 
      return; 
    }
    
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
      setFormData({ title: '', description: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' });
      toast.success('🚀 Task directive created successfully');
    }
  }, [formData, createTask]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(query) ||
      task.description?.toLowerCase().includes(query) ||
      task.assignedUser?.name.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-alert-red/10 text-alert-red border-alert-red/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
      case 'IN_PROGRESS':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]';
      default:
        return 'bg-white/5 text-white/60 border-white/10';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-400';
      case 'IN_PROGRESS':
        return 'bg-blue-400 animate-pulse';
      default:
        return 'bg-white/40';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-aurora-move"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-cyan/10 rounded-full blur-[120px] animate-aurora-move" style={{ animationDelay: '-5s' }}></div>
        <div className="absolute top-[20%] right-[30%] w-[30%] h-[30%] bg-electric-indigo/10 rounded-full blur-[100px] animate-aurora-move" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute inset-0 bg-grid-overlay opacity-[0.03]"></div>
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
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/50">Mission Log Active</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg font-display">
              Task Management
            </h1>
            <p className="text-white/40 mt-2 font-mono text-sm">
              Create and manage tasks for your team
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-gradient-to-r from-electric-indigo to-primary hover:from-primary hover:to-electric-indigo text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all flex items-center gap-2 transform hover:scale-105"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>New Task</span>
            </button>
          </div>
        </header>

        {/* Create Task Form */}
        {isAdmin && (
          <section className="glass-panel rounded-2xl p-6 md:p-8 shimmer-border transition-all duration-500">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined">edit_document</span>
              </div>
              <h2 className="text-lg font-bold text-white">Create New Directive</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task Title */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-white/50">
                    Task Directive Title
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-white/30 material-symbols-outlined text-[20px]">
                      title
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white/5 border-white/10 text-white focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all placeholder-white/20"
                      placeholder="e.g. Recalibrate Navigation Array"
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Assigned Officer */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-white/50">
                    Assigned Officer
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-white/30 material-symbols-outlined text-[20px]">
                      person
                    </span>
                    <select
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white/5 border-white/10 text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData(p => ({ ...p, assignedTo: e.target.value }))}
                    >
                      <option value="" className="bg-slate-900">Assign Personnel...</option>
                      {users.filter(u => u.role === 'USER').map(user => (
                        <option key={user.id} value={user.id} className="bg-slate-900">
                          {user.name}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-2.5 text-white/30 material-symbols-outlined pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Priority Level */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-white/50">
                    Priority Level
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-white/30 material-symbols-outlined text-[20px]">
                      priority_high
                    </span>
                    <select
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white/5 border-white/10 text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      value={formData.priority}
                      onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value as TaskPriority }))}
                    >
                      <option value="LOW" className="bg-slate-900">Low (Routine)</option>
                      <option value="MEDIUM" className="bg-slate-900">Medium (Standard)</option>
                      <option value="HIGH" className="bg-slate-900">High (Urgent)</option>
                    </select>
                    <span className="absolute right-3 top-2.5 text-white/30 material-symbols-outlined pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Target Deadline */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-white/50">
                    Target Deadline
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-white/30 material-symbols-outlined text-[20px]">
                      event
                    </span>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-white/5 border-white/10 text-white outline-none transition-all focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(p => ({ ...p, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Mission Briefing */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase tracking-wider text-white/50">
                  Mission Briefing
                </label>
                <textarea
                  className="w-full p-4 rounded-lg border bg-white/5 border-white/10 text-white outline-none transition-all resize-none placeholder-white/20 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="Enter detailed mission parameters and objectives..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  className="px-6 py-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
                  type="button"
                  onClick={() => setFormData({ title: '', description: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' })}
                >
                  Cancel
                </button>
                <button
                  className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={submitting}
                >
                  <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                    {submitting ? 'hourglass_empty' : 'check'}
                  </span>
                  {submitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Recent Assignments Table */}
        <section className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-[20px]">list_alt</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">Recent Assignments</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute left-3 top-2 text-white/30 material-symbols-outlined text-[16px]">
                  search
                </span>
                <input
                  className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50 w-48 transition-all"
                  placeholder="Search logs..."
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="text-white/60 hover:text-white transition-colors">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredTasks.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <span className="material-symbols-outlined text-primary text-[32px]">
                    {searchQuery ? 'search_off' : 'task_alt'}
                  </span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  {searchQuery ? 'No tasks found' : 'No tasks yet'}
                </h3>
                <p className="text-white/40 text-sm">
                  {searchQuery ? 'Try adjusting your search query' : 'Create your first task directive above'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-medium text-white/40 uppercase tracking-wider border-b border-white/5 bg-white/2">
                    <th className="px-6 py-4 font-mono">Directive Title</th>
                    <th className="px-6 py-4 font-mono">Assigned Officer</th>
                    <th className="px-6 py-4 font-mono">Priority</th>
                    <th className="px-6 py-4 font-mono">Status</th>
                    <th className="px-6 py-4 font-mono text-right">Deadline</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="glass-table-row border-b border-white/5 group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-white group-hover:text-primary transition-colors">
                            {task.title}
                          </span>
                          <span className="text-xs text-white/40 font-mono">
                            ID: #{task.id.slice(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-gradient-to-br from-primary to-electric-indigo flex items-center justify-center border border-white/10">
                            <span className="text-white text-xs font-bold">
                              {task.assignedUser?.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <span className="text-white/80">
                            {task.assignedUser?.name || 'Unassigned'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityBadgeColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(task.status)}`}>
                          <span className={`size-1.5 rounded-full ${getStatusDot(task.status)}`}></span>
                          {getStatusLabel(task.status)}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-mono ${
                        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
                          ? 'text-alert-red'
                          : 'text-white/70'
                      }`}>
                        {task.dueDate 
                          ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredTasks.length > 0 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
              <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
              <div className="flex gap-2">
                <button className="hover:text-white disabled:opacity-50 transition-colors" disabled>
                  Previous
                </button>
                <button className="hover:text-white transition-colors" disabled>
                  Next
                </button>
              </div>
            </div>
          )}
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
