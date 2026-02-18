import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../store';
import { cn } from '../components/UI';
import type { Task, TaskComment, TaskPriority, TaskStatus } from '../types';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Grid2x2,
  LayoutList,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';

type ViewMode = 'table' | 'cards';
type SelectFilterValue<T extends string> = 'ALL' | T;

const TASKS_PER_PAGE = 8;

const statusMeta: Record<TaskStatus, { label: string; dotClass: string; textClass: string }> = {
  PENDING: {
    label: 'Pending',
    dotClass: 'bg-white/40',
    textClass: 'text-white/80',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-300',
  },
  COMPLETED: {
    label: 'Completed',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-300',
  },
};

const priorityMeta: Record<TaskPriority, { label: string; className: string; cardAccent: string }> = {
  HIGH: {
    label: 'CRITICAL',
    className:
      'bg-alert-red/10 text-alert-red border border-alert-red/20 tracking-wide shadow-[0_0_10px_rgba(244,63,94,0.12)]',
    cardAccent: 'border-alert-red/40',
  },
  MEDIUM: {
    label: 'HIGH',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wide',
    cardAccent: 'border-amber-500/35',
  },
  LOW: {
    label: 'LOW',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wide',
    cardAccent: 'border-emerald-500/35',
  },
};

const getDueState = (dueDate?: string | null, status?: TaskStatus) => {
  if (!dueDate) {
    return {
      text: '--',
      className: 'text-white/40',
      showAlertIcon: false,
    };
  }

  if (status === 'COMPLETED') {
    return {
      text: '--',
      className: 'text-white/40',
      showAlertIcon: false,
    };
  }

  const now = Date.now();
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) {
    return {
      text: '--',
      className: 'text-white/40',
      showAlertIcon: false,
    };
  }

  const diffMs = due - now;
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueDays = Math.max(1, Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24)));
    return {
      text: `${overdueDays}d overdue`,
      className: 'text-alert-red',
      showAlertIcon: true,
    };
  }

  if (diffHours <= 24) {
    return {
      text: `${Math.max(1, diffHours)}h left`,
      className: 'text-amber-300',
      showAlertIcon: false,
    };
  }

  return {
    text: `${Math.max(1, diffDays)}d left`,
    className: 'text-white/70',
    showAlertIcon: false,
  };
};

const getVisiblePages = (currentPage: number, totalPages: number): Array<number | 'dots-left' | 'dots-right'> => {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'dots-left' | 'dots-right'> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('dots-left');
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < totalPages - 1) pages.push('dots-right');

  pages.push(totalPages);
  return pages;
};

const LoaderSpin = () => <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;

const ChevronDownMini = () => <span className="material-symbols-outlined text-[14px]">expand_more</span>;

