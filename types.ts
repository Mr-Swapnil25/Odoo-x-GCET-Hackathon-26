export type Role = 'ADMIN' | 'USER';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string | null;
  assignedUser?: { id: string; name: string; email: string } | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  comment: string;
  createdAt: string;
}

export interface ReportsSummary {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueSoon: number;
  overdueTasks?: Task[];
}
