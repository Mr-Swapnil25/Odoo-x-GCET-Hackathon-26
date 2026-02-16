import { create } from 'zustand';
import type { Task, TaskComment, ReportsSummary, Role, User } from './types';
import * as api from './lib/api';

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
    return {};
  },

  updateTask: async (id, data) => {
    const res = await api.updateTask(id, data);
    if (res.error) return { error: res.error };
    await get().fetchTasks();
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
    return {};
  },
}));

