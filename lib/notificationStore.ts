import { create } from 'zustand';

export type NotificationType =
    | 'task_assigned'
    | 'task_status_changed'
    | 'task_comment'
    | 'task_overdue'
    | 'user_created'
    | 'task_due_soon';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    taskId?: string;
    userId?: string;
    priority?: 'low' | 'medium' | 'high';
}

const STORAGE_KEY = 'dayflow-notifications';
const MAX_NOTIFICATIONS = 50;

function loadFromStorage(): AppNotification[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.slice(0, MAX_NOTIFICATIONS) : [];
    } catch {
        return [];
    }
}

function saveToStorage(notifications: AppNotification[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
    } catch { /* ignore quota errors */ }
}

interface NotificationState {
    notifications: AppNotification[];
    addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllRead: () => void;
    clearAll: () => void;
    removeNotification: (id: string) => void;
    unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: loadFromStorage(),

    addNotification: (n) => {
        const notification: AppNotification = {
            ...n,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            read: false,
        };
        set((state) => {
            const updated = [notification, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
            saveToStorage(updated);
            return { notifications: updated };
        });
    },

    markAsRead: (id) => {
        set((state) => {
            const updated = state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            );
            saveToStorage(updated);
            return { notifications: updated };
        });
    },

    markAllRead: () => {
        set((state) => {
            const updated = state.notifications.map((n) => ({ ...n, read: true }));
            saveToStorage(updated);
            return { notifications: updated };
        });
    },

    clearAll: () => {
        saveToStorage([]);
        set({ notifications: [] });
    },

    removeNotification: (id) => {
        set((state) => {
            const updated = state.notifications.filter((n) => n.id !== id);
            saveToStorage(updated);
            return { notifications: updated };
        });
    },

    unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));

// Utility: get relative time string
export function getRelativeTime(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return new Date(isoString).toLocaleDateString();
}

// Utility: generate overdue notifications from tasks
export function generateOverdueNotifications(
    tasks: Array<{ id: string; title: string; status: string; dueDate?: string | null }>,
    addNotification: NotificationState['addNotification'],
    existingNotifications: AppNotification[]
) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Get IDs already notified today to avoid duplicates
    const todayStr = today.toISOString().split('T')[0];
    const notifiedToday = new Set(
        existingNotifications
            .filter((n) => n.timestamp.startsWith(todayStr) && (n.type === 'task_overdue' || n.type === 'task_due_soon'))
            .map((n) => `${n.type}-${n.taskId}`)
    );

    for (const task of tasks) {
        if (!task.dueDate || task.status === 'COMPLETED') continue;
        const due = new Date(task.dueDate);

        // Overdue
        if (due < today && !notifiedToday.has(`task_overdue-${task.id}`)) {
            const daysOverdue = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
            addNotification({
                type: 'task_overdue',
                title: 'Task Overdue',
                message: `"${task.title}" is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}`,
                taskId: task.id,
                priority: 'high',
            });
        }

        // Due soon (within 24 hours)
        if (due >= today && due < tomorrow && !notifiedToday.has(`task_due_soon-${task.id}`)) {
            addNotification({
                type: 'task_due_soon',
                title: 'Due Soon',
                message: `"${task.title}" is due today`,
                taskId: task.id,
                priority: 'medium',
            });
        }
    }
}
