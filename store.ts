import { create } from 'zustand';
import type { Task, TaskComment, ReportsSummary, Role, User } from './types';
import * as api from './lib/api';
import { useNotificationStore } from './lib/notificationStore';

interface AppState {
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  reports: ReportsSummary | null;
  isLoading: boolean;

  initializeSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;

  fetchUsers: () => Promise<void>;
  createUser: (data: { name: string; email: string; password: string; role: Role }) => Promise<{ error?: string }>;
  updateUser: (id: string, data: Partial<{ name: string; email: string; role: Role; password: string }>) => Promise<{ error?: string }>;
  deleteUser: (id: string) => Promise<{ error?: string }>;

  fetchTasks: () => Promise<void>;
  createTask: (data: Partial<Task>) => Promise<{ error?: string }>;
  updateTask: (id: string, data: Partial<Task>) => Promise<{ error?: string }>;
  deleteTask: (id: string) => Promise<{ error?: string }>;

  fetchReports: () => Promise<void>;

  fetchComments: (taskId: string) => Promise<{ data: TaskComment[]; error?: string }>;
  addComment: (taskId: string, comment: string) => Promise<{ error?: string }>;
}

const notify = useNotificationStore.getState().addNotification;

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  tasks: [],
  reports: null,
  isLoading: false,

  initializeSession: async () => {
    if (!api.getToken()) return;
    set({ isLoading: true });
    const res = await api.getMe();
    if (res.user) {
      set({ currentUser: res.user });
      await get().fetchTasks();
      if (res.user.role === 'ADMIN') {
        await get().fetchUsers();
        await get().fetchReports();
      }
    } else {
      api.clearToken();
      set({ currentUser: null });
    }
    set({ isLoading: false });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const res = await api.login(email, password);
    if (res.error || !res.user || !res.token) {
      set({ isLoading: false });
      return { error: res.error || 'Login failed' };
    }
    api.setToken(res.token);
    set({ currentUser: res.user });
    await get().fetchTasks();
    if (res.user.role === 'ADMIN') {
      await get().fetchUsers();
      await get().fetchReports();
    }
    set({ isLoading: false });
    return {};
  },

  logout: () => {
    api.clearToken();
    set({ currentUser: null, users: [], tasks: [], reports: null });
  },

  fetchUsers: async () => {
    const res = await api.getUsers();
    if (res.users) set({ users: res.users });
  },

  createUser: async (data) => {
    const res = await api.createUser(data);
    if (res.error) return { error: res.error };
    await get().fetchUsers();
    notify({
      type: 'user_created',
      title: 'New Team Member',
      message: `"${data.name}" has been added to the team`,
      priority: 'low',
    });
    return {};
  },

  updateUser: async (id, data) => {
    const res = await api.updateUser(id, data);
    if (res.error) return { error: res.error };
    await get().fetchUsers();
    return {};
  },

  deleteUser: async (id) => {
    const res = await api.deleteUser(id);
    if (res.error) return { error: res.error };
    await get().fetchUsers();
    return {};
  },

  fetchTasks: async () => {
    const res = await api.getTasks();
    if (res.tasks) set({ tasks: res.tasks });
  },

  createTask: async (data) => {
    const res = await api.createTask(data);
    if (res.error) return { error: res.error };
    await get().fetchTasks();
    const assignee = data.assignedTo
      ? get().users.find(u => u.id === data.assignedTo)
      : null;
    notify({
      type: 'task_assigned',
      title: 'Task Created',
      message: `"${data.title}" assigned to ${assignee?.name || 'unassigned'}`,
      taskId: undefined,
      priority: data.priority === 'HIGH' ? 'high' : data.priority === 'MEDIUM' ? 'medium' : 'low',
    });
    return {};
  },

  updateTask: async (id, data) => {
    const oldTask = get().tasks.find(t => t.id === id);
    const res = await api.updateTask(id, data);
    if (res.error) return { error: res.error };
    await get().fetchTasks();
    if (data.status && oldTask && data.status !== oldTask.status) {
      const statusLabel = data.status.replace('_', ' ').toLowerCase();
      notify({
        type: 'task_status_changed',
        title: 'Status Updated',
        message: `"${oldTask.title}" moved to ${statusLabel}`,
        taskId: id,
        priority: 'medium',
      });
    }
    return {};
  },

  deleteTask: async (id) => {
    const res = await api.deleteTask(id);
    if (res.error) return { error: res.error };
    await get().fetchTasks();
    return {};
  },

  fetchReports: async () => {
    const res = await api.getReportsSummary();
    if (res.reports) set({ reports: res.reports });
  },

  fetchComments: async (taskId) => {
    return api.getTaskComments(taskId);
  },

  addComment: async (taskId, comment) => {
    const res = await api.addTaskComment(taskId, comment);
    if (res.error) return { error: res.error };
    const task = get().tasks.find(t => t.id === taskId);
    notify({
      type: 'task_comment',
      title: 'New Comment',
      message: `Comment added on "${task?.title || 'a task'}"`,
      taskId,
      priority: 'low',
    });
    return {};
  },
}));

