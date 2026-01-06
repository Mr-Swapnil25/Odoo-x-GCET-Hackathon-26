import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Role, LeaveStatus } from '../types';
import { Card, CardContent, CardHeader, Badge, Avatar, useRoleTheme, cn } from '../components/UI';
import { InteractiveCard, StatCard as InteractiveStatCard, TableCard } from '../components/InteractiveCard';
import { format, startOfMonth, endOfMonth, differenceInDays, parseISO } from 'date-fns';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  Umbrella,
  Clock,
  LogOut,
  ArrowRight,
  ExternalLink,
  Plus,
  History,
  FileText,
  Search,
  Sparkles,
  Loader2,
  RefreshCw,
  Bot
} from 'lucide-react';
import { AttendanceTrendChart, DepartmentStatsChart } from '../components/Charts';
import { DEPARTMENTS, UPCOMING_HOLIDAYS } from '../data';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import AnimatedNotification from '../components/AnimatedNotification';
import { generateAttendanceInsights } from '../lib/gemini';

// Get next upcoming holiday
const getNextHoliday = () => {
  const today = new Date();
  const upcoming = UPCOMING_HOLIDAYS.find(h => parseISO(h.date) >= today);
  if (upcoming) {
    const daysUntil = differenceInDays(parseISO(upcoming.date), today);
    return { ...upcoming, daysUntil };
  }
  return null;
};

