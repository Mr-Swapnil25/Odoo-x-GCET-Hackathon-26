import type { Task, TaskStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const TOKEN_KEY = 'task-manager-token';

type ApiResponse<T> = { data?: T; error?: string };

const getAuthHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    });

    const contentType = res.headers.get('content-type') || '';
    const payload = contentType.includes('application/json') ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMessage = typeof payload === 'string'
        ? payload
        : payload?.error || payload?.message || 'Request failed';
      return { error: errorMessage };
    }

    return { data: payload as T };
  } catch (error: any) {
    return { error: error?.message || 'Network error' };
  }
};

export const setToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

type BackendTaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

const statusToClient: Record<BackendTaskStatus, TaskStatus> = {
  TODO: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'COMPLETED',
};

const statusToBackend: Record<TaskStatus, BackendTaskStatus> = {
  PENDING: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'DONE',
};

const mapTaskFromApi = (task: any): Task => {
  const backendStatus = (task?.status || 'TODO') as BackendTaskStatus;

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? undefined,
    assignedTo: task.assignedTo ?? null,
    assignedUser: task.assignedUser ?? null,
    priority: task.priority,
    status: statusToClient[backendStatus] || 'PENDING',
    dueDate: task.dueDate ?? null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
};

const mapTaskInputToApi = (data: any) => {
  if (!data || typeof data !== 'object') return data;

  const payload = { ...data };
  if (payload.status) {
    payload.status = statusToBackend[payload.status as TaskStatus] || payload.status;
  }
  return payload;
};

export const login = async (email: string, password: string) => {
  const res = await apiFetch<{ token: string; user: any; error?: string }>(`/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (res.error) return { error: res.error };
  return res.data || { error: 'Login failed' };
};

export const getMe = async () => {
  const res = await apiFetch<{ user: any }>(`/auth/me`);
  if (res.error) return { error: res.error };
  return res.data || { error: 'Failed to load user' };
};

export const getUsers = async () => {
  const res = await apiFetch<{ users: any[] }>(`/users`);
  if (res.error) return { error: res.error };
  return res.data || { users: [] };
};

export const createUser = async (data: { name: string; email: string; password: string; role: string }) => {
  const res = await apiFetch<{ user: any }>(`/users`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (res.error) return { error: res.error };
  return res.data || {};
};

export const updateUser = async (id: string, data: any) => {
  const res = await apiFetch<{ user: any }>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  if (res.error) return { error: res.error };
  return res.data || {};
};

export const deleteUser = async (id: string) => {
  const res = await apiFetch<{ success: boolean }>(`/users/${id}`, {
    method: 'DELETE'
  });
  if (res.error) return { error: res.error };
  return res.data || { success: true };
};

export const getTasks = async () => {
  const res = await apiFetch<{ tasks: any[] }>(`/tasks`);
  if (res.error) return { error: res.error };
  return {
    tasks: (res.data?.tasks || []).map(mapTaskFromApi),
  };
};

export const createTask = async (data: any) => {
  const payload = mapTaskInputToApi(data);
  const res = await apiFetch<{ task: any }>(`/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (res.error) return { error: res.error };
  return {
    task: res.data?.task ? mapTaskFromApi(res.data.task) : undefined,
  };
};

export const updateTask = async (id: string, data: any) => {
  const payload = mapTaskInputToApi(data);
  const res = await apiFetch<{ task: any }>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
  if (res.error) return { error: res.error };
  return {
    task: res.data?.task ? mapTaskFromApi(res.data.task) : undefined,
  };
};

export const deleteTask = async (id: string) => {
  const res = await apiFetch<{ success: boolean }>(`/tasks/${id}`, {
    method: 'DELETE'
  });
  if (res.error) return { error: res.error };
  return res.data || { success: true };
};

export const getTaskComments = async (taskId: string) => {
  const res = await apiFetch<{ comments: any[] }>(`/tasks/${taskId}/comments`);
  if (res.error) return { error: res.error, data: [] };
  return { data: res.data?.comments || [] };
};

export const addTaskComment = async (taskId: string, comment: string) => {
  const res = await apiFetch<{ comment: any }>(`/tasks/${taskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ comment })
  });
  if (res.error) return { error: res.error };
  return res.data || {};
};

export const getReportsSummary = async () => {
  const res = await apiFetch<{ reports: any }>(`/reports/summary`);
  if (res.error) return { error: res.error };
  if (!res.data?.reports) return { reports: null };

  const reports = res.data.reports;
  return {
    reports: {
      ...reports,
      overdueTasks: (reports.overdueTasks || []).map(mapTaskFromApi),
    },
  };
};

export const updateProfile = async (data: { name: string }) => {
  const res = await apiFetch<{ user: any }>(`/auth/profile`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (res.error) return { error: res.error };
  return res.data || {};
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }) => {
  const res = await apiFetch<{ success: boolean }>(`/auth/change-password`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (res.error) return { error: res.error };
  return res.data || { success: true };
};
