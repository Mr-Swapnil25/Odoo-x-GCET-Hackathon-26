"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Flipper, Flipped } from 'react-flip-toolkit';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

export interface NotificationUser {
  avatarUrl?: string;
  name: string;
  initials?: string;
  color?: string;
}

export interface NotificationItem {
  id: string;
  user: NotificationUser;
  message: string;
  timestamp?: string;
  priority?: 'low' | 'medium' | 'high';
  type?: 'info' | 'success' | 'warning' | 'error';
  fadingOut?: boolean;
}

export interface AnimatedNotificationProps {
  /** Maximum number of notifications to show at once */
  maxNotifications?: number;
  /** Interval between auto-generated notifications (in ms) */
  autoInterval?: number;
  /** Enable auto-generation of notifications */
  autoGenerate?: boolean;
  /** Custom notification data */
  notifications?: NotificationItem[];
  /** Custom messages for auto-generation */
  customMessages?: string[];
  /** Animation duration for fade transitions */
  animationDuration?: number;
  /** Position of the notification center */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  /** Width of notification cards */
  width?: number;
  /** Enable/disable user avatars */
  showAvatars?: boolean;
  /** Enable/disable timestamps */
  showTimestamps?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Callback when notification is clicked */
  onNotificationClick?: (notification: NotificationItem) => void;
  /** Callback when notification is dismissed */
  onNotificationDismiss?: (notification: NotificationItem) => void;
  /** Enable manual dismiss */
  allowDismiss?: boolean;
  /** Auto dismiss timeout (0 to disable) */
  autoDismissTimeout?: number;
  /** Custom API endpoint for fetching users */
  userApiEndpoint?: string;
  /** Theme variant */
  variant?: 'default' | 'minimal' | 'glass' | 'bordered';
}

const defaultMessages = [
  "New task assigned",
  "Task moved to In Progress",
  "Deadline updated",
  "Comment added to a task",
  "Task completed on time",
  "Priority escalated to High",
  "Weekly task report generated",
  "Overdue task alert",
  "Task reassigned to a new owner",
  "Milestone reached for project goals"
];

