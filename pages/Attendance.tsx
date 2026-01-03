import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, Button, Select, cn, useRoleTheme } from '../components/UI';
import { InteractiveCard } from '../components/InteractiveCard';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, getDay, startOfWeek, endOfWeek, addDays, isSameMonth, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, CalendarDays, CalendarRange, Fingerprint, Share, List, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Role } from '../types';
import { UPCOMING_HOLIDAYS } from '../data';

export const Attendance = () => {
  const { currentUser, attendance, checkIn, checkOut, employees } = useStore();
  const theme = useRoleTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(currentUser?.id || '');
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [displayMode, setDisplayMode] = useState<'list' | 'calendar'>('list');

  if (!currentUser) return null;

  const isAdmin = currentUser.role === Role.ADMIN;
  // If admin, show dropdown to select employee, else show current user
  const targetEmployeeId = isAdmin && selectedEmployeeId ? selectedEmployeeId : currentUser.id;

  const handleCheckIn = () => {
    checkIn(currentUser.id);
    toast.success('Checked in successfully!');
  };

  const handleCheckOut = () => {
    checkOut(currentUser.id);
    toast.success('Checked out successfully!');
  };

  // Fix: Use todayStr comparison instead of new Date() formatting to ensure consistency
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecord = attendance.find(a => a.employeeId === currentUser.id && a.date === todayStr);
  const isCheckedIn = !!todayRecord?.checkIn;
  const isCheckedOut = !!todayRecord?.checkOut;

  // Current time display
  const now = new Date();
  const currentTime = format(now, 'hh:mm');
  const currentAmPm = format(now, 'a');
  const currentDateDisplay = format(now, 'EEEE, MMM d, yyyy');

  const getDayStatus = (date: Date) => {
    if (isWeekend(date)) return 'weekend';
    const record = attendance.find(a => 
      a.employeeId === targetEmployeeId && 
      a.date === format(date, 'yyyy-MM-dd')
    );
    if (!record) return 'none';
    return record.status;
  };

  // Get attendance records for list view (last 30 days)
  const listViewRecords = useMemo(() => {
    const records = [];
    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const record = attendance.find(a => a.employeeId === targetEmployeeId && a.date === dateStr);
      const dayOfWeek = format(date, 'EEE');
      const isWeekendDay = isWeekend(date);
      
      records.push({
        date,
        dateStr,
        dayOfWeek,
        month: format(date, 'MMM'),
        dayNum: format(date, 'd'),
        checkIn: record?.checkIn ? format(new Date(record.checkIn), 'hh:mm a') : '--',
        checkOut: record?.checkOut ? format(new Date(record.checkOut), 'hh:mm a') : '--',
        totalHours: record?.totalHours ? `${Math.floor(record.totalHours)}h ${Math.round((record.totalHours % 1) * 60)}m` : '--',
        status: isWeekendDay ? 'Weekend' : (record?.status || 'none'),
        record
      });
    }
    return records;
  }, [attendance, targetEmployeeId]);

  // Statistics calculations
  const stats = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    let present = 0, absent = 0, leaves = 0, halfDays = 0, workingDays = 0;
    
    daysInMonth.forEach(day => {
      if (isWeekend(day)) return;
      workingDays++;
      const status = getDayStatus(day);
      if (status === 'PRESENT') present++;
      else if (status === 'ABSENT') absent++;
      else if (status === 'LEAVE') leaves++;
      else if (status === 'HALF_DAY') halfDays++;
    });
    
    const attendancePercent = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;
    
    return { present, absent, leaves, halfDays, workingDays, attendancePercent };
  }, [currentDate, attendance, targetEmployeeId]);

  // View Logic
  let daysToShow: Date[] = [];
  let paddingDays: any[] = [];
  
  if (viewMode === 'monthly') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      daysToShow = eachDayOfInterval({ start: monthStart, end: monthEnd });
      const startDay = getDay(monthStart);
      paddingDays = Array(startDay).fill(null);
  } else {
      // Weekly View
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);
      daysToShow = eachDayOfInterval({ start: weekStart, end: weekEnd });
  }

  const navigateDate = (direction: 'prev' | 'next') => {
      const modifier = direction === 'next' ? 1 : -1;
      if (viewMode === 'monthly') {
          setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + modifier));
      } else {
          setCurrentDate(d => addDays(d, modifier * 7));
      }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(74,222,128,0.3)]';
      case 'ABSENT':
        return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.3)]';
      case 'LEAVE':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(96,165,250,0.3)]';
      case 'HALF_DAY':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(251,146,60,0.3)]';
      case 'Weekend':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'Present';
      case 'ABSENT': return 'Absent';
      case 'LEAVE': return 'On Leave';
      case 'HALF_DAY': return 'Half-day';
      case 'Weekend': return 'Weekend';
      default: return '--';
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div 
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px]"
          style={{ backgroundColor: `${theme.primary}15` }}
        ></div>
        <div 
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[100px]"
          style={{ backgroundColor: `${theme.primary}08` }}
        ></div>
      </div>

      <main className="w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        <div className="flex flex-col xl:flex-row gap-8">
          {/* LEFT COLUMN: Main Interaction & Data */}
          <div className="flex flex-col gap-8 xl:w-2/3 w-full">
            {/* Page Heading & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-4xl font-black tracking-tight text-white">
                <span 
                  className="bg-clip-text text-transparent"
                  style={{ 
                    backgroundImage: `linear-gradient(to right, ${theme.primaryLight}, ${theme.primary})`
                  }}
                >
                  My Attendance
                </span>
              </h1>
              <button 
                className={cn(
                  "group flex items-center gap-2 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all duration-300",
                  isAdmin 
                    ? "bg-slate-800 hover:bg-slate-700 border border-slate-600"
                    : "bg-[#181520] hover:bg-[#2c2839] border border-white/[0.08]"
                )}
              >
                <Share className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: theme.primary }} />
                <span>Export Report</span>
              </button>
            </div>

            {/* Hero Section: Check In Card */}
            {!isAdmin && (
              <InteractiveCard
                interactiveColor={theme.primary}
                borderRadius="20px"
                glowIntensity={0.6}
                rotationFactor={0.15}
                tailwindBgClass={isAdmin ? "bg-slate-800/60 backdrop-blur-xl" : "bg-[rgba(24,21,32,0.6)] backdrop-blur-xl"}
              >
                <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 z-10">
                  {/* Background aesthetic blur */}
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#8055f6]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                  
                  {/* Time & Status */}
                  <div className="flex flex-col items-center md:items-start gap-2">
                    <div className="text-6xl md:text-7xl font-black text-white tracking-tighter tabular-nums drop-shadow-lg">
                      {currentTime} <span className="text-3xl font-medium text-gray-400">{currentAmPm}</span>
                    </div>
                    <div className="text-gray-400 font-medium text-lg mt-1 tracking-wide">{currentDateDisplay}</div>
                    <div className="flex items-center gap-3 mt-4 px-4 py-2 rounded-full bg-black/20 border border-white/5 w-fit">
                      {isCheckedIn ? (
                        <>
                          <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_rgba(74,222,128,0.3)]"></span>
                          </div>
                          <span className="text-sm font-medium text-gray-300">
                            {isCheckedOut ? 'Attendance Completed' : 'Checked In'}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_10px_rgba(248,113,113,0.3)]"></span>
                          </div>
                          <span className="text-sm font-medium text-gray-300">Not Checked In</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#8055f6] blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                    {!isCheckedIn ? (
                      <button 
                        onClick={handleCheckIn}
                        className="relative overflow-hidden w-48 h-48 rounded-full bg-gradient-to-br from-[#2c2839] to-[#181520] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95 transition-all duration-200 flex flex-col items-center justify-center gap-2 group/btn"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-[#8055f6]/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                        <div className="size-20 rounded-full bg-gradient-to-tr from-[#8055f6] to-purple-400 shadow-[0_0_10px_rgba(128,85,246,0.3),0_0_20px_rgba(128,85,246,0.1)] flex items-center justify-center mb-1 group-hover/btn:shadow-[0_0_30px_rgba(128,85,246,0.6)] transition-shadow duration-300">
                          <Fingerprint className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-white font-bold text-lg tracking-wide z-10">Check In</span>
                        <span className="text-xs text-gray-400 z-10">Tap to record</span>
                      </button>
                    ) : !isCheckedOut ? (
                      <button 
                        onClick={handleCheckOut}
                        className="relative overflow-hidden w-48 h-48 rounded-full bg-gradient-to-br from-[#2c2839] to-[#181520] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] active:scale-95 transition-all duration-200 flex flex-col items-center justify-center gap-2 group/btn"
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                        <div className="size-20 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 shadow-[0_0_10px_rgba(251,146,60,0.3)] flex items-center justify-center mb-1 group-hover/btn:shadow-[0_0_30px_rgba(251,146,60,0.6)] transition-shadow duration-300">
                          <Fingerprint className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-white font-bold text-lg tracking-wide z-10">Check Out</span>
                        <span className="text-xs text-gray-400 z-10">Tap to record</span>
                      </button>
                    ) : (
                      <div className="relative w-48 h-48 rounded-full bg-gradient-to-br from-[#2c2839] to-[#181520] border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center gap-2">
                        <div className="size-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.3)] flex items-center justify-center mb-1">
                          <Clock className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-white font-bold text-lg tracking-wide">Completed</span>
                        <span className="text-xs text-gray-400">{todayRecord?.totalHours ? `${Math.floor(todayRecord.totalHours)}h ${Math.round((todayRecord.totalHours % 1) * 60)}m` : 'Today'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </InteractiveCard>
            )}

            {/* Admin Employee Selector */}
            {isAdmin && (
              <InteractiveCard
                interactiveColor="#8055f6"
                borderRadius="20px"
                glowIntensity={0.4}
                tailwindBgClass="bg-[rgba(24,21,32,0.6)] backdrop-blur-xl"
              >
                <div className="p-6 flex items-center justify-between gap-4">
                  <h3 className="text-lg font-bold text-white">Select Employee</h3>
                  <div className="w-72">
                    <select 
                      value={targetEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full bg-[#181520] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#8055f6] focus:border-transparent appearance-none cursor-pointer"
                    >
                      {employees.map(e => (
                        <option key={e.id} value={e.id} className="bg-[#181520]">
                          {e.firstName} {e.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </InteractiveCard>
            )}

            {/* Controls: View Toggle & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
              {/* Segmented Control */}
              <div className="bg-[#181520] p-1 rounded-xl flex w-full sm:w-auto border border-white/[0.08]">
                <button 
                  onClick={() => setDisplayMode('list')}
                  className={cn(
                    "flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
                    displayMode === 'list' 
                      ? "bg-[#2c2839] text-white shadow-sm" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <List className="w-4 h-4" />
                  List View
                </button>
                <button 
                  onClick={() => setDisplayMode('calendar')}
                  className={cn(
                    "flex-1 sm:flex-none px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2",
                    displayMode === 'calendar' 
                      ? "bg-[#2c2839] text-white shadow-sm" 
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </button>
              </div>

              {/* Date Picker */}
              <div className="w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-[#181520] border border-white/[0.08] px-4 py-2.5 rounded-xl cursor-pointer hover:border-gray-600 transition-colors group">
                  <CalendarRange className="w-5 h-5 text-gray-400 group-hover:text-[#8055f6] transition-colors" />
                  <span className="text-sm font-medium text-white">
                    {format(startOfMonth(currentDate), 'MMM dd')} - {format(endOfMonth(currentDate), 'MMM dd, yyyy')}
                  </span>
                  <ChevronLeft className="w-4 h-4 text-gray-500 rotate-[-90deg] ml-2" />
                </div>
              </div>
            </div>

            {/* Data Table (List View) */}
            {displayMode === 'list' && (
              <div className="bg-[rgba(24,21,32,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg min-h-[400px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#181520]/50 border-b border-white/[0.08] text-xs uppercase text-gray-400 font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-5">Date</th>
                        <th className="px-6 py-5">Check In</th>
                        <th className="px-6 py-5">Check Out</th>
                        <th className="px-6 py-5">Work Hours</th>
                        <th className="px-6 py-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.08] text-sm">
                      {listViewRecords.slice(0, 6).map((row, index) => (
                        <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-[#181520] p-2 rounded-lg border border-white/[0.08] text-center min-w-[40px]">
                                <div className="text-[10px] text-gray-400 uppercase">{row.month}</div>
                                <div className="text-base font-bold text-white">{row.dayNum}</div>
                              </div>
                              <span className="text-gray-300 font-medium">{row.dayOfWeek}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{row.checkIn}</td>
                          <td className="px-6 py-4 text-gray-300">{row.checkOut}</td>
                          <td className="px-6 py-4 text-white font-medium">{row.totalHours}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border",
                              getStatusBadge(row.status)
                            )}>
                              {getStatusLabel(row.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.08] bg-[#181520]/30">
                  <span className="text-xs text-gray-400">Showing 6 of {listViewRecords.length} days</span>
                  <div className="flex gap-2">
                    <button className="p-1 rounded hover:bg-white/10 text-gray-400">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="p-1 rounded hover:bg-white/10 text-white">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar View */}
            {displayMode === 'calendar' && (
              <div className="bg-[rgba(24,21,32,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h2 className="font-semibold text-lg text-white">
                      {viewMode === 'monthly' ? format(currentDate, 'MMMM yyyy') : `Week of ${format(daysToShow[0], 'MMM d')}`}
                    </h2>
                    <div className="flex bg-[#2c2839] p-1 rounded-lg gap-1">
                      <button 
                        onClick={() => setViewMode('monthly')}
                        className={cn("p-1.5 rounded-md text-xs font-medium transition-all", viewMode === 'monthly' ? 'bg-[#8055f6] shadow text-white' : 'text-gray-400 hover:text-white')}
                        title="Monthly View"
                      >
                        <CalendarDays className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setViewMode('weekly')}
                        className={cn("p-1.5 rounded-md text-xs font-medium transition-all", viewMode === 'weekly' ? 'bg-[#8055f6] shadow text-white' : 'text-gray-400 hover:text-white')}
                        title="Weekly View"
                      >
                        <CalendarRange className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-[#2c2839] rounded-full transition-all border border-transparent hover:border-[#8055f6]/30">
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <button onClick={() => navigateDate('next')} className="p-2 hover:bg-[#2c2839] rounded-full transition-all border border-transparent hover:border-[#8055f6]/30">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                      <div key={d} className="text-xs font-bold text-gray-400 uppercase tracking-wider py-2">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {viewMode === 'monthly' && paddingDays.map((_, i) => <div key={`pad-${i}`} className="h-24 bg-[#2c2839]/30 rounded-lg" />)}
                    {daysToShow.map(day => {
                      const status = getDayStatus(day);
                      const isToday = isSameDay(day, new Date());
                      const record = attendance.find(a => a.employeeId === targetEmployeeId && a.date === format(day, 'yyyy-MM-dd'));
                      const isDifferentMonth = !isSameMonth(day, currentDate);
                      
                      let bgClass = 'bg-[#181520] hover:border-[#8055f6]/40 border-white/[0.08] transition-colors';
                      if (status === 'PRESENT') bgClass = 'bg-emerald-900/30 border-emerald-700/50 hover:bg-emerald-900/40';
                      if (status === 'ABSENT') bgClass = 'bg-red-900/30 border-red-700/50 hover:bg-red-900/40';
                      if (status === 'HALF_DAY') bgClass = 'bg-amber-900/30 border-amber-700/50 hover:bg-amber-900/40';
                      if (status === 'LEAVE') bgClass = 'bg-blue-900/30 border-blue-700/50 hover:bg-blue-900/40';
                      
                      if (isToday) bgClass += ' ring-2 ring-[#8055f6] ring-offset-2 ring-offset-[#0f0c14]';
                      if (isDifferentMonth && viewMode === 'monthly') bgClass += ' opacity-40';

                      return (
                        <div key={day.toISOString()} className={cn("h-24 border rounded-xl p-2 text-sm flex flex-col relative group", bgClass)}>
                          <span className={cn("font-medium text-sm", isToday ? "text-[#8055f6]" : "text-white")}>{format(day, 'd')}</span>
                          
                          {status !== 'none' && status !== 'weekend' && (
                            <div className="mt-auto">
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide block w-fit mb-1",
                                status === 'PRESENT' ? "text-emerald-300 bg-emerald-900/50" :
                                status === 'ABSENT' ? "text-red-300 bg-red-900/50" :
                                status === 'LEAVE' ? "text-blue-300 bg-blue-900/50" :
                                "text-amber-300 bg-amber-900/50"
                              )}>
                                {status}
                              </span>
                              {record?.checkIn && (
                                <div className="text-[10px] text-gray-400 font-medium">
                                  {format(new Date(record.checkIn), 'HH:mm')} - {record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '...'}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Sidebar Stats */}
          <div className="xl:w-1/3 w-full flex flex-col gap-8">
            {/* Attendance Stats Card */}
            <InteractiveCard
              interactiveColor="#8055f6"
              borderRadius="20px"
              glowIntensity={0.5}
              rotationFactor={0.2}
              tailwindBgClass="bg-[rgba(24,21,32,0.6)] backdrop-blur-xl"
            >
              <div className="p-6 md:p-8 flex flex-col gap-6 sticky top-24">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">Statistics</h3>
                  <span className="text-xs font-medium text-[#8055f6] bg-[#8055f6]/10 px-2 py-1 rounded border border-[#8055f6]/20">This Month</span>
                </div>

                {/* Circular Progress */}
                <div className="flex flex-col items-center justify-center py-4 relative">
                  <div className="relative size-48">
                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                      {/* Background Circle */}
                      <path
                        className="text-[#2c2839]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                      {/* Progress Circle */}
                      <path
                        className="text-[#8055f6] drop-shadow-[0_0_8px_rgba(128,85,246,0.6)]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${stats.attendancePercent}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3"
                      />
                    </svg>
                    {/* Inner Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white drop-shadow-lg">{stats.attendancePercent}%</span>
                      <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold mt-1">Attendance</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="bg-[#181520] p-4 rounded-xl border border-white/[0.08] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/20 blur-xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <p className="text-gray-400 text-xs font-medium mb-1">Total Present</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-white">{String(stats.present).padStart(2, '0')}</span>
                      <span className="text-xs text-green-400 mb-1">days</span>
                    </div>
                  </div>
                  <div className="bg-[#181520] p-4 rounded-xl border border-white/[0.08] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-red-500/20 blur-xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <p className="text-gray-400 text-xs font-medium mb-1">Total Absent</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-white">{String(stats.absent).padStart(2, '0')}</span>
                      <span className="text-xs text-red-400 mb-1">day{stats.absent !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="bg-[#181520] p-4 rounded-xl border border-white/[0.08] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/20 blur-xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <p className="text-gray-400 text-xs font-medium mb-1">Leaves</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-white">{String(stats.leaves).padStart(2, '0')}</span>
                      <span className="text-xs text-blue-400 mb-1">days</span>
                    </div>
                  </div>
                  <div className="bg-[#181520] p-4 rounded-xl border border-white/[0.08] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/20 blur-xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <p className="text-gray-400 text-xs font-medium mb-1">Half Days</p>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-white">{String(stats.halfDays).padStart(2, '0')}</span>
                      <span className="text-xs text-orange-400 mb-1">day{stats.halfDays !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            </InteractiveCard>

            {/* Upcoming Holidays */}
            <InteractiveCard
              interactiveColor="#06b6d4"
              borderRadius="20px"
              glowIntensity={0.4}
              tailwindBgClass="bg-[rgba(24,21,32,0.6)] backdrop-blur-xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Upcoming Holidays</h3>
                </div>
                <div className="space-y-3">
                  {UPCOMING_HOLIDAYS.slice(0, 2).map((holiday, index) => {
                    const holidayDate = new Date(holiday.date);
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-[#181520] border border-white/[0.08]">
                        <div className="flex flex-col items-center justify-center bg-[#2c2839] w-12 h-12 rounded-lg text-[#8055f6] font-bold">
                          <span className="text-[10px] uppercase text-gray-400 leading-none mb-1">{format(holidayDate, 'MMM')}</span>
                          <span className="text-lg leading-none">{format(holidayDate, 'dd')}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{holiday.name}</h4>
                          <p className="text-xs text-gray-400">Public Holiday</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0f0c14;
        }
        ::-webkit-scrollbar-thumb {
          background: #2c2839;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #413b54;
        }
      `}</style>
    </div>
  );
};