export const Dashboard = () => {
  const { currentUser, employees, attendance, leaves, checkIn, checkOut } = useStore();
  const theme = useRoleTheme();
  const nextHoliday = getNextHoliday();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load AI insights on mount for admin
  const loadAIInsights = async () => {
    if (!currentUser || currentUser.role !== Role.ADMIN) return;
    setIsLoadingInsights(true);
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const totalEmployees = employees.length;
      const presentToday = attendance.filter(a => a.date === todayStr && a.status === 'PRESENT').length;
      const onLeave = leaves.filter(l => 
        l.status === LeaveStatus.APPROVED && 
        new Date(l.startDate) <= today && 
        new Date(l.endDate) >= today
      ).length;
      
      const deptStats = DEPARTMENTS.map(dept => ({
        name: dept,
        employees: employees.filter(e => e.department === dept).length,
        present: attendance.filter(a => {
          const emp = employees.find(e => e.id === a.employeeId);
          return a.date === todayStr && emp?.department === dept && a.status === 'PRESENT';
        }).length
      }));

      const insights = await generateAttendanceInsights({
        totalEmployees,
        presentToday,
        onLeave,
        departmentStats: deptStats,
        recentTrend: [95, 92, 96, 94, 98, Math.round((presentToday / totalEmployees) * 100)]
      });
      setAiInsights(insights);
    } catch (error) {
      console.error('Failed to load AI insights:', error);
      setAiInsights([
        "AI insights temporarily unavailable. Click refresh to try again.",
        "Tip: Regular attendance monitoring helps identify patterns early.",
        "Consider setting up automated alerts for attendance anomalies."
      ]);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === Role.ADMIN && aiInsights.length === 0) {
      loadAIInsights();
    }
  }, [currentUser?.role]);

  if (!currentUser) return null;

  // Compute stats
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  if (currentUser.role === Role.ADMIN) {
    const totalEmployees = employees.length;
    const presentToday = attendance.filter(a => a.date === todayStr && a.status === 'PRESENT').length;
    
    const onLeaveToday = leaves.filter(l => 
        l.status === LeaveStatus.APPROVED && 
        new Date(l.startDate) <= today && 
        new Date(l.endDate) >= today
    ).length;
    const pendingLeaves = leaves.filter(l => l.status === LeaveStatus.PENDING).length;

    // Chart Data Preparation
    const deptData = DEPARTMENTS.map(dept => ({
      name: dept,
      employees: employees.filter(e => e.department === dept).length
    }));

    const trendData = [
      { name: 'Jan', present: 95 },
      { name: 'Feb', present: 92 },
      { name: 'Mar', present: 96 },
      { name: 'Apr', present: 94 },
      { name: 'May', present: 98 },
      { name: 'Jun', present: presentToday * 5 }
    ];

    return (
      <div className="relative space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">Welcome back! Here's your organization overview.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-800/50 border border-slate-700/50 px-4 py-2 rounded-xl">
            <Calendar className="w-4 h-4" />
            <span>{format(today, 'EEEE, MMMM d, yyyy')}</span>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminStatCard icon={Users} label="Total Employees" value={totalEmployees} color="text-blue-400" gradientColor="#3b82f6" isAdmin={true} />
          <AdminStatCard icon={CheckCircle} label="Present Today" value={presentToday} color="text-emerald-400" gradientColor="#10b981" isAdmin={true} />
          <AdminStatCard icon={XCircle} label="On Leave" value={onLeaveToday} color="text-orange-400" gradientColor="#f97316" isAdmin={true} />
          <AdminStatCard icon={AlertCircle} label="Pending Approvals" value={pendingLeaves} color="text-blue-400" gradientColor="#1e40af" isAdmin={true} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InteractiveCard 
            interactiveColor="#3b82f6" 
            borderRadius="16px"
            tailwindBgClass="bg-slate-800/60 backdrop-blur-md"
          >
            <div className="p-6">
              <h3 className="font-semibold text-lg text-white mb-4">Attendance Trends</h3>
              <AttendanceTrendChart data={trendData} />
            </div>
          </InteractiveCard>
          <InteractiveCard 
            interactiveColor="#1e40af" 
            borderRadius="16px"
            tailwindBgClass="bg-slate-800/60 backdrop-blur-md"
          >
            <div className="p-6">
              <h3 className="font-semibold text-lg text-white mb-4">Department Distribution</h3>
              <DepartmentStatsChart data={deptData} />
            </div>
          </InteractiveCard>
        </div>

        {/* AI-Powered Insights Card */}
        <InteractiveCard 
          interactiveColor="#8b5cf6" 
          borderRadius="16px"
          tailwindBgClass="bg-gradient-to-br from-slate-800/80 to-violet-900/30 backdrop-blur-md"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-white">AI-Powered Insights</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Powered by Gemini AI
                  </p>
                </div>
              </div>
              <button
                onClick={loadAIInsights}
                disabled={isLoadingInsights}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isLoadingInsights 
                    ? "bg-white/5 text-slate-500 cursor-not-allowed"
                    : "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 border border-violet-500/20"
                )}
              >
                <RefreshCw className={cn("w-4 h-4", isLoadingInsights && "animate-spin")} />
                {isLoadingInsights ? 'Analyzing...' : 'Refresh'}
              </button>
            </div>
            
            {isLoadingInsights ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-violet-500/30 mt-2"></div>
                    <div className="flex-1 h-4 bg-slate-700/50 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {aiInsights.map((insight, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-purple-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.5)]"></div>
                    <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </InteractiveCard>

        {/* Real-time Notifications for Admin */}
        <div className="fixed bottom-6 right-6 z-50">
          <AnimatedNotification 
            maxNotifications={4}
            autoInterval={5000}
            autoGenerate={true}
            animationDuration={500}
            variant="glass"
            showAvatars={true}
            showTimestamps={true}
            allowDismiss={true}
            position="bottom-right"
          />
        </div>

        {/* Recent Leaves List */}
        <TableCard>
          <div className="p-6">
            <h3 className="font-semibold text-lg text-white mb-4">Recent Leave Requests</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-700/50 text-slate-300">
                  <tr>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Dates</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {leaves.slice(0, 5).map(leave => {
                    const emp = employees.find(e => e.id === leave.employeeId);
                    return (
                      <tr key={leave.id} className="border-b border-slate-700 last:border-0">
                        <td className="p-3 font-medium text-white">{emp?.firstName} {emp?.lastName}</td>
                        <td className="p-3 text-slate-400">{leave.type}</td>
                        <td className="p-3 text-slate-400">{leave.startDate} to {leave.endDate}</td>
                        <td className="p-3">
                          <StatusBadge status={leave.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TableCard>
      </div>
    );
  }

  // =============================================
  // EMPLOYEE DASHBOARD - New Dark Theme Design
  // =============================================
  const myLeaves = leaves.filter(l => l.employeeId === currentUser.id);
  const myAttendance = attendance.filter(a => a.employeeId === currentUser.id);
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  
  const daysPresent = myAttendance.filter(a => {
    const recordDate = new Date(a.date);
    return recordDate >= currentMonthStart && 
           recordDate <= currentMonthEnd && 
           (a.status === 'PRESENT' || a.status === 'HALF_DAY');
  }).length;

  const empData = employees.find(e => e.id === currentUser.id);
  
  // Check-in/out logic
  const todayRecord = attendance.find(a => a.employeeId === currentUser.id && a.date === todayStr);
  const isCheckedIn = !!todayRecord?.checkIn;
  const isCheckedOut = !!todayRecord?.checkOut;
  
  // Calculate attendance percentage
  const totalWorkDays = 24; // Approximate working days in month
  const attendancePercentage = Math.round((daysPresent / totalWorkDays) * 100);
  
  // Leave balances
  const paidLeaveUsed = 15 - (empData?.leaveBalance['Paid Leave'] || 0);
  const sickLeaveUsed = 10 - (empData?.leaveBalance['Sick Leave'] || 0);
  const casualLeaveUsed = 7 - (empData?.leaveBalance['Casual Leave'] || 0);

  const handleCheckIn = () => {
    checkIn(currentUser.id);
    toast.success('Checked in successfully!');
  };

  const handleCheckOut = () => {
    checkOut(currentUser.id);
    toast.success('Checked out successfully!');
  };

  // Recent activity data
  const recentActivity = [
    {
      id: 1,
      type: 'attendance',
      title: 'Marked Attendance',
      description: 'Successfully checked in via Mobile',
      time: 'Today, 09:00 AM',
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      id: 2,
      type: 'leave',
      title: 'Leave Approved',
      description: 'Sick leave for Nov 14th approved by Manager',
      time: 'Yesterday, 04:30 PM',
      icon: FileText,
      color: 'purple'
    },
    {
      id: 3,
      type: 'payslip',
      title: 'Payslip Generated',
      description: 'Salary slip for October is ready to view',
      time: 'Oct 28, 10:00 AM',
      icon: FileText,
      color: 'cyan'
    }
  ];

  return (
    <div className="relative p-4 lg:p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#6e3df5]/15 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Welcome back, <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">{currentUser.name.split(' ')[0]}</span>
            </h1>
            <p className="text-slate-400 text-sm">Here's your daily summary and quick actions.</p>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-80">
            <div className="relative flex items-center w-full h-11 rounded-xl bg-[#0F172A]/60 border border-white/10 focus-within:ring-2 focus-within:ring-[#6e3df5]/50 transition-all overflow-hidden shadow-lg backdrop-blur-xl">
              <div className="grid place-items-center h-full w-12 text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input 
                className="peer h-full w-full outline-none text-sm text-white bg-transparent pr-4 placeholder-slate-500"
                placeholder="Find colleague or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Dashboard Grid (2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* 1. My Profile Card */}
          <InteractiveCard 
            interactiveColor="#8359f8" 
            borderRadius="20px"
            glowIntensity={0.5}
            tailwindBgClass="bg-slate-800/40 backdrop-blur-xl"
          >
            <div className="p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users className="w-16 h-16" />
              </div>
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-[#6e3df5] via-purple-500 to-cyan-400 shadow-[0_0_20px_rgba(110,61,245,0.3)]">
                    <div className="rounded-full h-full w-full overflow-hidden border-4 border-[#1E293B]">
                      <Avatar name={`${empData?.firstName} ${empData?.lastName}`} size="xl" className="w-full h-full" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 right-0 bg-emerald-500 w-4 h-4 rounded-full border-2 border-[#1E293B]" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold text-white">{empData?.firstName} {empData?.lastName}</h2>
                  <p className="text-cyan-400 text-sm font-medium mb-3">{empData?.designation}</p>
                  <Link to="/profile" className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors group/btn">
                    View Profile
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs">Department</span>
                  <span className="text-slate-200 font-medium">{empData?.department}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-slate-500 text-xs">Employee ID</span>
                  <span className="text-slate-200 font-medium">#{empData?.id}</span>
                </div>
              </div>
            </div>
          </InteractiveCard>

          {/* 2. Attendance Card */}
          <InteractiveCard 
            interactiveColor="#6e3df5" 
            borderRadius="20px"
            glowIntensity={0.5}
            tailwindBgClass="bg-slate-800/40 backdrop-blur-xl"
          >
            <div className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#6e3df5]" />
                  Attendance
                </h3>
                <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded-md text-slate-400">
                  {format(today, 'MMMM')}
                </span>
              </div>
              <div className="flex items-center gap-6 mt-2">
                {/* Circular Progress */}
                <div 
                  className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(110,61,245,0.2)]"
                  style={{
                    background: `conic-gradient(#6e3df5 0% ${attendancePercentage}%, #334155 ${attendancePercentage}% 100%)`
                  }}
                >
                  <div className="bg-[#151c2f] w-20 h-20 rounded-full flex items-center justify-center flex-col">
                    <span className="text-xl font-bold text-white">{attendancePercentage}%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-slate-200 font-medium text-lg">{daysPresent} / {totalWorkDays} Days</p>
                  <p className="text-slate-500 text-xs">You are doing great! Keep it up.</p>
                  <Link to="/attendance" className="mt-2 text-[#6e3df5] text-sm font-medium hover:text-[#6e3df5]/80 transition-colors inline-flex items-center gap-1">
                    View Details <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </InteractiveCard>

          {/* 3. Leave Balance Card */}
          <InteractiveCard 
            interactiveColor="#06b6d4" 
            borderRadius="20px"
            glowIntensity={0.5}
            tailwindBgClass="bg-slate-800/40 backdrop-blur-xl"
          >
            <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Umbrella className="w-5 h-5 text-cyan-400" />
                  Leave Balance
                </h3>
                <Link 
                  to="/leaves"
                  className="bg-gradient-to-r from-[#6e3df5] to-purple-600 hover:to-purple-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg shadow-[#6e3df5]/25 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Apply
                </Link>
              </div>
              <div className="space-y-4 flex-1">
                {/* Casual Leave */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Casual Leave</span>
                    <span className="text-slate-400">{casualLeaveUsed} / 7 Used</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(casualLeaveUsed / 7) * 100}%` }}
                    />
                  </div>
                </div>
                {/* Sick Leave */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Sick Leave</span>
                    <span className="text-slate-400">{sickLeaveUsed} / 10 Used</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(sickLeaveUsed / 10) * 100}%` }}
                    />
                  </div>
                </div>
                {/* Paid Leave */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-300">Paid Leave</span>
                    <span className="text-slate-400">{paidLeaveUsed} / 15 Used</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#6e3df5] to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(paidLeaveUsed / 15) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </InteractiveCard>

          {/* 4. Quick Actions Card */}
          <InteractiveCard 
            interactiveColor="#10b981" 
            borderRadius="20px"
            glowIntensity={0.5}
            tailwindBgClass="bg-slate-800/40 backdrop-blur-xl"
          >
            <div className="p-6 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6e3df5]/20 rounded-full blur-3xl pointer-events-none" />
              
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2 relative z-10">
                <Clock className="w-5 h-5 text-emerald-400" />
                Quick Action
              </h3>
              
              <div className="flex flex-col items-center justify-center gap-4 relative z-10">
                <div className="text-4xl font-bold text-white tracking-wider tabular-nums font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  {format(currentTime, 'hh:mm')} <span className="text-2xl">{format(currentTime, 'a')}</span>
                </div>
                
                {isCheckedIn && !isCheckedOut ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Currently Checked In
                  </div>
                ) : isCheckedOut ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-500/10 px-3 py-1 rounded-full border border-slate-500/20">
                    <span className="w-2 h-2 bg-slate-500 rounded-full" />
                    Day Completed
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    Not Checked In
                  </div>
                )}
                
                {!isCheckedIn ? (
                  <button 
                    onClick={handleCheckIn}
                    className="w-full mt-2 group relative overflow-hidden rounded-xl bg-slate-800 p-px transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#22c55e_0%,#334155_50%,#22c55e_100%)]" />
                    <div className="relative flex items-center justify-center gap-2 rounded-xl bg-slate-900/90 px-4 py-3 text-sm font-bold text-white transition-all duration-300 group-hover:bg-slate-900/80">
                      <Clock className="w-4 h-4" />
                      Check In
                    </div>
                  </button>
                ) : !isCheckedOut ? (
                  <button 
                    onClick={handleCheckOut}
                    className="w-full mt-2 group relative overflow-hidden rounded-xl bg-slate-800 p-px transition-all duration-300 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#F87171_0%,#334155_50%,#F87171_100%)]" />
                    <div className="relative flex items-center justify-center gap-2 rounded-xl bg-slate-900/90 px-4 py-3 text-sm font-bold text-white transition-all duration-300 group-hover:bg-slate-900/80">
                      <LogOut className="w-4 h-4" />
                      Check Out
                    </div>
                  </button>
                ) : (
                  <div className="w-full mt-2 rounded-xl bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-500 text-center border border-slate-700">
                    ✓ Attendance Completed
                  </div>
                )}
                
                {todayRecord?.checkIn && (
                  <p className="text-xs text-slate-500">
                    Checked in at {format(new Date(todayRecord.checkIn), 'hh:mm a')}
                  </p>
                )}
              </div>
            </div>
          </InteractiveCard>
        </div>

        {/* Recent Activity Section */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            Recent Activity
          </h2>
          
          <div className="relative pl-4 border-l border-white/10 space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={activity.id} className="relative group">
                <div 
                  className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-[#0F172A] shadow-[0_0_10px_rgba(110,61,245,0.5)] ${
                    activity.color === 'emerald' ? 'bg-emerald-500' :
                    activity.color === 'purple' ? 'bg-[#6e3df5]' :
                    'bg-cyan-500'
                  }`}
                />
                <InteractiveCard 
                  interactiveColor={
                    activity.color === 'emerald' ? '#10b981' :
                    activity.color === 'purple' ? '#8359f8' :
                    '#06b6d4'
                  }
                  borderRadius="12px"
                  rotationFactor={0.15}
                  glowIntensity={0.3}
                  tailwindBgClass="bg-slate-800/40 backdrop-blur-xl"
                >
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                          activity.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          activity.color === 'purple' ? 'bg-[#6e3df5]/10 text-[#6e3df5] border-[#6e3df5]/20' :
                          'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        }`}
                      >
                        <activity.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-medium text-sm">{activity.title}</p>
                        <p className="text-slate-500 text-xs">{activity.description}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 font-mono whitespace-nowrap">{activity.time}</span>
                  </div>
                </InteractiveCard>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
};

// Admin Stat Card with Interactive effects
const AdminStatCard = ({ icon: Icon, label, value, color, gradientColor, isAdmin }: { 
  icon: any; 
  label: string; 
  value: number; 
  color: string; 
  gradientColor: string;
  isAdmin?: boolean;
}) => (
  <InteractiveCard 
    interactiveColor={gradientColor}
    borderRadius="16px"
    rotationFactor={0.25}
    glowIntensity={0.4}
    tailwindBgClass={isAdmin ? "bg-slate-800/60 backdrop-blur-md" : "bg-[#1e1835]/60 backdrop-blur-md"}
  >
    <div className="p-6 flex items-center space-x-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br from-${gradientColor}/20 to-transparent`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className={cn("text-sm font-medium", isAdmin ? "text-slate-400" : "text-[#a090cb]")}>{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </InteractiveCard>
);

const StatusBadge = ({ status }: { status: LeaveStatus }) => {
  const styles = {
    [LeaveStatus.APPROVED]: 'success',
    [LeaveStatus.PENDING]: 'warning',
    [LeaveStatus.REJECTED]: 'danger',
  } as const;
  return <Badge variant={styles[status]}>{status}</Badge>;
};