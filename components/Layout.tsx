import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import WaveBackground from './WaveBackground';
import { ThemeProvider, useTheme, getThemeByRole } from '../lib/ThemeContext';
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
  Settings,
  Infinity,
  MessageCircle,
  LogIn,
  LogOutIcon
} from 'lucide-react';
import { Role } from '../types';
import { cn } from './UI';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export const Layout = () => {
  const { currentUser, logout, checkIn, checkOut, attendance } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Check in state
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayAttendance = useMemo(() => {
    if (!currentUser) return null;
    return attendance.find(a => a.employeeId === currentUser.id && a.date === todayStr);
  }, [attendance, currentUser, todayStr]);

  const isCheckedIn = !!todayAttendance?.checkIn && !todayAttendance?.checkOut;
  const checkInTime = todayAttendance?.checkIn ? new Date(todayAttendance.checkIn) : null;

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate time since check in
  const timeSinceCheckIn = useMemo(() => {
    if (!checkInTime) return '';
    const diff = currentTime.getTime() - checkInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, [checkInTime, currentTime]);

  // Handle check in/out
  const handleCheckIn = () => {
    if (currentUser) {
      checkIn(currentUser.id);
      toast.success('Checked in successfully!');
    }
  };

  const handleCheckOut = () => {
    if (currentUser) {
      checkOut(currentUser.id);
      toast.success('Checked out successfully!');
    }
  };

  // Hidden demo reset shortcut: Ctrl+Shift+R
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

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
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

  if (!currentUser) return null;

  const isAdmin = currentUser.role === Role.ADMIN;

  // Navigation items based on role
  const navItems = isAdmin 
    ? [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/employees', icon: Users, label: 'Employees' },
        { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
        { to: '/leaves', icon: Clock, label: 'Leaves' },
        { to: '/payroll', icon: FileText, label: 'Payroll' },
        { to: '/chat', icon: MessageCircle, label: 'Messages' },
      ]
    : [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/attendance', icon: CalendarCheck, label: 'Attendance' },
        { to: '/leaves', icon: Clock, label: 'Leaves' },
        { to: '/payroll', icon: FileText, label: 'Payroll' },
        { to: '/chat', icon: MessageCircle, label: 'Messages' },
        { to: '/profile', icon: UserCircle, label: 'Profile' },
      ];

  // Determine color theme based on user role
  const waveColorTheme = isAdmin ? 'admin' : 'employee';
  
  // Role-based color classes
  const themeColors = {
    primary: isAdmin ? '#1e40af' : '#7c3aed',
    primaryLight: isAdmin ? '#3b82f6' : '#a78bfa',
    gradientFrom: isAdmin ? '#1e40af' : '#7c3aed',
    gradientTo: isAdmin ? '#3b82f6' : '#a78bfa',
    bgCard: isAdmin ? 'rgba(30, 41, 59, 0.6)' : 'rgba(30, 24, 53, 0.6)',
    border: isAdmin ? '#1e3a5f' : '#2d2249',
    textMuted: isAdmin ? '#94a3b8' : '#a090cb',
  };

  return (
    <ThemeProvider role={currentUser.role}>
    <div className={cn("min-h-screen relative", isAdmin ? "bg-[#0c1222]" : "bg-[#0c0a14]")}>
      {/* Wave Background - Role-based colors */}
      <WaveBackground 
        colorTheme={waveColorTheme}
        backdropBlurAmount="lg"
      />

      {/* ═══════════════════════════════════════════════════════════════════════════
          TOP HEADER NAVIGATION
      ═══════════════════════════════════════════════════════════════════════════ */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 backdrop-blur-xl border-b",
        isAdmin 
          ? "bg-slate-900/95 border-slate-700/50" 
          : "bg-[#151023]/95 border-[#2d2249]/50"
      )}>
        <div className="h-full max-w-[1800px] mx-auto px-4 lg:px-6 flex items-center justify-between gap-4">
          
          {/* ─── LEFT: Logo ─── */}
          <NavLink 
            to="/" 
            className="flex items-center gap-2.5 shrink-0 group"
          >
            {/* Company Logo or Default */}
            {currentUser.companyLogo ? (
              <img 
                src={currentUser.companyLogo} 
                alt={currentUser.companyName || 'Company Logo'}
                className="w-9 h-9 rounded-xl object-contain bg-slate-800/50 shadow-lg transition-all duration-300 group-hover:scale-105"
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`,
                  boxShadow: `0 10px 15px -3px ${themeColors.primary}40`
                }}
              >
                <Infinity className="w-5 h-5 text-white" />
              </div>
            )}
            <span className="text-xl font-bold text-white hidden sm:block">
              {currentUser.companyName || 'Dayflow'}
            </span>
          </NavLink>

          {/* ─── CENTER: Navigation Tabs (Desktop) ─── */}
          <nav className={cn(
            "hidden lg:flex items-center gap-1 backdrop-blur-sm rounded-xl p-1.5 border border-white/[0.05]",
            isAdmin ? "bg-slate-800/60" : "bg-[#1a1625]/60"
          )}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || 
                (item.to !== '/' && location.pathname.startsWith(item.to));
              
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-white shadow-lg"
                      : cn(
                          "hover:text-white hover:bg-white/[0.05]",
                          isAdmin ? "text-slate-400" : "text-[#a090cb]"
                        )
                  )}
                  style={isActive ? {
                    background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`,
                    boxShadow: `0 4px 15px -3px ${themeColors.primary}40`
                  } : undefined}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* ─── RIGHT: Search, Notifications, Profile ─── */}
          <div className="flex items-center gap-3">
            
            {/* Search Bar */}
            <div className={cn(
              "relative hidden md:flex items-center transition-all duration-300",
              isSearchFocused ? "w-72" : "w-56"
            )}>
              <Search className="absolute left-3 w-4 h-4" style={{ color: themeColors.primary }} />
              <input
                type="text"
                placeholder="Search..."
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

            {/* Check In/Check Out Button */}
            {!isAdmin && (
              <div className="flex items-center gap-2">
                {/* Status Dot */}
                <span className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  isCheckedIn 
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" 
                    : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                )}></span>
                
                {isCheckedIn ? (
                  <div className="flex flex-col items-end">
                    <span className={cn(
                      "text-[10px] leading-tight",
                      isAdmin ? "text-slate-400" : "text-[#a090cb]"
                    )}>
                      Since {checkInTime ? format(checkInTime, 'hh:mm a') : ''}
                    </span>
                    <button
                      onClick={handleCheckOut}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold transition-all border border-red-500/30"
                    >
                      Check Out
                      <LogOutIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all border border-emerald-500/30"
                  >
                    Check IN
                    <LogIn className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Notification Bell */}
            <button className={cn(
              "relative p-2.5 hover:text-white hover:bg-white/[0.05] rounded-xl transition-all group",
              isAdmin ? "text-slate-400" : "text-[#a090cb]"
            )}>
              <Bell className="w-5 h-5" />
              <span className={cn(
                "absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 animate-pulse",
                isAdmin ? "bg-blue-500 ring-slate-900" : "bg-[#f43f5e] ring-[#151023]"
              )}></span>
              {/* Notification tooltip */}
              <span className={cn(
                "absolute -bottom-8 right-0 text-xs text-white px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border",
                isAdmin ? "bg-slate-800 border-slate-700" : "bg-[#1a1625] border-[#2d2249]"
              )}>
                3 new notifications
              </span>
            </button>

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
                <div 
                  className="h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                  style={{ 
                    background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})`,
                    boxShadow: `0 4px 15px -3px ${themeColors.primary}30`
                  }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white leading-tight">{currentUser.name}</p>
                  <p className={cn("text-[10px] leading-tight", isAdmin ? "text-slate-400" : "text-[#a090cb]")}>
                    {isAdmin ? 'Administrator' : 'Employee'}
                  </p>
                </div>
                <ChevronDown className={cn(
                  "hidden sm:block w-4 h-4 text-[#a090cb] transition-transform duration-200",
                  isProfileDropdownOpen && "rotate-180"
                )} />
              </button>

              {/* Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className={cn(
                  "absolute right-0 top-full mt-2 w-56 backdrop-blur-xl rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200",
                  isAdmin 
                    ? "bg-slate-900/95 border border-slate-700" 
                    : "bg-[#1a1625]/95 border border-[#2d2249]"
                )}>
                  {/* User Info Header */}
                  <div className={cn("px-4 py-3 border-b", isAdmin ? "border-slate-700" : "border-[#2d2249]")}>
                    <p className="text-sm font-medium text-white">{currentUser.name}</p>
                    <p className={cn("text-xs", isAdmin ? "text-slate-400" : "text-[#a090cb]")}>{currentUser.email}</p>
                  </div>
                  
                  {/* Menu Items */}
                  <div className="p-2">
                    <NavLink
                      to="/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm hover:text-white hover:bg-white/[0.05] rounded-lg transition-all",
                        isAdmin ? "text-slate-400" : "text-[#a090cb]"
                      )}
                    >
                      <UserCircle className="w-4 h-4" />
                      <span>My Profile</span>
                    </NavLink>
                    {isAdmin && (
                      <NavLink
                        to="/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-all"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </NavLink>
                    )}
                  </div>

                  {/* Logout */}
                  <div className={cn("p-2 border-t", isAdmin ? "border-slate-700" : "border-[#2d2249]")}>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-[#f43f5e] hover:bg-[#f43f5e]/10 rounded-lg transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
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

      {/* ═══════════════════════════════════════════════════════════════════════════
          MOBILE MENU OVERLAY
      ═══════════════════════════════════════════════════════════════════════════ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className={cn(
            "absolute inset-y-0 right-0 w-full max-w-sm border-l shadow-2xl animate-in slide-in-from-right duration-300",
            isAdmin ? "bg-slate-900 border-slate-700" : "bg-[#151023] border-[#2d2249]"
          )}>
            {/* Mobile Menu Header */}
            <div className={cn(
              "h-16 flex items-center justify-between px-5 border-b",
              isAdmin ? "border-slate-700" : "border-[#2d2249]"
            )}>
              <div className="flex items-center gap-2.5">
                {/* Company Logo or Default */}
                {currentUser.companyLogo ? (
                  <img 
                    src={currentUser.companyLogo} 
                    alt={currentUser.companyName || 'Company Logo'}
                    className="w-8 h-8 rounded-lg object-contain bg-slate-800/50"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${themeColors.gradientFrom}, ${themeColors.gradientTo})` }}
                  >
                    <Infinity className="w-4 h-4 text-white" />
                  </div>
                )}
                <span className="text-lg font-bold text-white">{currentUser.companyName || 'Dayflow'}</span>
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
                    {isAdmin ? 'Administrator' : 'Employee'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Navigation Items */}
            <div className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to || 
                  (item.to !== '/' && location.pathname.startsWith(item.to));
                
                return (
                  <NavLink
                    key={item.to}
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
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          MAIN CONTENT AREA
      ═══════════════════════════════════════════════════════════════════════════ */}
      <main className="pt-20 min-h-screen px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
    </ThemeProvider>
  );
};