export const TaskTracking = () => {
  const { currentUser, tasks, users, createTask, updateTask, deleteTask, fetchComments, addComment } = useStore();

  const isAdmin = currentUser?.role === 'ADMIN';

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SelectFilterValue<TaskStatus>>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<SelectFilterValue<TaskPriority>>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const [isCreateSidebarOpen, setIsCreateSidebarOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'MEDIUM' as TaskPriority,
    dueDate: '',
  });

  const [commentsModal, setCommentsModal] = useState<{ isOpen: boolean; taskId: string; taskTitle: string }>({
    isOpen: false,
    taskId: '',
    taskTitle: '',
  });
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  const teamMembers = useMemo(() => users.filter((user) => user.role === 'USER'), [users]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesQuery = !normalizedQuery
        || task.title.toLowerCase().includes(normalizedQuery)
        || task.description?.toLowerCase().includes(normalizedQuery)
        || task.assignedUser?.name.toLowerCase().includes(normalizedQuery);

      const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [tasks, query, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));
  const startIndex = (currentPage - 1) * TASKS_PER_PAGE;
  const endIndex = startIndex + TASKS_PER_PAGE;
  const visibleTasks = filteredTasks.slice(startIndex, endIndex);

  const showingFrom = filteredTasks.length === 0 ? 0 : startIndex + 1;
  const showingTo = filteredTasks.length === 0 ? 0 : Math.min(endIndex, filteredTasks.length);
  const visiblePages = getVisiblePages(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const resetCreateForm = useCallback(() => {
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      priority: 'MEDIUM',
      dueDate: '',
    });
  }, []);

  const handleCreateTask = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!isAdmin) return;
      if (!newTask.title.trim()) {
        toast.error('Task title is required');
        return;
      }

      setCreatingTask(true);
      const response = await createTask({
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        assignedTo: newTask.assignedTo || undefined,
        priority: newTask.priority,
        dueDate: newTask.dueDate || undefined,
      });
      setCreatingTask(false);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success('Task created');
      setIsCreateSidebarOpen(false);
      resetCreateForm();
      setCurrentPage(1);
    },
    [isAdmin, newTask, createTask, resetCreateForm],
  );

  const handleStatusChange = useCallback(
    async (task: Task, nextStatus: TaskStatus) => {
      if (task.status === nextStatus) return;
      setActiveTaskId(task.id);
      const response = await updateTask(task.id, { status: nextStatus });
      setActiveTaskId(null);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success(`Updated to ${statusMeta[nextStatus].label}`);
    },
    [updateTask],
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      if (!isAdmin) return;
      if (!window.confirm('Delete this task?')) return;

      const response = await deleteTask(taskId);
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success('Task deleted');
    },
    [isAdmin, deleteTask],
  );

  const openComments = useCallback(
    async (task: Task) => {
      setCommentsModal({ isOpen: true, taskId: task.id, taskTitle: task.title });
      setComments([]);
      setNewComment('');
      setLoadingComments(true);
      const response = await fetchComments(task.id);
      setComments(response.data || []);
      setLoadingComments(false);
    },
    [fetchComments],
  );

  const closeComments = useCallback(() => {
    setCommentsModal({ isOpen: false, taskId: '', taskTitle: '' });
    setComments([]);
    setNewComment('');
    setAddingComment(false);
  }, []);

  const handleAddComment = useCallback(async () => {
    const value = newComment.trim();
    if (!value) return;
    if (!commentsModal.taskId) return;

    setAddingComment(true);
    const response = await addComment(commentsModal.taskId, value);
    if (response.error) {
      setAddingComment(false);
      toast.error(response.error);
      return;
    }

    const refreshed = await fetchComments(commentsModal.taskId);
    setComments(refreshed.data || []);
    setNewComment('');
    setAddingComment(false);
    toast.success('Comment added');
  }, [newComment, commentsModal.taskId, addComment, fetchComments]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setCurrentPage(1);
  }, []);

  return (
    <div className="space-y-6 relative">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/50">Task Management</p>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            {isAdmin ? 'All Tasks' : 'My Tasks'}
          </h1>
          <p className="text-white/40 mt-1 text-sm font-medium">
            {filteredTasks.length.toLocaleString()} task{filteredTasks.length === 1 ? '' : 's'} found
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative group grow lg:grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-primary transition-colors" />
            <input
              className="bg-[#111117] border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 w-full lg:w-64 transition-all placeholder:text-white/20"
              placeholder="Search directives..."
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2 bg-[#111117] p-1 rounded-full border border-white/10">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as SelectFilterValue<TaskStatus>);
                  setCurrentPage(1);
                }}
                className="appearance-none px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/10 focus:outline-none focus:border-primary/50 pr-8"
              >
                <option value="ALL">Status: All</option>
                <option value="PENDING">Status: Pending</option>
                <option value="IN_PROGRESS">Status: In Progress</option>
                <option value="COMPLETED">Status: Completed</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/40">
                <ChevronDownMini />
              </span>
            </div>

            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(event) => {
                  setPriorityFilter(event.target.value as SelectFilterValue<TaskPriority>);
                  setCurrentPage(1);
                }}
                className="appearance-none px-3 py-1.5 rounded-full text-xs font-medium text-white/80 hover:text-white bg-transparent border border-white/10 focus:outline-none focus:border-primary/50 pr-8"
              >
                <option value="ALL">Priority: All</option>
                <option value="HIGH">Priority: High</option>
                <option value="MEDIUM">Priority: Medium</option>
                <option value="LOW">Priority: Low</option>
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/40">
                <ChevronDownMini />
              </span>
            </div>
          </div>

          <div className="flex bg-[#111117] p-1 rounded-full border border-white/10">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-full transition-colors',
                viewMode === 'table' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white',
              )}
              aria-label="Table view"
            >
              <LayoutList className="h-[18px] w-[18px]" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                'p-1.5 rounded-full transition-colors',
                viewMode === 'cards' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white',
              )}
              aria-label="Card view"
            >
              <Grid2x2 className="h-[18px] w-[18px]" />
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => setIsCreateSidebarOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white p-2 rounded-full shadow-[0_0_20px_rgba(72,72,229,0.4)] transition-all flex items-center justify-center"
              aria-label="Create task"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      </header>

      <section className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col w-full relative z-10 min-h-[540px]">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-10 text-center">
            <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Search className="h-5 w-5 text-white/50" />
            </div>
            <h3 className="text-lg font-semibold text-white mt-4">No tasks found</h3>
            <p className="text-white/50 text-sm mt-1">Try another search or clear active filters.</p>
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-2 text-xs text-white/80 hover:text-white px-3 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Clear filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-semibold text-blue-200/50 uppercase tracking-wider border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 font-mono w-[30%]">Task Title</th>
                    {isAdmin && <th className="px-6 py-4 font-mono">Assignee</th>}
                    <th className="px-6 py-4 font-mono">Status</th>
                    <th className="px-6 py-4 font-mono">Priority</th>
                    <th className="px-6 py-4 font-mono">Due Date</th>
                    <th className="px-6 py-4 font-mono text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <AnimatePresence mode="popLayout">
                    {visibleTasks.map((task) => {
                      const dueState = getDueState(task.dueDate, task.status);
                      const statusInfo = statusMeta[task.status];
                      const priorityInfo = priorityMeta[task.priority];
                      const assignedName = task.assignedUser?.name || 'Unassigned';
                      const assignedRole = task.assignedUser ? 'Team Member' : 'Open Slot';
                      return (
                        <motion.tr
                          key={task.id}
                          layout
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className={cn(
                            'glass-table-row border-b border-white/5 group relative',
                            activeTaskId === task.id && 'bg-primary/10',
                          )}
                        >
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-white group-hover:text-primary transition-colors text-base">
                                {task.title}
                              </span>
                              <span className="text-xs text-white/30 font-mono mt-1">#{task.id.slice(0, 8)} - Operations</span>
                            </div>
                          </td>

                          {isAdmin && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center border border-white/10 ring-2 ring-transparent group-hover:ring-primary/40 transition-all">
                                  <span className="text-[11px] font-bold text-white">
                                    {assignedName
                                      .split(' ')
                                      .map((part) => part[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-white/90 font-medium">{assignedName}</span>
                                  <span className="text-xs text-white/40">{assignedRole}</span>
                                </div>
                              </div>
                            </td>
                          )}

                          <td className="px-6 py-4">
                            <div className="relative inline-block text-left">
                              <select
                                className="appearance-none inline-flex items-center gap-2 justify-between w-34 rounded-md border border-white/10 shadow-sm pl-8 pr-8 py-1.5 bg-[#050810]/50 text-xs font-medium text-white hover:bg-white/10 focus:outline-none focus:border-primary/40 transition-colors backdrop-blur-md"
                                value={task.status}
                                onChange={(event) => handleStatusChange(task, event.target.value as TaskStatus)}
                              >
                                <option value="PENDING">Pending</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                              </select>
                              <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className={cn('h-2 w-2 rounded-full', statusInfo.dotClass)} />
                              </div>
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/30">
                                <ChevronDownMini />
                              </span>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold', priorityInfo.className)}>
                              {priorityInfo.label}
                            </span>
                          </td>

                          <td className="px-6 py-4 font-mono">
                            <div className={cn('flex items-center gap-2', dueState.className)}>
                              {dueState.showAlertIcon && <AlertTriangle className="h-4 w-4" />}
                              <span>{dueState.text}</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="row-actions opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                              <button
                                onClick={() => openComments(task)}
                                className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                title="Comments"
                              >
                                <MessageSquare className="h-[18px] w-[18px]" />
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="p-1.5 text-white/40 hover:text-alert-red hover:bg-alert-red/10 rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-[18px] w-[18px]" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            <div className="mt-auto border-t border-white/5 p-4 flex items-center justify-between gap-3">
              <div className="text-xs text-white/40 font-mono">
                Showing {showingFrom}-{showingTo} of {filteredTasks.length.toLocaleString()} tasks
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {visiblePages.map((page, index) => {
                    if (typeof page !== 'number') {
                      return (
                        <span key={`${page}-${index}`} className="text-white/30 text-xs px-1">
                          ...
                        </span>
                      );
                    }

                    const isActive = page === currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'h-8 min-w-8 px-2 rounded-lg text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-white'
                            : 'hover:bg-white/5 text-white/60 hover:text-white',
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 md:p-5">
              {visibleTasks.map((task) => {
                const dueState = getDueState(task.dueDate, task.status);
                const statusInfo = statusMeta[task.status];
                const priorityInfo = priorityMeta[task.priority];
                return (
                  <article
                    key={task.id}
                    className={cn(
                      'rounded-2xl border bg-[#050810]/40 backdrop-blur-md p-4 transition-all hover:bg-white/[0.03]',
                      'border-white/10',
                      priorityInfo.cardAccent,
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-white font-semibold leading-snug">{task.title}</h3>
                        <p className="text-xs text-white/30 font-mono mt-1">#{task.id.slice(0, 8)}</p>
                      </div>
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold', priorityInfo.className)}>
                        {priorityInfo.label}
                      </span>
                    </div>

                    {task.description && <p className="text-sm text-white/55 mt-3 line-clamp-2">{task.description}</p>}

                    <div className="mt-4 space-y-3">
                      {isAdmin && (
                        <div className="text-xs text-white/55">
                          Assignee:{' '}
                          <span className="text-white/80 font-medium">{task.assignedUser?.name || 'Unassigned'}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className={cn('inline-flex items-center gap-2 text-xs', statusInfo.textClass)}>
                          <span className={cn('h-2 w-2 rounded-full', statusInfo.dotClass)} />
                          {statusInfo.label}
                        </div>
                        <div className={cn('inline-flex items-center gap-1.5 text-xs', dueState.className)}>
                          <CalendarClock className="h-3.5 w-3.5" />
                          {dueState.text}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={task.status}
                          onChange={(event) => handleStatusChange(task, event.target.value as TaskStatus)}
                          className="flex-1 appearance-none rounded-md border border-white/10 px-2.5 py-1.5 bg-[#0C1221] text-xs text-white focus:outline-none focus:border-primary/40"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                        <button
                          onClick={() => openComments(task)}
                          className="p-2 rounded-md border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                          title="Comments"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-2 rounded-md border border-red-500/20 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-auto border-t border-white/5 p-4 flex items-center justify-between gap-3">
              <div className="text-xs text-white/40 font-mono">
                Showing {showingFrom}-{showingTo} of {filteredTasks.length.toLocaleString()} tasks
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {visiblePages.map((page, index) => {
                    if (typeof page !== 'number') {
                      return (
                        <span key={`${page}-${index}`} className="text-white/30 text-xs px-1">
                          ...
                        </span>
                      );
                    }

                    const isActive = page === currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          'h-8 min-w-8 px-2 rounded-lg text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-white'
                            : 'hover:bg-white/5 text-white/60 hover:text-white',
                        )}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <div className="flex justify-between items-center text-xs text-white/30 font-mono border-t border-white/5 pt-4">
        <div className="flex gap-4">
          <span>CPU: 34%</span>
          <span>MEM: 62%</span>
          <span>NET: 1.2 GB/s</span>
        </div>
        <div>ENCRYPTED CONNECTION // SECURE</div>
      </div>

      <AnimatePresence>
        {isCreateSidebarOpen && isAdmin && (
          <div className="fixed inset-0 z-[70]">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateSidebarOpen(false)}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              aria-label="Close create task sidebar"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-[#070B15]/95 border-l border-white/10 backdrop-blur-xl shadow-2xl flex flex-col"
            >
              <div className="h-16 px-5 border-b border-white/8 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40 font-mono">Task Control</p>
                  <h2 className="text-lg font-semibold text-white">Create New Task</h2>
                </div>
                <button
                  onClick={() => setIsCreateSidebarOpen(false)}
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-widest font-mono text-white/45">Task Title</label>
                  <input
                    value={newTask.title}
                    onChange={(event) => setNewTask((value) => ({ ...value, title: event.target.value }))}
                    className="w-full rounded-lg border bg-white/5 border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-white/20"
                    placeholder="Refuel Auxiliary Thrusters"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-widest font-mono text-white/45">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(event) => setNewTask((value) => ({ ...value, description: event.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border bg-white/5 border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-white/20 resize-none"
                    placeholder="Mission briefing and execution notes..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-widest font-mono text-white/45">Assignee</label>
                  <select
                    value={newTask.assignedTo}
                    onChange={(event) => setNewTask((value) => ({ ...value, assignedTo: event.target.value }))}
                    className="w-full rounded-lg border bg-white/5 border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="" className="bg-[#0f1628]">
                      Unassigned
                    </option>
                    {teamMembers.map((user) => (
                      <option key={user.id} value={user.id} className="bg-[#0f1628]">
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest font-mono text-white/45">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(event) => setNewTask((value) => ({ ...value, priority: event.target.value as TaskPriority }))}
                      className="w-full rounded-lg border bg-white/5 border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    >
                      <option value="LOW" className="bg-[#0f1628]">
                        Low
                      </option>
                      <option value="MEDIUM" className="bg-[#0f1628]">
                        Medium
                      </option>
                      <option value="HIGH" className="bg-[#0f1628]">
                        High
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest font-mono text-white/45">Due Date</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(event) => setNewTask((value) => ({ ...value, dueDate: event.target.value }))}
                      className="w-full rounded-lg border bg-white/5 border-white/10 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetCreateForm();
                      setIsCreateSidebarOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTask}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creatingTask ? <LoaderSpin /> : <Plus className="h-4 w-4" />}
                    {creatingTask ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {commentsModal.isOpen && (
          <div className="fixed inset-0 z-[72]">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeComments}
              className="absolute inset-0 bg-black/65 backdrop-blur-sm"
              aria-label="Close comments"
            />

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="absolute left-1/2 top-1/2 w-[95%] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0B1020]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40 font-mono">Task Thread</p>
                  <h3 className="text-base font-semibold text-white mt-1">{commentsModal.taskTitle}</h3>
                </div>
                <button
                  onClick={closeComments}
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="max-h-[42vh] overflow-y-auto custom-scrollbar space-y-3 pr-1">
                  {loadingComments ? (
                    <div className="space-y-2 py-2">
                      {[1, 2, 3].map((value) => (
                        <div key={value} className="h-14 rounded-xl skeleton" />
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-white/45">No comments yet.</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-white font-medium">{comment.userName || 'User'}</span>
                          <span className="text-[11px] text-white/40">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-white/75 mt-1.5">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/8">
                  <input
                    value={newComment}
                    onChange={(event) => setNewComment(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleAddComment();
                      }
                    }}
                    placeholder="Write a comment..."
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-white/20"
                  />
                  <button
                    onClick={() => void handleAddComment()}
                    disabled={!newComment.trim() || addingComment}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {addingComment ? <LoaderSpin /> : <Send className="h-4 w-4" />}
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
