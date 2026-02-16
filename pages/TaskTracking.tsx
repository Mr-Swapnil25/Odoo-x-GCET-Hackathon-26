import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Badge, Button, Card, CardContent, CardHeader, EmptyState, Modal, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Input } from '../components/UI';
import type { Task, TaskComment, TaskStatus } from '../types';
import { MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';

const statusOptions = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' }
];

const priorityBadge = (priority: string) => {
  if (priority === 'HIGH') return 'danger';
  if (priority === 'MEDIUM') return 'warning';
  return 'default';
};

export const TaskTracking = () => {
  const { tasks, updateTask, deleteTask, fetchComments, addComment, currentUser } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | TaskStatus>('ALL');
  const [commentModalTask, setCommentModalTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  const filteredTasks = useMemo(() => {
    if (selectedStatus === 'ALL') return tasks;
    return tasks.filter(task => task.status === selectedStatus);
  }, [tasks, selectedStatus]);

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
    const res = await updateTask(taskId, { status });
    if (res.error) toast.error(res.error);
    else toast.success('Task updated');
  };

  const handleDelete = async (taskId: string) => {
    const res = await deleteTask(taskId);
    if (res.error) toast.error(res.error);
    else toast.success('Task deleted');
  };

  const openComments = async (task: Task) => {
    setCommentModalTask(task);
    setComments([]);
    setCommentsLoading(true);
    const res = await fetchComments(task.id);
    if (res.error) toast.error(res.error);
    setComments(res.data || []);
    setCommentsLoading(false);
  };

  const submitComment = async () => {
    if (!commentModalTask || !commentInput.trim()) return;
    const res = await addComment(commentModalTask.id, commentInput.trim());
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setCommentInput('');
    const refreshed = await fetchComments(commentModalTask.id);
    setComments(refreshed.data || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{isAdmin ? 'All Tasks' : 'My Tasks'}</h1>
          <p className="text-sm text-slate-400">Update task status and collaborate with comments.</p>
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Filter by Status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | 'ALL')}
            options={[{ label: 'All', value: 'ALL' }, ...statusOptions]}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">{isAdmin ? 'Team Tasks' : 'Task Status'}</h2>
        </CardHeader>
        <CardContent>
          {filteredTasks.length === 0 ? (
            <EmptyState title="No tasks found" description="Try adjusting the filters or check back later." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map(task => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-white">{task.title}</p>
                        {task.description && <p className="text-xs text-slate-400">{task.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell>{task.assignedUser?.name || 'Unassigned'}</TableCell>
                    <TableCell>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        className="bg-transparent border border-slate-600 rounded-md px-2 py-1 text-sm text-white"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-slate-800">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityBadge(task.priority)}>{task.priority}</Badge>
                    </TableCell>
                    <TableCell>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openComments(task)}>
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Comments
                        </Button>
                        {isAdmin && (
                          <Button variant="danger" size="sm" onClick={() => handleDelete(task.id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={!!commentModalTask}
        onClose={() => {
          setCommentModalTask(null);
          setComments([]);
          setCommentInput('');
        }}
        title={commentModalTask ? `Comments: ${commentModalTask.title}` : 'Comments'}
      >
        {commentsLoading ? (
          <p className="text-sm text-slate-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <EmptyState title="No comments yet" description="Start the discussion by adding a note." />
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-3 rounded-lg bg-slate-900/40 border border-slate-700">
                <p className="text-sm text-white">{comment.comment}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {comment.userName || 'User'} - {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <Input
            label="Add a comment"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Share progress, blockers, or notes"
          />
          <Button onClick={submitComment}>Submit Comment</Button>
        </div>
      </Modal>
    </div>
  );
};

