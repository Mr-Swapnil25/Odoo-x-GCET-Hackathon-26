import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import WaveBackground from './WaveBackground';
import { ThemeProvider } from '../lib/ThemeContext';
import { useNotificationStore, getRelativeTime, type AppNotification } from '../lib/notificationStore';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Clock,
  FileText,
  LogOut,
  Menu,
  X,
  UserCircle,
  Bell,
  ChevronDown,
  Infinity,
  CheckCheck,
  Trash2,
  ClipboardList,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  ArrowRight,
  Search
} from 'lucide-react';
import { cn } from './UI';

// Notification type icon map
const notifIconMap: Record<string, React.ReactNode> = {
  task_assigned: <ClipboardList className="w-4 h-4" />,
  task_status_changed: <ArrowRight className="w-4 h-4" />,
  task_comment: <MessageSquare className="w-4 h-4" />,
  task_overdue: <AlertTriangle className="w-4 h-4" />,
  task_due_soon: <Clock className="w-4 h-4" />,
  user_created: <UserPlus className="w-4 h-4" />,
};

// Notification type color map
const notifColorMap: Record<string, { bg: string; text: string }> = {
  task_assigned: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  task_status_changed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  task_comment: { bg: 'bg-cyan-500/15', text: 'text-cyan-400' },
  task_overdue: { bg: 'bg-red-500/15', text: 'text-red-400' },
  task_due_soon: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  user_created: { bg: 'bg-violet-500/15', text: 'text-violet-400' },
};