const Avatar: React.FC<{
  user: NotificationUser;
  showAvatar: boolean;
}> = ({ user, showAvatar }) => {
  if (!showAvatar) return null;

  return (
    <div
      className="flex-shrink-0 w-10 h-10 rounded-full 
      overflow-hidden bg-gradient-to-br from-primary/20 to-primary/40 
      flex items-center justify-center transition-all duration-300 
      hover:scale-110 backdrop-blur-sm"
      style={{ backgroundColor: user.color }}
    >
      {user.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={`${user.name} avatar`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-xs font-bold text-white drop-shadow-sm">
          {user.initials || user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
};

const Notification: React.FC<{
  notification: NotificationItem;
  showAvatars: boolean;
  showTimestamps: boolean;
  variant: string;
  onDismiss?: () => void;
  onClick?: () => void;
  allowDismiss: boolean;
}> = ({
  notification,
  showAvatars,
  showTimestamps,
  variant,
  onDismiss,
  onClick,
  allowDismiss
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'minimal':
        return "bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl";
      case 'glass':
        return "bg-slate-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl";
      case 'bordered':
        return "bg-slate-900/95 border-2 border-purple-500/30 backdrop-blur-lg shadow-xl";
      default:
        return "bg-slate-900/30 backdrop-blur-2xl border border-white/10 shadow-2xl";
    }
  };

  const getPriorityStyles = () => {
    switch (notification.priority) {
      case 'high':
        return 'border-l-4 border-l-red-500 shadow-red-500/20';
      case 'medium':
        return 'border-l-4 border-l-yellow-500 shadow-yellow-500/20';
      case 'low':
        return 'border-l-4 border-l-cyan-500 shadow-cyan-500/20';
      default:
        return 'border-l-4 border-l-purple-500/50 shadow-purple-500/20';
    }
  };

  return (
    <div
      className={cn(
        "group relative transition-all duration-500 ease-out transform hover:scale-[1.02] hover:-translate-y-1",
        "rounded-xl p-4 flex items-start gap-3 w-80 max-w-80 cursor-pointer",
        getVariantStyles(),
        getPriorityStyles(),
        notification.fadingOut && "animate-pulse"
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />

      <Avatar user={notification.user} showAvatar={showAvatars} />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-white/90 truncate">
            {notification.user.name}
          </h3>
          {showTimestamps && notification.timestamp && (
            <span className="text-xs text-slate-400/70 font-mono">
              {notification.timestamp}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-300/80 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>
      </div>

      {allowDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
          className="flex-shrink-0 w-5 h-5 text-slate-500/50 hover:text-slate-300 transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

async function fetchRandomUser(apiEndpoint?: string): Promise<NotificationUser> {
  try {
    const endpoint = apiEndpoint || "https://randomuser.me/api/";
    const res = await fetch(endpoint);
    const data = await res.json();
    const user = data.results[0];

    return {
      avatarUrl: user.picture?.large,
      name: `${user.name.first} ${user.name.last}`,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
    };
  } catch (error) {
    const names = ['Sarah Johnson', 'Michael Chen', 'Emily Davis', 'James Wilson', 'Amanda Garcia', 'David Lee', 'Jessica Brown', 'Robert Taylor'];
    const randomName = names[Math.floor(Math.random() * names.length)];

    return {
      name: randomName,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
    };
  }
}

function getRandomMessage(customMessages?: string[]): string {
  const messages = customMessages || defaultMessages;
  return messages[Math.floor(Math.random() * messages.length)];
}

async function generateNotification(
  customMessages?: string[],
  userApiEndpoint?: string
): Promise<NotificationItem> {
  const user = await fetchRandomUser(userApiEndpoint);
  return {
    id: crypto.randomUUID(),
    user,
    message: getRandomMessage(customMessages),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
  };
}

const AnimatedNotification: React.FC<AnimatedNotificationProps> = ({
  maxNotifications = 3,
  autoInterval = 2500,
  autoGenerate = true,
  notifications = [],
  customMessages,
  animationDuration = 800,
  position = 'center',
  width = 320,
  showAvatars = true,
  showTimestamps = true,
  className,
  onNotificationClick,
  onNotificationDismiss,
  allowDismiss = true,
  autoDismissTimeout = 0,
  userApiEndpoint,
  variant = 'glass'
}) => {
  const [notes, setNotes] = useState<NotificationItem[]>(notifications);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const dismissNotification = useCallback((id: string) => {
    setNotes(prev => {
      const noteToDismiss = prev.find(note => note.id === id);
      if (!noteToDismiss || noteToDismiss.fadingOut) {
        return prev;
      }

      const updatedNotes = prev.map(note =>
        note.id === id ? { ...note, fadingOut: true } : note
      );

      const timeout = dismissTimeouts.current.get(id);
      if (timeout) {
        clearTimeout(timeout);
        dismissTimeouts.current.delete(id);
      }

      setTimeout(() => {
        setNotes(current => current.filter(note => note.id !== id));
      }, animationDuration);

      return updatedNotes;
    });
  }, [animationDuration]);

  const addNote = useCallback(async () => {
    if (!autoGenerate) return;

    const newNote = await generateNotification(customMessages, userApiEndpoint);

    setNotes((prev) => {
      let currentNotes = [...prev];

      if (currentNotes.length >= maxNotifications) {
        const oldestNote = currentNotes[0];

        if (oldestNote && !oldestNote.fadingOut) {
          currentNotes = currentNotes.map((note, i) =>
            i === 0 ? { ...note, fadingOut: true } : note
          );

          setTimeout(() => {
            setNotes(current => current.filter(note => note.id !== oldestNote.id));
          }, animationDuration);
        }
      }

      return [...currentNotes, newNote];
    });

    if (autoDismissTimeout > 0) {
      const timeout = setTimeout(() => {
        dismissNotification(newNote.id);
      }, autoDismissTimeout);
      dismissTimeouts.current.set(newNote.id, timeout);
    }

    if (autoGenerate) {
      timeoutRef.current = setTimeout(addNote, autoInterval);
    }
  }, [
    autoGenerate,
    customMessages,
    userApiEndpoint,
    maxNotifications,
    autoInterval,
    autoDismissTimeout,
    animationDuration,
    dismissNotification
  ]);

  useEffect(() => {
    if (autoGenerate) {
      timeoutRef.current = setTimeout(addNote, 1000);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      dismissTimeouts.current.forEach(timeout => clearTimeout(timeout));
      dismissTimeouts.current.clear();
    };
  }, [addNote, autoGenerate]);

  useEffect(() => {
    if (notifications.length > 0 && JSON.stringify(notes) !== JSON.stringify(notifications)) {
      setNotes(notifications);
      dismissTimeouts.current.forEach(timeout => clearTimeout(timeout));
      dismissTimeouts.current.clear();
    }
  }, [notifications, notes]);

  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return 'fixed top-6 left-6 z-50';
      case 'top-right':
        return 'fixed top-6 right-6 z-50';
      case 'bottom-left':
        return 'fixed bottom-6 left-6 z-50';
      case 'bottom-right':
        return 'fixed bottom-6 right-6 z-50';
      default:
        return 'flex items-center justify-center min-h-auto p-6';
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes notification-enter {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
              filter: blur(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0px);
            }
          }

          @keyframes notification-exit {
            from {
              opacity: 1;
              transform: translateY(0) scale(1);
              filter: blur(0px);
            }
            to {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
              filter: blur(4px);
            }
          }

          .notification-enter {
            animation: notification-enter var(--animation-duration) cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          .notification-exit {
            animation: notification-exit var(--animation-duration) cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
        `
      }} />

      <div className={cn(getPositionStyles(), className)}>
        <Flipper flipKey={notes.map((note) => note.id).join("")}>
          <div className="flex flex-col gap-4 items-center" style={{ width }}>
            {notes.map((note) => (
              <Flipped key={note.id} flipId={note.id}>
                <div
                  className={cn(
                    "notification-item",
                    note.fadingOut ? "notification-exit" : "notification-enter"
                  )}
                  style={{ '--animation-duration': `${animationDuration}ms` } as React.CSSProperties}
                >
                  <Notification
                    notification={note}
                    showAvatars={showAvatars}
                    showTimestamps={showTimestamps}
                    variant={variant}
                    allowDismiss={allowDismiss}
                    onClick={() => onNotificationClick?.(note)}
                    onDismiss={() => {
                      onNotificationDismiss?.(note);
                      dismissNotification(note.id);
                    }}
                  />
                </div>
              </Flipped>
            ))}
          </div>
        </Flipper>
      </div>
    </>
  );
};

export default AnimatedNotification;

