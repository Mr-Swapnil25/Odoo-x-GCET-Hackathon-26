import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Badge, Button, Card, CardContent, CardHeader, EmptyState, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/UI';
import type { TaskPriority } from '../types';
import { toast } from 'react-hot-toast';

const priorityOptions = [
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' }
];

export const TaskManagement = () => {
  const { currentUser, users, tasks, createTask, fetchUsers, fetchTasks } = useStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'MEDIUM' as TaskPriority,
    dueDate: ''
  });

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchUsers, fetchTasks, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.dueDate) {
      toast.error('Due date is required');
      return;
    }
    const res = await createTask({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      assignedTo: form.assignedTo || null,
      priority: form.priority,
      dueDate: form.dueDate
    });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success('Task created');
    setForm({ title: '', description: '', assignedTo: '', priority: 'MEDIUM', dueDate: '' });
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Status</h1>
          <p className="text-sm text-slate-400">Track the latest status of your assigned work.</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">My Task Status</h2>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <EmptyState title="No tasks assigned" description="You will see task updates here once assigned." />
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
                  {tasks.map((task) => (
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Task Management</h1>
        <p className="text-sm text-slate-400">Create tasks, assign owners, and set deadlines.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">New Task</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Prepare sprint backlog"
            />
            <Select
              label="Assign To"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
              options={[{ label: 'Unassigned', value: '' }, ...users.map(u => ({ label: `${u.name} (${u.email})`, value: u.id }))]}
            />
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
              options={priorityOptions}
            />
            <Input
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              required
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full min-h-[120px] rounded-lg border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the task details"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Create Task</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Recent Assignments</h2>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <EmptyState title="No tasks yet" description="Create a task to see assignments here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Assignee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.slice(0, 8).map(task => (
                  <TableRow key={task.id}>
                    <TableCell>{task.title}</TableCell>
                    <TableCell>{task.assignedUser?.name || 'Unassigned'}</TableCell>
                    <TableCell>{task.status}</TableCell>
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
    </div>
  );
};