export const Layout = () => {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);

  const { notifications, markAsRead, markAllRead, clearAll, unreadCount } = useNotificationStore();
  const currentUnread = unreadCount();

  // Bell shake when new notification arrives
  useEffect(() => {
    if (currentUnread > prevUnreadRef.current && currentUnread > 0) {
      setBellShake(true);
      const timeout = setTimeout(() => setBellShake(false), 600);
      return () => clearTimeout(timeout);
    }
    prevUnreadRef.current = currentUnread;
  }, [currentUnread]);

  // Hidden demo reset shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if (window.confirm('Reset demo data? This will clear all data and reload.')) {
          localStorage.clear();
          window.location.reload();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    setIsNotificationOpen(false);
    if (notif.taskId) {
      navigate('/tasks');
    }
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'ADMIN';

  const navItems = isAdmin
    ? [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/users', icon: Users, label: 'Users' },
      { to: '/tasks', icon: CalendarCheck, label: 'All Tasks' },
      { to: '/my-tasks', icon: Clock, label: 'Task Management' },
      { to: '/reports', icon: FileText, label: 'Analytics' },
    ]
    : [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/tasks', icon: CalendarCheck, label: 'My Tasks' },
      { to: '/my-tasks', icon: Clock, label: 'Task Status' },
      { to: '/profile', icon: UserCircle, label: 'Profile' },
    ];

  const waveColorTheme = isAdmin ? 'admin' : 'user';

  const themeColors = {
    primary: isAdmin ? '#3B82F6' : '#8B5CF6',
    primaryLight: isAdmin ? '#60A5FA' : '#A78BFA',
    gradientFrom: isAdmin ? '#1E3A8A' : '#4C1D95',
    gradientTo: isAdmin ? '#3B82F6' : '#8B5CF6',
  };

  return (
    <ThemeProvider role={currentUser.role}>
      <div
        className="min-h-screen relative bg-[#0A0E1A]"
        data-role={isAdmin ? 'admin' : 'user'}
      >
        <WaveBackground
          colorTheme={waveColorTheme}
          backdropBlurAmount="lg"
        />

        {/* ========== FIXED LEFT SIDEBAR (Desktop) ========== */}
        <aside className={cn(
          "fixed top-0 left-0 bottom-0 z-40 w-65 hidden lg:flex flex-col",
          "bg-[#0D1117]/95 backdrop-blur-xl border-r border-white/6"
        )}>
          {/* Accent glow line on right edge */}
          <div
            className="absolute top-0 right-0 w-px h-full sidebar-glow-line"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${themeColors.primaryLight}40 30%, ${themeColors.primaryLight}20 70%, transparent 100%)`
            }}
          />

          {/* Logo / Brand */}
          <div className="h-16 flex items-center gap-3 px-6 shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`,
                boxShadow: `0 8px 20px -4px ${themeColors.primary}40`,
              }}
            >
              <Infinity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#E8E8FF] tracking-tight">
              TaskFlow
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to ||
                (item.to !== '/' && location.pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "sidebar-nav-item",
                    isActive && "active"
                  )}
                >
                  <item.icon className={cn(
                    "w-4.5 h-4.5 shrink-0",
                    isActive
                      ? isAdmin ? "text-blue-400" : "text-violet-400"
                      : ""
                  )} />
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveIndicator"
                      className="absolute inset-0 rounded-xl -z-10"
                      style={{
                        background: isAdmin
                          ? 'rgba(59, 130, 246, 0.1)'
                          : 'rgba(139, 92, 246, 0.1)',
                      }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer: User Info + Notifications + Logout */}
          <div className="border-t border-white/6 p-3 shrink-0 space-y-2">
            {/* Notification Bell */}
            <div className="relative" ref={notifPanelRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  "text-[#A0AABF] hover:text-[#E8E8FF] hover:bg-white/4",
                  bellShake && "animate-bell-shake"
                )}
              >
                <Bell className="w-4.5 h-4.5" />
                <span>Notifications</span>
                {currentUnread > 0 && (
                  <span className={cn(
                    "ml-auto flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold text-white",
                    isAdmin ? "bg-blue-500" : "bg-violet-500"
                  )}>
                    {currentUnread > 9 ? '9+' : currentUnread}
                  </span>
                )}
              </button>

              {/* Notification Panel (pops up from sidebar) */}
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className={cn(
                      "absolute left-full bottom-0 ml-2 w-80 sm:w-96 max-h-120 flex flex-col",
                      "backdrop-blur-xl rounded-xl shadow-2xl shadow-black/50 overflow-hidden border",
                      "bg-[#0D1117]/98 border-white/8"
                    )}
                  >
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                      <h3 className="text-sm font-semibold text-[#E8E8FF]">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {currentUnread > 0 && (
                          <button
                            onClick={markAllRead}
                            className={cn("text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors",
                              isAdmin ? "text-blue-400 hover:bg-blue-500/10" : "text-violet-400 hover:bg-violet-500/10"
                            )}
                          >
                            <CheckCheck className="w-3 h-3" />
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAll}
                            className="text-xs text-red-400 hover:bg-red-500/10 px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4">
                          <Bell className="w-8 h-8 mb-2 text-[#64748B]" />
                          <p className="text-sm text-[#64748B]">
                            No notifications yet
                          </p>
                        </div>
                      ) : (
                        <div className="py-1">
                          {notifications.slice(0, 20).map((notif, idx) => {
                            const colors = notifColorMap[notif.type] || notifColorMap.task_assigned;
                            return (
                              <motion.button
                                key={notif.id}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03, duration: 0.2 }}
                                onClick={() => handleNotificationClick(notif)}
                                className={cn(
                                  "w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b last:border-b-0",
                                  "border-white/4 hover:bg-white/3",
                                  !notif.read && (isAdmin ? "bg-blue-500/5" : "bg-violet-500/5")
                                )}
                              >
                                <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", colors.bg, colors.text)}>
                                  {notifIconMap[notif.type] || <Bell className="w-4 h-4" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={cn(
                                      "text-sm truncate",
                                      notif.read ? "text-[#A0AABF]" : "text-[#E8E8FF] font-medium"
                                    )}>
                                      {notif.title}
                                    </p>
                                    {!notif.read && (
                                      <span className={cn(
                                        "w-2 h-2 rounded-full shrink-0",
                                        isAdmin ? "bg-blue-400" : "bg-violet-400"
                                      )} />
                                    )}
                                  </div>
                                  <p className="text-xs mt-0.5 line-clamp-2 text-[#64748B]">
                                    {notif.message}
                                  </p>
                                  <p className="text-[10px] mt-1 text-[#64748B]">
                                    {getRelativeTime(notif.timestamp)}
                                  </p>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/3">
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`,
                  boxShadow: `0 4px 12px -2px ${themeColors.primary}30`
                }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#E8E8FF] truncate leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-[#64748B] leading-tight">
                  {isAdmin ? 'Administrator' : 'User'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-[#A0AABF] hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ========== MOBILE TOP BAR ========== */}
        <header className={cn(
          "fixed top-0 left-0 right-0 z-50 h-14 lg:hidden",
          "bg-[#0D1117]/95 backdrop-blur-xl border-b border-white/6"
        )}>
          <div className="h-full px-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})` }}
              >
                <Infinity className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-[#E8E8FF]">TaskFlow</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2.5 text-[#A0AABF] hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* ========== MOBILE SLIDE-IN MENU ========== */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-60 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute inset-y-0 left-0 w-70 bg-[#0D1117] border-r border-white/6 shadow-2xl flex flex-col"
              >
                {/* Mobile Menu Header */}
                <div className="h-14 flex items-center justify-between px-5 border-b border-white/6 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})` }}
                    >
                      <Infinity className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-[#E8E8FF]">TaskFlow</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-[#A0AABF] hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile User Info */}
                <div className="p-4 border-b border-white/6">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`,
                        boxShadow: `0 8px 20px -4px ${themeColors.primary}40`
                      }}
                    >
                      {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#E8E8FF]">{currentUser.name}</p>
                      <p className="text-xs text-[#64748B]">{currentUser.email}</p>
                      <span className={cn(
                        "inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                        isAdmin
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                          : "bg-violet-500/15 text-violet-400 border border-violet-500/25"
                      )}>
                        {isAdmin ? 'Administrator' : 'User'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                  {navItems.map((item, idx) => {
                    const isActive = location.pathname === item.to ||
                      (item.to !== '/' && location.pathname.startsWith(item.to));

                    return (
                      <motion.div
                        key={item.to}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <NavLink
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "sidebar-nav-item",
                            isActive && "active"
                          )}
                        >
                          <item.icon className={cn(
                            "w-4.5 h-4.5",
                            isActive && (isAdmin ? "text-blue-400" : "text-violet-400")
                          )} />
                          <span>{item.label}</span>
                        </NavLink>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Mobile Menu Footer */}
                <div className="p-3 border-t border-white/6 shrink-0">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ========== MAIN CONTENT AREA ========== */}
        <main className={cn(
          "min-h-screen transition-all",
          "lg:ml-65",
          "pt-16 lg:pt-0",
        )}>
          <div className="max-w-350 mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
};
