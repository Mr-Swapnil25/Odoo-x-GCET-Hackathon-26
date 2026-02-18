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
  Search,
  ChevronDown,
  Infinity,
  CheckCheck,
  Trash2,
  ClipboardList,
  MessageSquare,
  AlertTriangle,
  UserPlus,
  ArrowRight
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
  task_assigned: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  task_status_changed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  task_comment: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  task_overdue: { bg: 'bg-red-500/20', text: 'text-red-400' },
  task_due_soon: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  user_created: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

export const Layout = () => {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [bellShake, setBellShake] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
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
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
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
    primary: isAdmin ? '#1e40af' : '#7c3aed',
    primaryLight: isAdmin ? '#3b82f6' : '#a78bfa',
    gradientFrom: isAdmin ? '#1e40af' : '#7c3aed',
    gradientTo: isAdmin ? '#3b82f6' : '#a78bfa',
    bgCard: isAdmin ? 'rgba(30, 41, 59, 0.6)' : 'rgba(30, 24, 53, 0.6)',
    border: isAdmin ? '#1e3a5f' : '#2d2249',
    textMuted: isAdmin ? '#94a3b8' : '#a090cb',
  };

  // Calculate active nav indicator position
  const activeIndex = navItems.findIndex(item =>
    location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
  );

  return (
    <ThemeProvider role={currentUser.role}>
      <div className={cn("min-h-screen relative", isAdmin ? "bg-[#0c1222]" : "bg-[#0c0a14]")}>
        <WaveBackground
          colorTheme={waveColorTheme}
          backdropBlurAmount="lg"
        />

        {/* TOP HEADER */}
        <header className={cn(
          "fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-xl border-b",
          isAdmin
            ? "bg-slate-900/95 border-slate-700/50"
            : "bg-[#151023]/95 border-[#2d2249]/50"
        )}>
          {/* Gradient glow line at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[1px]"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${themeColors.primaryLight}60 50%, transparent 100%)`
            }}
          />

          <div className="h-full max-w-[1800px] mx-auto px-4 lg:px-6 flex items-center justify-between gap-4">

            {/* LEFT: Logo */}
            <NavLink
              to="/"
              className="flex items-center gap-2.5 shrink-0 group"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`,
                  boxShadow: `0 10px 15px -3px ${themeColors.primary}40`,
                  animation: 'spin 20s linear infinite',
                }}
              >
                <Infinity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                Task Manager
              </span>
            </NavLink>

            {/* CENTER: Navigation Tabs (Desktop) */}
            <nav className={cn(
              "hidden lg:flex items-center gap-1 backdrop-blur-sm rounded-xl p-1.5 border border-white/[0.05] relative",
              isAdmin ? "bg-slate-800/60" : "bg-[#1a1625]/60"
            )}>
              {navItems.map((item, idx) => {
                const isActive = location.pathname === item.to ||
                  (item.to !== '/' && location.pathname.startsWith(item.to));

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02]",
                      isActive
                        ? "text-white"
                        : cn(
                          "hover:text-white hover:bg-white/[0.05]",
                          isAdmin ? "text-slate-400" : "text-[#a090cb]"
                        )
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNavBg"
                        className="absolute inset-0 rounded-lg shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`,
                          boxShadow: `0 4px 15px -3px ${themeColors.primary}40`
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <item.icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* RIGHT: Search, Notifications, Profile */}
            <div className="flex items-center gap-3">

              {/* Search Bar */}
              <div className={cn(
                "relative hidden md:flex items-center transition-all duration-300",
                isSearchFocused ? "w-72" : "w-56"
              )}>
                <Search className="absolute left-3 w-4 h-4" style={{ color: themeColors.primary }} />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className={cn(
                    "w-full text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none transition-all",
                    isAdmin
                      ? "bg-slate-800 border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 placeholder-slate-500"
                      : "bg-[#1a1625] border border-[#2d2249] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 placeholder-[#5e5680]"
                  )}
                />
              </div>

              {/* Mobile Search Icon */}
              <button className={cn(
                "md:hidden p-2.5 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all",
                isAdmin ? "text-slate-400" : "text-[#a090cb]"
              )}>
                <Search className="w-5 h-5" />
              </button>

              {/* Notification Bell */}
              <div className="relative" ref={notifPanelRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className={cn(
                    "relative p-2.5 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all",
                    isAdmin ? "text-slate-400" : "text-[#a090cb]",
                    bellShake && "animate-bell-shake"
                  )}
                >
                  <Bell className="w-5 h-5" />
                  {currentUnread > 0 && (
                    <span className={cn(
                      "absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white ring-2",
                      isAdmin ? "bg-blue-500 ring-slate-900" : "bg-red-500 ring-[#151023]"
                    )}>
                      {currentUnread > 9 ? '9+' : currentUnread}
                    </span>
                  )}
                </button>

                {/* Notification Panel */}
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className={cn(
                        "absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[480px] flex flex-col backdrop-blur-xl rounded-xl shadow-2xl shadow-black/50 overflow-hidden border",
                        isAdmin
                          ? "bg-slate-900/95 border-slate-700"
                          : "bg-[#1a1625]/95 border-[#2d2249]"
                      )}
                    >
                      {/* Panel Header */}
                      <div className={cn("flex items-center justify-between px-4 py-3 border-b", isAdmin ? "border-slate-700" : "border-[#2d2249]")}>
                        <h3 className="text-sm font-semibold text-white">Notifications</h3>
                        <div className="flex items-center gap-2">
                          {currentUnread > 0 && (
                            <button
                              onClick={markAllRead}
                              className={cn("text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors",
                                isAdmin ? "text-blue-400 hover:bg-blue-500/10" : "text-purple-400 hover:bg-purple-500/10"
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
                            <Bell className={cn("w-8 h-8 mb-2", isAdmin ? "text-slate-600" : "text-[#3d3259]")} />
                            <p className={cn("text-sm", isAdmin ? "text-slate-500" : "text-[#5e5680]")}>
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
                                    isAdmin ? "border-slate-800 hover:bg-slate-800/50" : "border-[#1e1835] hover:bg-[#1e1835]/50",
                                    !notif.read && (isAdmin ? "bg-blue-500/5" : "bg-purple-500/5")
                                  )}
                                >
                                  <div className={cn("p-2 rounded-lg flex-shrink-0 mt-0.5", colors.bg, colors.text)}>
                                    {notifIconMap[notif.type] || <Bell className="w-4 h-4" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className={cn(
                                        "text-sm truncate",
                                        notif.read ? (isAdmin ? "text-slate-300" : "text-[#c4b5e0]") : "text-white font-medium"
                                      )}>
                                        {notif.title}
                                      </p>
                                      {!notif.read && (
                                        <span className={cn(
                                          "w-2 h-2 rounded-full flex-shrink-0",
                                          isAdmin ? "bg-blue-400" : "bg-purple-400"
                                        )} />
                                      )}
                                    </div>
                                    <p className={cn("text-xs mt-0.5 line-clamp-2", isAdmin ? "text-slate-400" : "text-[#8b7bb5]")}>
                                      {notif.message}
                                    </p>
                                    <p className={cn("text-[10px] mt-1", isAdmin ? "text-slate-500" : "text-[#5e5680]")}>
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

              {/* Divider */}
              <div className={cn("hidden sm:block w-px h-8", isAdmin ? "bg-slate-700" : "bg-[#2d2249]")}></div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className={cn(
                    "flex items-center gap-2.5 p-1.5 pr-3 rounded-xl transition-all",
                    isProfileDropdownOpen
                      ? isAdmin
                        ? "bg-blue-600/10 border border-blue-600/30"
                        : "bg-purple-600/10 border border-purple-600/30"
                      : "hover:bg-white/[0.05] border border-transparent"
                  )}
                >
                  {/* Avatar with gradient ring */}
                  <div className="relative">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`,
                        boxShadow: `0 4px 15px -3px ${themeColors.primary}30`
                      }}
                    >
                      {currentUser.name.charAt(0)}
                    </div>
                    <div
                      className="absolute -inset-[2px] rounded-xl opacity-60 animate-pulse-slow pointer-events-none"
                      style={{
                        border: `1.5px solid ${themeColors.primaryLight}40`,
                      }}
                    />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white leading-tight">{currentUser.name}</p>
                    <p className={cn("text-[10px] leading-tight", isAdmin ? "text-slate-400" : "text-[#a090cb]")}>
                      {isAdmin ? 'Administrator' : 'User'}
                    </p>
                  </div>
                  <ChevronDown className={cn(
                    "hidden sm:block w-4 h-4 text-[#a090cb] transition-transform duration-200",
                    isProfileDropdownOpen && "rotate-180"
                  )} />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isProfileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        "absolute right-0 top-full mt-2 w-56 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/50 overflow-hidden",
                        isAdmin
                          ? "bg-slate-900/95 border border-slate-700"
                          : "bg-[#1a1625]/95 border border-[#2d2249]"
                      )}
                    >
                      {/* User Info Header */}
                      <div className={cn("px-4 py-3 border-b", isAdmin ? "border-slate-700" : "border-[#2d2249]")}>
                        <p className="text-sm font-medium text-white">{currentUser.name}</p>
                        <p className={cn("text-xs", isAdmin ? "text-slate-400" : "text-[#a090cb]")}>{currentUser.email}</p>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                          <NavLink
                            to="/profile"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 text-sm hover:text-white hover:bg-white/[0.05] rounded-lg transition-all",
                              isAdmin ? "text-slate-400" : "text-[#a090cb]"
                            )}
                          >
                            <span className="flex items-center gap-3">
                              <UserCircle className="w-4 h-4" />
                              <span>Profile</span>
                            </span>
                            <kbd className={cn("text-[10px] px-1.5 py-0.5 rounded border",
                              isAdmin ? "border-slate-600 text-slate-500" : "border-[#2d2249] text-[#5e5680]"
                            )}>⌘P</kbd>
                          </NavLink>
                        </motion.div>
                      </div>

                      {/* Logout */}
                      <div className={cn("p-2 border-t", isAdmin ? "border-slate-700" : "border-[#2d2249]")}>
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                          <button
                            onClick={handleLogout}
                            className="flex items-center justify-between gap-3 w-full px-3 py-2.5 text-sm text-[#f43f5e] hover:bg-[#f43f5e]/10 rounded-lg transition-all"
                          >
                            <span className="flex items-center gap-3">
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </span>
                            <kbd className={cn("text-[10px] px-1.5 py-0.5 rounded border border-red-500/20 text-red-500/50")}>⌘Q</kbd>
                          </button>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2.5 text-[#a090cb] hover:text-white hover:bg-white/[0.05] rounded-xl transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* MOBILE MENU */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[60] lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={cn(
                  "absolute inset-y-0 right-0 w-full max-w-sm border-l shadow-2xl",
                  isAdmin ? "bg-slate-900 border-slate-700" : "bg-[#151023] border-[#2d2249]"
                )}
              >
                {/* Mobile Menu Header */}
                <div className={cn(
                  "h-16 flex items-center justify-between px-5 border-b",
                  isAdmin ? "border-slate-700" : "border-[#2d2249]"
                )}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})` }}
                    >
                      <Infinity className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-white">Task Manager</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "p-2 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all",
                      isAdmin ? "text-slate-400" : "text-[#a090cb]"
                    )}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile User Info */}
                <div className={cn("p-5 border-b", isAdmin ? "border-slate-700" : "border-[#2d2249]")}>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`,
                        boxShadow: `0 10px 15px -3px ${themeColors.primary}40`
                      }}
                    >
                      {currentUser.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-medium text-white">{currentUser.name}</p>
                      <p className={cn("text-xs", isAdmin ? "text-slate-400" : "text-[#a090cb]")}>{currentUser.email}</p>
                      <span className={cn(
                        "inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                        isAdmin
                          ? "bg-blue-600/20 text-blue-400 border border-blue-600/30"
                          : "bg-purple-600/20 text-purple-400 border border-purple-600/30"
                      )}>
                        {isAdmin ? 'Administrator' : 'User'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation Items with stagger */}
                <div className="p-4 space-y-1">
                  {navItems.map((item, idx) => {
                    const isActive = location.pathname === item.to ||
                      (item.to !== '/' && location.pathname.startsWith(item.to));

                    return (
                      <motion.div
                        key={item.to}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                      >
                        <NavLink
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all",
                            isActive
                              ? isAdmin
                                ? "bg-blue-600/10 text-white border border-blue-600/30"
                                : "bg-purple-600/10 text-white border border-purple-600/30"
                              : cn(
                                "hover:text-white hover:bg-white/[0.05]",
                                isAdmin ? "text-slate-400" : "text-[#a090cb]"
                              )
                          )}
                        >
                          <item.icon className={cn(
                            "w-5 h-5",
                            isActive && (isAdmin ? "text-blue-400" : "text-purple-400")
                          )} />
                          <span>{item.label}</span>
                          {isActive && (
                            <div
                              className="ml-auto w-1.5 h-1.5 rounded-full shadow-lg"
                              style={{
                                backgroundColor: themeColors.primary,
                                boxShadow: `0 0 10px ${themeColors.primary}`
                              }}
                            ></div>
                          )}
                        </NavLink>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Mobile Menu Footer */}
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 p-4 border-t",
                  isAdmin ? "border-slate-700" : "border-[#2d2249]"
                )}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-[#f43f5e] bg-[#f43f5e]/10 hover:bg-[#f43f5e]/20 border border-[#f43f5e]/20 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MAIN CONTENT AREA with page transitions */}
        <main className="pt-20 min-h-screen px-4 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-[1400px] mx-auto">
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
