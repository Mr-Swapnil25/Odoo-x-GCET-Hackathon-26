import React, { useState, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, CardContent, CardHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge, Button, Input, Select, EmptyState, Modal, useRoleTheme, cn
} from '../components/UI';
import { Tilt3DCard } from '../components/animations/Tilt3DCard';
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer';
import { GlassCard } from '../components/animations/GlassCard';
import {
  LayoutGrid, LayoutList, Send, MessageSquare, Trash2, Edit3, Clock, AlertTriangle, Filter
} from 'lucide-react';
import type { Task, TaskStatus, TaskComment } from '../types';
import toast from 'react-hot-toast';

type ViewMode = 'table' | 'cards';

const statusColors: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  PENDING: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  IN_PROGRESS: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  COMPLETED: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

const priorityColors: Record<string, string> = {
  HIGH: 'border-l-red-500',
  MEDIUM: 'border-l-amber-500',
  LOW: 'border-l-emerald-500',
};

function getDaysUntilDue(dueDate?: string | null): { text: string; urgent: boolean } {
  if (!dueDate) return { text: 'No due date', urgent: false };
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, urgent: true };
  if (diffDays === 0) return { text: 'Due today', urgent: true };
  if (diffDays <= 2) return { text: `${diffDays}d left`, urgent: true };
  return { text: `${diffDays}d left`, urgent: false };
}

