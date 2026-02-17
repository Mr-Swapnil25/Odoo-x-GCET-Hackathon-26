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
  return res.data || { tasks: [] };
};

export const createTask = async (data: any) => {
  const res = await apiFetch<{ task: any }>(`/tasks`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (res.error) return { error: res.error };
  return res.data || {};
};

export const updateTask = async (id: string, data: any) => {
  const res = await apiFetch<{ task: any }>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
  if (res.error) return { error: res.error };
  return res.data || {};
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
  return res.data || { reports: null };
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