export const TaskTracking = () => {
  const { currentUser, tasks, updateTask, deleteTask, fetchComments, addComment, users } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const theme = useRoleTheme();

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [commentModal, setCommentModal] = useState<{ isOpen: boolean; taskId: string; taskTitle: string }>({ isOpen: false, taskId: '', taskTitle: '' });
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [flashTaskId, setFlashTaskId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (statusFilter) result = result.filter(t => t.status === statusFilter);
    if (priorityFilter) result = result.filter(t => t.priority === priorityFilter);
    return result;
  }, [tasks, statusFilter, priorityFilter]);

  const handleStatusChange = useCallback(async (task: Task, newStatus: TaskStatus) => {
    const res = await updateTask(task.id, { status: newStatus });
    if (res.error) {
      toast.error(res.error);
    } else {
      setFlashTaskId(task.id);
      setTimeout(() => setFlashTaskId(null), 800);
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    }
  }, [updateTask]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Delete this task?')) return;
    const res = await deleteTask(id);
    if (res.error) toast.error(res.error);
    else toast.success('Task deleted');
  }, [deleteTask]);

  const openCommentModal = useCallback(async (task: Task) => {
    setCommentModal({ isOpen: true, taskId: task.id, taskTitle: task.title });
    setLoadingComments(true);
    const res = await fetchComments(task.id);
    setComments(res.data || []);
    setLoadingComments(false);
  }, [fetchComments]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return;
    const res = await addComment(commentModal.taskId, newComment.trim());
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Comment added');
      setNewComment('');
      const refreshed = await fetchComments(commentModal.taskId);
      setComments(refreshed.data || []);
    }
  }, [newComment, commentModal.taskId, addComment, fetchComments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#E8E8FF]">{isAdmin ? 'All Tasks' : 'My Tasks'}</h1>
          <p className={cn("text-sm mt-1", theme.textMuted)}>
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <Filter className={cn("w-4 h-4", theme.textMuted)} />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36 text-xs"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </Select>
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-36 text-xs"
            >
              <option value="">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
          </div>

          {/* View Toggle */}
          <div className={cn(
            "flex items-center rounded-xl border p-0.5",
            "bg-[#111827] border-white/6"
          )}>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'table'
                  ? theme.isAdmin ? "bg-blue-600 text-white" : "bg-violet-600 text-white"
                  : theme.textMuted + " hover:text-[#E8E8FF]"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'cards'
                  ? theme.isAdmin ? "bg-blue-600 text-white" : "bg-violet-600 text-white"
                  : theme.textMuted + " hover:text-[#E8E8FF]"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredTasks.length === 0 ? (
        <EmptyState title="No tasks found" description="Try changing your filters" />
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  {isAdmin && <TableHead>Assignee</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredTasks.map((task) => {
                    const dueInfo = getDaysUntilDue(task.dueDate);
                    return (
                      <motion.tr
                        key={task.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={cn(
                          "table-row-hover border-b transition-all",
                          "border-white/6 hover:bg-white/3",
                          flashTaskId === task.id && "bg-emerald-500/10"
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-[#E8E8FF] font-medium">{task.title}</span>
                            {dueInfo.urgent && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <span className={theme.textMuted}>{task.assignedUser?.name || 'Unassigned'}</span>
                          </TableCell>
                        )}
                        <TableCell>
                          <Select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                            className="text-xs w-32.5"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={task.priority === 'HIGH' ? 'danger' : task.priority === 'MEDIUM' ? 'warning' : 'default'}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-xs", dueInfo.urgent ? "text-red-400 font-medium" : theme.textMuted)}>
                            {dueInfo.text}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openCommentModal(task)}
                              className={cn("p-1.5 rounded-lg transition-all hover:bg-white/5", theme.textMuted, "hover:text-white")}
                              title="Comments"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Card View */
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const dueInfo = getDaysUntilDue(task.dueDate);
            const completed = task.status === 'COMPLETED';
            const scolor = statusColors[task.status];
            return (
              <StaggerItem key={task.id} animation="scaleUp">
                <Tilt3DCard maxTilt={4}>
                  <GlassCard elevation="medium" className={cn("p-5 border-l-4", priorityColors[task.priority] || '')}>
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className={cn("text-sm font-semibold text-[#E8E8FF] line-clamp-2", completed && "line-through opacity-60")}>
                        {task.title}
                      </h3>
                      <span className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full border", scolor.bg, scolor.text, scolor.border)}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className={cn("text-xs line-clamp-2 mb-3", theme.textMuted)}>{task.description}</p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 mb-4">
                      {isAdmin && task.assignedUser && (
                        <span className={cn("text-xs", theme.textMuted)}>
                          {task.assignedUser.name}
                        </span>
                      )}
                      <span className={cn(
                        "flex items-center gap-1 text-xs",
                        dueInfo.urgent ? "text-red-400" : theme.textMuted
                      )}>
                        <Clock className="w-3 h-3" />
                        {dueInfo.text}
                      </span>
                    </div>

                    {/* Progress Ring */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg width="28" height="28" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3" className="stroke-white/10" />
                          <circle
                            cx="18" cy="18" r="15" fill="none" strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={`${task.status === 'COMPLETED' ? 94 : task.status === 'IN_PROGRESS' ? 47 : 12
                              }, 94`}
                            transform="rotate(-90 18 18)"
                            className={cn(
                              task.status === 'COMPLETED' ? "stroke-emerald-400" :
                                task.status === 'IN_PROGRESS' ? "stroke-blue-400" : "stroke-amber-400"
                            )}
                            style={{ transition: 'stroke-dasharray 0.8s ease' }}
                          />
                        </svg>
                        <span className="text-xs text-white/60">
                          {task.status === 'COMPLETED' ? '100%' : task.status === 'IN_PROGRESS' ? '50%' : '10%'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                          className="text-[10px] w-27.5 py-1"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </Select>
                        <button
                          onClick={() => openCommentModal(task)}
                          className={cn("p-1.5 rounded-lg transition-all hover:bg-white/5", theme.textMuted)}
                          title="Comments"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                </Tilt3DCard>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}

      {/* Comment Modal */}
      <Modal
        isOpen={commentModal.isOpen}
        onClose={() => { setCommentModal({ isOpen: false, taskId: '', taskTitle: '' }); setComments([]); setNewComment(''); }}
        title={`Comments — ${commentModal.taskTitle}`}
      >
        <div className="space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {loadingComments ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className={cn("text-center py-6", theme.textMuted)}>No comments yet. Be the first!</p>
          ) : (
            <AnimatePresence>
              {comments.map((c, idx) => (
                <motion.div
                  key={c.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "p-3 rounded-xl border",
                    "bg-[#111827]/50 border-white/6"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#E8E8FF]">{c.user?.name || 'User'}</span>
                    <span className={cn("text-[10px]", theme.textMuted)}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className={cn("text-sm", theme.textMuted)}>{c.comment}</p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Add Comment */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
          />
          <Button onClick={handleAddComment} disabled={!newComment.trim()} size="sm">
            <Send className="w-4 h-4" />
          </Button>
          <span className={cn("text-[10px] shrink-0", theme.textMuted)}>{newComment.length}/500</span>
        </div>
      </Modal>
    </div>
  );
};
