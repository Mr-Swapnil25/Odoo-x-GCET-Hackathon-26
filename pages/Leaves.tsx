import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { LeaveType, LeaveStatus, Role } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { format, differenceInDays, isWeekend, eachDayOfInterval, parseISO, startOfMonth, endOfMonth, eachDayOfInterval as getDaysInMonth, getDay, isSameDay, isWithinInterval, formatDistanceToNow, isToday } from 'date-fns';
import { 
  Trash2, AlertCircle, Umbrella, Stethoscope, Wallet, Calendar, 
  Clock, User, FileText, Upload, ChevronLeft, ChevronRight, 
  Send, X, CheckCircle2, XCircle, Clock3, ArrowRight, Search,
  Download, ListChecks, AlertTriangle, Paperclip, Check, Terminal,
  Palette, MoreVertical, Bell, Filter, Users, Coffee, Sun, Sparkles, Loader2
} from 'lucide-react';
import { InteractiveCard } from '../components/InteractiveCard';
import { cn, useRoleTheme } from '../components/UI';
import { generateLeaveReason } from '../lib/gemini';

const leaveSchema = z.object({
  type: z.nativeEnum(LeaveType),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});

type LeaveForm = z.infer<typeof leaveSchema>;
type FilterTab = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

export const Leaves = () => {
  const { currentUser, leaves, applyLeave, employees, updateLeaveStatus, deleteLeaveRequest } = useStore();
  const [filterStatus, setFilterStatus] = useState<FilterTab>('PENDING');
  const [currentPage, setCurrentPage] = useState(1);
  const [reasonCharCount, setReasonCharCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showApprovalModal, setShowApprovalModal] = useState<string | null>(null);
  const [modalComment, setModalComment] = useState('');
  const [isGeneratingReason, setIsGeneratingReason] = useState(false);
  const itemsPerPage = 3;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      type: LeaveType.PAID
    }
  });

  const watchStartDate = watch('startDate');
  const watchEndDate = watch('endDate');

  if (!currentUser) return null;
  const isAdmin = currentUser.role === Role.ADMIN;
  const empData = employees.find(e => e.id === currentUser.id);

  // Calculate duration and weekend days
  const durationInfo = useMemo(() => {
    if (!watchStartDate || !watchEndDate) return { days: 0, weekendDays: 0 };
    try {
      const start = parseISO(watchStartDate);
      const end = parseISO(watchEndDate);
      if (end < start) return { days: 0, weekendDays: 0 };
      const allDays = eachDayOfInterval({ start, end });
      const weekendDays = allDays.filter(day => isWeekend(day)).length;
      return { days: allDays.length, weekendDays };
    } catch {
      return { days: 0, weekendDays: 0 };
    }
  }, [watchStartDate, watchEndDate]);

  const onSubmit = (data: LeaveForm) => {
    if (empData && empData.leaveBalance[data.type] <= 0) {
      toast.error(`Insufficient ${data.type} balance!`);
      return;
    }

    applyLeave({
      employeeId: currentUser.id,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason
    });
    toast.success('Leave requested successfully');
    reset();
    setReasonCharCount(0);
  };

  const handleCancelLeave = (id: string) => {
    if (confirm('Are you sure you want to cancel this leave request?')) {
      deleteLeaveRequest(id);
      toast.success('Leave request cancelled');
    }
  };

  const handleApprove = (id: string, comment?: string) => {
    updateLeaveStatus(id, LeaveStatus.APPROVED, comment || adminNotes[id] || "Approved by Admin");
    toast.success('Leave request approved');
    setAdminNotes(prev => ({ ...prev, [id]: '' }));
    setShowApprovalModal(null);
    setModalComment('');
  };

  const handleReject = (id: string, comment?: string) => {
    updateLeaveStatus(id, LeaveStatus.REJECTED, comment || adminNotes[id] || "Rejected by Admin");
    toast.error('Leave request rejected');
    setAdminNotes(prev => ({ ...prev, [id]: '' }));
  };

  // Filter leaves based on search, type, department
  const filteredLeaves = useMemo(() => {
    let filtered = isAdmin
      ? leaves.filter(l => filterStatus === 'ALL' || l.status === filterStatus)
      : leaves.filter(l => l.employeeId === currentUser.id && (filterStatus === 'ALL' || l.status === filterStatus));

    if (searchQuery) {
      filtered = filtered.filter(l => {
        const emp = employees.find(e => e.id === l.employeeId);
        const fullName = `${emp?.firstName} ${emp?.lastName}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
      });
    }

    if (leaveTypeFilter !== 'all') {
      filtered = filtered.filter(l => l.type === leaveTypeFilter);
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(l => {
        const emp = employees.find(e => e.id === l.employeeId);
        return emp?.department === departmentFilter;
      });
    }

    return filtered;
  }, [leaves, filterStatus, searchQuery, leaveTypeFilter, departmentFilter, isAdmin, currentUser.id, employees]);

  const displayedLeaves = filteredLeaves;

  const sortedLeaves = [...displayedLeaves].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination
  const totalPages = Math.ceil(sortedLeaves.length / itemsPerPage);
  const paginatedLeaves = sortedLeaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Leave balance calculations
  const leaveBalances = empData ? {
    paid: { used: 24 - (empData.leaveBalance[LeaveType.PAID] || 0), total: 24, available: empData.leaveBalance[LeaveType.PAID] || 0 },
    sick: { used: 12 - (empData.leaveBalance[LeaveType.SICK] || 0), total: 12, available: empData.leaveBalance[LeaveType.SICK] || 0 },
    unpaid: { used: Math.abs(empData.leaveBalance[LeaveType.UNPAID] || 0), total: 0, available: 0 },
  } : null;

  // Get counts for tabs
  const pendingCount = leaves.filter(l => isAdmin ? l.status === LeaveStatus.PENDING : (l.employeeId === currentUser.id && l.status === LeaveStatus.PENDING)).length;
  const approvedCount = leaves.filter(l => isAdmin ? l.status === LeaveStatus.APPROVED : (l.employeeId === currentUser.id && l.status === LeaveStatus.APPROVED)).length;
  const rejectedCount = leaves.filter(l => isAdmin ? l.status === LeaveStatus.REJECTED : (l.employeeId === currentUser.id && l.status === LeaveStatus.REJECTED)).length;
  const newRequestsCount = pendingCount;

  // Calendar data
  const calendarDays = useMemo(() => {
    const start = startOfMonth(calendarMonth);
    const end = endOfMonth(calendarMonth);
    const days = getDaysInMonth({ start, end });
    const startDayOfWeek = getDay(start);
    const emptyDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    return { days, emptyDays };
  }, [calendarMonth]);

  // Get leaves on a specific day
  const getLeavesOnDay = (day: Date) => {
    return leaves.filter(l => {
      try {
        const start = parseISO(l.startDate);
        const end = parseISO(l.endDate);
        return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end);
      } catch {
        return false;
      }
    });
  };

  // Get people on leave today
  const onLeaveToday = useMemo(() => {
    const today = new Date();
    return leaves.filter(l => {
      if (l.status !== LeaveStatus.APPROVED) return false;
      try {
        const start = parseISO(l.startDate);
        const end = parseISO(l.endDate);
        return isWithinInterval(today, { start, end }) || isSameDay(today, start) || isSameDay(today, end);
      } catch {
        return false;
      }
    }).map(l => ({
      leave: l,
      employee: employees.find(e => e.id === l.employeeId)
    }));
  }, [leaves, employees]);

  // Get upcoming leaves (next 3 days)
  const upcomingLeaves = useMemo(() => {
    const today = new Date();
    const threeDaysLater = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    return leaves.filter(l => {
      if (l.status !== LeaveStatus.APPROVED) return false;
      try {
        const start = parseISO(l.startDate);
        return start > today && start <= threeDaysLater;
      } catch {
        return false;
      }
    }).map(l => employees.find(e => e.id === l.employeeId)).filter(Boolean);
  }, [leaves, employees]);

  // Get unique departments
  const departments = [...new Set(employees.map(e => e.department))];

  const getStatusIcon = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.PENDING: return <Clock3 className="w-[18px] h-[18px]" />;
      case LeaveStatus.APPROVED: return <CheckCircle2 className="w-[18px] h-[18px]" />;
      case LeaveStatus.REJECTED: return <XCircle className="w-[18px] h-[18px]" />;
    }
  };

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case LeaveStatus.PENDING: return { bg: 'bg-orange-400/10', border: 'border-l-orange-400', text: 'text-orange-400', badge: 'bg-orange-400/20 border-orange-400/20' };
      case LeaveStatus.APPROVED: return { bg: 'bg-emerald-500/10', border: 'border-l-emerald-500', text: 'text-emerald-500', badge: 'bg-emerald-500/20 border-emerald-500/20' };
      case LeaveStatus.REJECTED: return { bg: 'bg-red-500/10', border: 'border-l-red-500', text: 'text-red-500', badge: 'bg-red-500/20 border-red-500/20' };
    }
  };

  const getLeaveTypeIcon = (type: LeaveType) => {
    switch (type) {
      case LeaveType.SICK: return <Stethoscope className="w-4 h-4" />;
      case LeaveType.PAID: return <Umbrella className="w-4 h-4" />;
      case LeaveType.UNPAID: return <Wallet className="w-4 h-4" />;
      case LeaveType.CASUAL: return <Calendar className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getLeaveTypeColor = (type: LeaveType) => {
    switch (type) {
      case LeaveType.SICK: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case LeaveType.PAID: return 'bg-green-500/10 text-green-400 border-green-500/20';
      case LeaveType.UNPAID: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case LeaveType.CASUAL: return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  // Admin View - Time Off Approvals
  if (isAdmin) {
    return (
      <div className="relative min-h-screen">
        {/* Background Decorations */}
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#8055f6]/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-[#0bda6c]/5 rounded-full blur-[100px]"></div>
          <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] bg-[#3b82f6]/10 rounded-full blur-[90px]"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMCAwTDQwIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] opacity-30"></div>
        </div>

        <main className="px-4 py-8 md:px-6 lg:px-8 max-w-[1400px] mx-auto">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-black tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8055f6] via-[#a855f7] to-[#3b82f6]">
                    Time Off Approvals
                  </span>
                </h1>
                {newRequestsCount > 0 && (
                  <span className="bg-gradient-to-r from-[#8055f6]/20 to-[#f59e0b]/20 text-[#f59e0b] text-xs font-bold px-3 py-1.5 rounded-full border border-[#f59e0b]/30 shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-[#f59e0b] rounded-full"></span>
                    {newRequestsCount} New
                  </span>
                )}
              </div>
              <p className="text-[#a49cba] text-sm">Review, approve, or reject team leave requests.</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[rgba(20,20,25,0.6)] border border-white/[0.1] backdrop-blur px-4 py-2.5 rounded-xl text-sm font-medium text-[#a49cba] hover:text-white hover:bg-white/5 hover:border-[#8055f6]/30 transition-all flex items-center gap-2 group">
                <Download className="w-4 h-4 group-hover:text-[#8055f6]" />
                Export Report
              </button>
              <button className="bg-gradient-to-r from-[#8055f6]/10 to-[#3b82f6]/10 hover:from-[#8055f6]/20 hover:to-[#3b82f6]/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border border-[#8055f6]/20 hover:border-[#8055f6]/40 hover:shadow-[0_0_20px_rgba(128,85,246,0.2)]">
                <ListChecks className="w-4 h-4 text-[#8055f6]" />
                Bulk Actions
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-[rgba(30,27,38,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <div className="relative w-full lg:w-1/4 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5e596e] group-focus-within:text-[#8055f6] transition-colors" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[rgba(20,20,25,0.8)] border border-white/[0.08] backdrop-blur w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-[#5e596e] focus:outline-none focus:ring-0 focus:border-[#8055f6] focus:shadow-[0_0_0_1px_#8055f6,0_0_20px_rgba(128,85,246,0.15)] transition-all"
                placeholder="Search employee..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative min-w-[140px] flex-1 lg:flex-none">
                <select 
                  value={leaveTypeFilter}
                  onChange={(e) => setLeaveTypeFilter(e.target.value)}
                  className="bg-[rgba(20,20,25,0.8)] border border-white/[0.08] backdrop-blur w-full pl-3 pr-10 py-2.5 rounded-xl text-sm text-[#a49cba] focus:text-white appearance-none cursor-pointer focus:outline-none focus:ring-0 focus:border-[#8055f6] hover:border-white/20 transition-all"
                >
                  <option value="all" className="bg-[#1e1b26]">Leave Type</option>
                  <option value={LeaveType.PAID} className="bg-[#1e1b26]">Paid Leave</option>
                  <option value={LeaveType.SICK} className="bg-[#1e1b26]">Sick Leave</option>
                  <option value={LeaveType.CASUAL} className="bg-[#1e1b26]">Casual Leave</option>
                  <option value={LeaveType.UNPAID} className="bg-[#1e1b26]">Unpaid Leave</option>
                </select>
                <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e596e] pointer-events-none rotate-[-90deg]" />
              </div>
              <div className="relative min-w-[140px] flex-1 lg:flex-none">
                <select 
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-[rgba(20,20,25,0.8)] border border-white/[0.08] backdrop-blur w-full pl-3 pr-10 py-2.5 rounded-xl text-sm text-[#a49cba] focus:text-white appearance-none cursor-pointer focus:outline-none focus:ring-0 focus:border-[#8055f6] hover:border-white/20 transition-all"
                >
                  <option value="all" className="bg-[#1e1b26]">Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept} className="bg-[#1e1b26]">{dept}</option>
                  ))}
                </select>
                <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e596e] pointer-events-none rotate-[-90deg]" />
              </div>
              <div className="relative min-w-[160px] flex-1 lg:flex-none">
                <button className="bg-[rgba(20,20,25,0.8)] border border-white/[0.08] backdrop-blur w-full px-3 py-2.5 rounded-xl text-sm text-[#a49cba] flex items-center justify-between hover:text-white hover:border-white/20 transition-all">
                  <span>Last 30 Days</span>
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
              <button className="bg-[rgba(20,20,25,0.8)] border border-white/[0.08] backdrop-blur p-2.5 rounded-xl text-[#5e596e] hover:text-[#f59e0b] hover:border-[#f59e0b]/30 hover:bg-[#f59e0b]/5 transition-all" title="More Filters">
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Column - Leave Requests */}
            <div className="xl:col-span-3 flex flex-col gap-6">
              {/* Status Tabs */}
              <div className="flex items-center gap-8 border-b border-white/[0.08] px-2">
                <button 
                  onClick={() => { setFilterStatus('PENDING'); setCurrentPage(1); }}
                  className={`relative pb-4 font-medium text-sm flex items-center gap-2 group transition-colors ${filterStatus === 'PENDING' ? 'text-white' : 'text-[#5e596e] hover:text-white'}`}
                >
                  Pending
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all ${filterStatus === 'PENDING' ? 'bg-[#f59e0b] text-[#1e1b26] shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-white/5 text-[#5e596e] border border-white/[0.08]'}`}>
                    {pendingCount}
                  </span>
                  {filterStatus === 'PENDING' && (
                    <>
                      <span className="absolute -top-1 -right-2 w-2 h-2 bg-[#f59e0b] rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#f59e0b] to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => { setFilterStatus('APPROVED'); setCurrentPage(1); }}
                  className={`relative pb-4 font-medium text-sm flex items-center gap-2 group transition-colors ${filterStatus === 'APPROVED' ? 'text-white' : 'text-[#5e596e] hover:text-white'}`}
                >
                  Approved
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all ${filterStatus === 'APPROVED' ? 'bg-[#0bda6c] text-[#1e1b26] shadow-[0_0_10px_rgba(11,218,108,0.3)]' : 'bg-white/5 text-[#5e596e] border border-white/[0.08]'}`}>
                    {approvedCount}
                  </span>
                  {filterStatus === 'APPROVED' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#0bda6c] to-[#059669] shadow-[0_0_10px_rgba(11,218,108,0.5)]"></span>
                  )}
                </button>
                <button 
                  onClick={() => { setFilterStatus('REJECTED'); setCurrentPage(1); }}
                  className={`relative pb-4 font-medium text-sm flex items-center gap-2 group transition-colors ${filterStatus === 'REJECTED' ? 'text-white' : 'text-[#5e596e] hover:text-white'}`}
                >
                  Rejected
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all ${filterStatus === 'REJECTED' ? 'bg-[#ef4444] text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-white/5 text-[#5e596e] border border-white/[0.08]'}`}>
                    {rejectedCount}
                  </span>
                  {filterStatus === 'REJECTED' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#ef4444] to-[#dc2626] shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                  )}
                </button>
                <button 
                  onClick={() => { setFilterStatus('ALL'); setCurrentPage(1); }}
                  className={`relative pb-4 font-medium text-sm flex items-center gap-2 group transition-colors ${filterStatus === 'ALL' ? 'text-white' : 'text-[#5e596e] hover:text-white'}`}
                >
                  All
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${filterStatus === 'ALL' ? 'bg-[#8055f6] text-white' : 'bg-white/5 text-[#5e596e] border border-white/[0.08]'}`}>
                    {leaves.length}
                  </span>
                  {filterStatus === 'ALL' && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-[#8055f6] to-[#3b82f6] shadow-[0_0_10px_rgba(128,85,246,0.5)]"></span>
                  )}
                </button>
              </div>

              {/* Leave Request Cards */}
              <div className="flex flex-col gap-5">
                {paginatedLeaves.length === 0 ? (
                  <div className="bg-[rgba(30,27,38,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#8055f6]/10 flex items-center justify-center mx-auto mb-5">
                      <AlertCircle className="w-8 h-8 text-[#8055f6]" />
                    </div>
                    <p className="text-white text-lg font-medium mb-1">No leave requests found</p>
                    <p className="text-[#5e596e] text-sm">Requests matching your filters will appear here.</p>
                    {(searchQuery || leaveTypeFilter !== 'all' || departmentFilter !== 'all') && (
                      <button 
                        onClick={() => { setSearchQuery(''); setLeaveTypeFilter('all'); setDepartmentFilter('all'); }}
                        className="mt-4 px-4 py-2 text-sm text-[#8055f6] hover:text-white border border-[#8055f6]/30 hover:border-[#8055f6] rounded-xl transition-all"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  paginatedLeaves.map((leave) => {
                    const emp = employees.find(e => e.id === leave.employeeId);
                    const days = differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
                    const statusColors = getStatusColor(leave.status);
                    const isPending = leave.status === LeaveStatus.PENDING;
                    const isApprovedStatus = leave.status === LeaveStatus.APPROVED;
                    const isRejectedStatus = leave.status === LeaveStatus.REJECTED;
                    const timeAgo = formatDistanceToNow(new Date(leave.createdAt), { addSuffix: true });

                    // Check for conflicts (other employees on leave during same period)
                    const conflicts = leaves.filter(l => {
                      if (l.id === leave.id || l.status === LeaveStatus.REJECTED) return false;
                      const otherEmp = employees.find(e => e.id === l.employeeId);
                      if (otherEmp?.department !== emp?.department) return false;
                      try {
                        const leaveStart = parseISO(leave.startDate);
                        const leaveEnd = parseISO(leave.endDate);
                        const otherStart = parseISO(l.startDate);
                        const otherEnd = parseISO(l.endDate);
                        return (leaveStart <= otherEnd && leaveEnd >= otherStart);
                      } catch {
                        return false;
                      }
                    });

                    return (
                      <div 
                        key={leave.id}
                        className={`bg-[rgba(30,27,38,0.6)] backdrop-blur-xl border rounded-2xl p-6 relative overflow-hidden group transition-all duration-300 ${
                          isPending ? 'border-[#f59e0b]/20 hover:border-[#f59e0b]/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] hover:shadow-[0_12px_40px_0_rgba(245,158,11,0.1)]' : 
                          isApprovedStatus ? 'border-white/[0.05] opacity-75 hover:opacity-100 hover:border-[#0bda6c]/30' :
                          'border-white/[0.05] opacity-60 hover:opacity-90 hover:border-[#ef4444]/30'
                        }`}
                      >
                        {/* Left Border Indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          isPending ? 'bg-gradient-to-b from-[#f59e0b] via-orange-500 to-[#f59e0b] shadow-[2px_0_15px_rgba(245,158,11,0.3)]' :
                          isApprovedStatus ? 'bg-gradient-to-b from-[#0bda6c] to-[#059669]' : 'bg-gradient-to-b from-[#ef4444] to-[#dc2626]'
                        }`}></div>

                        {/* Pending Glow Effect */}
                        {isPending && (
                          <div className="absolute top-0 left-0 w-32 h-32 bg-[#f59e0b]/5 rounded-full blur-3xl pointer-events-none"></div>
                        )}

                        {/* Status Badge */}
                        {(isApprovedStatus || isRejectedStatus) && (
                          <div className="absolute right-4 top-4">
                            <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                              isApprovedStatus ? 'text-[#0bda6c] bg-[#0bda6c]/10 border-[#0bda6c]/20' : 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20'
                            }`}>
                              {isApprovedStatus ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {leave.status}
                            </span>
                          </div>
                        )}

                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Employee Info Section */}
                          <div className={`w-full lg:w-1/4 flex lg:flex-col items-center lg:items-start gap-4 lg:border-r lg:border-white/[0.08] lg:pr-6 ${!isPending ? 'mt-2' : ''}`}>
                            <div className={`${isPending ? 'bg-gradient-to-r from-[#8055f6] to-[#3b82f6] p-[2px] rounded-full shadow-[0_0_20px_rgba(128,85,246,0.3)]' : ''} shrink-0`}>
                              <div 
                                className={`${isPending ? 'w-16 h-16' : 'w-12 h-12'} bg-gray-800 rounded-full bg-cover bg-center ${!isPending ? 'grayscale-[30%]' : ''} ${isPending ? 'border-2 border-[#0f0f12]' : ''}`}
                                style={{ 
                                  backgroundImage: emp?.avatarUrl 
                                    ? `url('${emp.avatarUrl}')` 
                                    : `linear-gradient(135deg, #8055f6 0%, #3b82f6 100%)` 
                                }}
                              >
                                {!emp?.avatarUrl && (
                                  <div className="w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    {emp?.firstName?.charAt(0)}{emp?.lastName?.charAt(0)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <h3 className={`${isPending ? 'text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#8055f6] to-[#3b82f6]' : 'text-base font-bold text-gray-300'}`}>
                                {emp?.firstName} {emp?.lastName}
                              </h3>
                              <p className="text-xs text-[#a49cba] font-mono mb-1">ID: {emp?.id}</p>
                              <div className="inline-flex items-center gap-1 bg-[#2c2839] px-2 py-1 rounded text-xs text-[#a49cba]">
                                {emp?.department === 'Engineering' ? <Terminal className="w-3 h-3" /> : 
                                 emp?.department === 'Design' || emp?.department === 'Product Design' ? <Palette className="w-3 h-3" /> : 
                                 <User className="w-3 h-3" />}
                                {emp?.department}
                              </div>
                            </div>
                          </div>

                          {/* Leave Details Section */}
                          <div className="flex-1 flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${getLeaveTypeColor(leave.type)}`}>
                                    {getLeaveTypeIcon(leave.type)}
                                    {leave.type}
                                  </span>
                                  <span className="text-xs text-[#a49cba]">Applied {timeAgo}</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                  <h4 className={`${isPending ? 'text-2xl' : 'text-xl'} font-bold text-white`}>
                                    {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                                  </h4>
                                </div>
                              </div>
                              {isPending && (
                                <div className="text-center bg-white/[0.06] px-4 py-2 rounded-xl border border-white/[0.08]">
                                  <span className="block text-3xl font-black text-white leading-none">{days}</span>
                                  <span className="text-[10px] uppercase tracking-wider text-[#a49cba] font-bold">Days</span>
                                </div>
                              )}
                              {!isPending && (
                                <div className="text-center bg-white/[0.06] px-3 py-1.5 rounded-xl border border-white/[0.08]">
                                  <span className="block text-2xl font-black text-white leading-none">{days}</span>
                                  <span className="text-[9px] uppercase tracking-wider text-[#a49cba] font-bold">Days</span>
                                </div>
                              )}
                            </div>

                            {/* Reason Box - Only for pending */}
                            {isPending && (
                              <>
                                <div className="bg-black/30 rounded-xl p-4 border border-white/[0.05]">
                                  <p className="text-sm text-gray-300 italic leading-relaxed">"{leave.reason}"</p>
                                  {leave.type === LeaveType.SICK && (
                                    <a className="inline-flex items-center gap-2 text-xs text-[#8055f6] hover:text-white transition-colors group/link mt-3" href="#">
                                      <span className="bg-[#8055f6]/10 p-1.5 rounded-lg group-hover/link:bg-[#8055f6]/20 transition-colors">
                                        <Paperclip className="w-3.5 h-3.5" />
                                      </span>
                                      Medical_Certificate.pdf
                                    </a>
                                  )}
                                </div>

                                {/* Conflict Alert */}
                                {conflicts.length > 0 && (
                                  <div className="flex items-center gap-2.5 text-xs text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20 px-3 py-2.5 rounded-xl">
                                    <AlertTriangle className="w-4 h-4 animate-pulse shrink-0" />
                                    <span>Conflict Alert: <span className="text-white font-medium">{conflicts.length}</span> other {emp?.department?.toLowerCase()} team member{conflicts.length > 1 ? 's are' : ' is'} on leave during this period.</span>
                                  </div>
                                )}

                                {/* Admin Action Section */}
                                <div className="mt-2 pt-4 border-t border-white/[0.08] flex flex-col md:flex-row gap-4">
                                  <div className="flex-1 relative group">
                                    <input 
                                      type="text"
                                      value={adminNotes[leave.id] || ''}
                                      onChange={(e) => setAdminNotes(prev => ({ ...prev, [leave.id]: e.target.value }))}
                                      maxLength={100}
                                      className="bg-[rgba(20,20,25,0.8)] border border-white/[0.08] backdrop-blur w-full rounded-xl py-2.5 pl-3 pr-14 text-sm text-white placeholder-[#5e596e] focus:outline-none focus:ring-0 focus:border-[#8055f6] focus:shadow-[0_0_0_1px_#8055f6,0_0_20px_rgba(128,85,246,0.15)] transition-all"
                                      placeholder="Add a note (optional)..."
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#5e596e] bg-white/5 px-1.5 py-0.5 rounded">
                                      {(adminNotes[leave.id] || '').length}/100
                                    </span>
                                  </div>
                                  <div className="flex gap-3 shrink-0">
                                    <button 
                                      onClick={() => handleReject(leave.id)}
                                      className="px-5 py-2.5 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm font-bold hover:bg-gradient-to-r hover:from-[#ef4444] hover:to-[#dc2626] hover:text-white hover:border-transparent hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] transition-all hover:-translate-y-0.5 flex items-center gap-2"
                                    >
                                      <XCircle className="w-4 h-4" />
                                      Reject
                                    </button>
                                    <button 
                                      onClick={() => setShowApprovalModal(leave.id)}
                                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0bda6c] to-[#059669] text-white text-sm font-bold shadow-[0_0_25px_rgba(11,218,108,0.2)] hover:shadow-[0_0_35px_rgba(11,218,108,0.4)] transition-all hover:-translate-y-0.5 flex items-center gap-2"
                                    >
                                      <Check className="w-4 h-4" />
                                      Approve
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Non-pending shows reason inline */}
                            {!isPending && (
                              <>
                                {isApprovedStatus && leave.adminComment && (
                                  <div className="bg-[#0bda6c]/5 p-3 rounded-xl border border-[#0bda6c]/10 mb-2">
                                    <p className="text-xs text-[#5e596e]">
                                      <span className="text-[#0bda6c] font-medium">✓ Approved</span> • {format(new Date(leave.createdAt), 'MMM d, yyyy')}
                                    </p>
                                    <p className="text-xs text-[#a49cba] mt-1">"{leave.adminComment}"</p>
                                  </div>
                                )}
                                {leave.status === LeaveStatus.REJECTED && leave.adminComment && (
                                  <div className="bg-[#ef4444]/5 p-3 rounded-xl border border-[#ef4444]/10 mb-2">
                                    <p className="text-xs text-[#5e596e]">
                                      <span className="text-[#ef4444] font-medium">✗ Rejected</span> • {format(new Date(leave.createdAt), 'MMM d, yyyy')}
                                    </p>
                                    <p className="text-xs text-[#a49cba] mt-1">"{leave.adminComment}"</p>
                                  </div>
                                )}
                                <p className="text-sm text-[#a49cba] italic">"{leave.reason}"</p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex gap-2 bg-white/[0.02] p-1.5 rounded-xl border border-white/[0.05]">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#5e596e] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                          currentPage === page
                            ? 'bg-[#8055f6] text-white shadow-[0_0_20px_rgba(128,85,246,0.4)]'
                            : 'text-[#5e596e] hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-[#5e596e] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </nav>
                </div>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="xl:col-span-1 flex flex-col gap-6">
              {/* Team Calendar */}
              <div className="bg-[rgba(30,27,38,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#8055f6]" />
                    Team Calendar
                  </h3>
                  <button className="text-[#5e596e] hover:text-[#8055f6] transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center mb-4 px-1">
                  <button 
                    onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[#5e596e] hover:text-white hover:bg-white/10 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-white">{format(calendarMonth, 'MMMM yyyy')}</span>
                  <button 
                    onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
                    className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-[#5e596e] hover:text-white hover:bg-white/10 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5 mb-2 text-[#5e596e] text-[10px] uppercase font-bold text-center">
                  <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {/* Empty cells for start of month */}
                  {Array.from({ length: calendarDays.emptyDays }, (_, i) => (
                    <div key={`empty-${i}`} className="aspect-square"></div>
                  ))}
                  {/* Days of month */}
                  {calendarDays.days.map((day, i) => {
                    const leavesOnDay = getLeavesOnDay(day);
                    const hasPending = leavesOnDay.some(l => l.status === LeaveStatus.PENDING);
                    const hasApproved = leavesOnDay.some(l => l.status === LeaveStatus.APPROVED);
                    const isWeekendDay = isWeekend(day);
                    const isTodayDate = isToday(day);
                    
                    return (
                      <div 
                        key={i}
                        className={`aspect-square flex items-center justify-center text-xs rounded-lg cursor-pointer relative transition-all
                          ${isTodayDate ? 'bg-[#8055f6] text-white font-bold shadow-[0_0_15px_rgba(128,85,246,0.4)]' : ''}
                          ${!isTodayDate && isWeekendDay ? 'text-[#5e596e]' : !isTodayDate ? 'text-white' : ''}
                          ${!isTodayDate && hasPending ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : ''}
                          ${!isTodayDate && hasApproved && !hasPending ? 'bg-[#0bda6c]/10' : ''}
                          ${!hasPending && !hasApproved && !isTodayDate ? 'hover:bg-white/5' : ''}
                        `}
                      >
                        {day.getDate()}
                        {hasApproved && !hasPending && !isTodayDate && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0bda6c] shadow-[0_0_4px_rgba(11,218,108,0.5)]"></span>
                        )}
                        {hasPending && !isTodayDate && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#f59e0b] shadow-[0_0_4px_rgba(245,158,11,0.5)] animate-pulse"></span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 justify-center">
                  <div className="flex items-center gap-1.5 text-[10px] text-[#a49cba]">
                    <span className="w-2 h-2 rounded-full bg-[#0bda6c] shadow-[0_0_4px_rgba(11,218,108,0.5)]"></span> Approved
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#a49cba]">
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_4px_rgba(245,158,11,0.5)]"></span> Pending
                  </div>
                </div>
              </div>

              {/* On Leave Today */}
              <div className="bg-[rgba(30,27,38,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 flex-grow shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-[#f59e0b]" />
                    On Leave Today
                  </h3>
                  <span className="text-[10px] font-bold text-[#a49cba] bg-white/5 px-2 py-1 rounded-full">{onLeaveToday.length} people</span>
                </div>
                <div className="flex flex-col gap-2">
                  {onLeaveToday.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 rounded-full bg-[#0bda6c]/10 flex items-center justify-center mx-auto mb-3">
                        <Sun className="w-6 h-6 text-[#0bda6c]" />
                      </div>
                      <p className="text-sm text-[#a49cba]">Everyone's in today!</p>
                      <p className="text-xs text-[#5e596e] mt-1">Full team attendance</p>
                    </div>
                  ) : (
                    onLeaveToday.slice(0, 4).map(({ leave, employee }) => (
                      <div key={leave.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] transition-all cursor-pointer group">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8055f6] to-[#3b82f6] flex items-center justify-center text-white font-bold text-xs border-2 border-[#0f0f12] shrink-0">
                          {employee?.firstName?.charAt(0)}{employee?.lastName?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-[#8055f6] transition-colors">{employee?.firstName} {employee?.lastName}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#5e596e]">
                            <span className={`${leave.type === LeaveType.SICK ? 'text-blue-400' : leave.type === LeaveType.PAID ? 'text-green-400' : 'text-purple-400'}`}>
                              {leave.type.split(' ')[0]}
                            </span>
                            <span>•</span>
                            <span>Until {format(new Date(leave.endDate), 'MMM d')}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#5e596e] group-hover:text-[#8055f6] opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    ))
                  )}
                </div>
                {onLeaveToday.length > 4 && (
                  <button className="w-full mt-3 py-2 text-xs text-[#8055f6] hover:text-white transition-colors">
                    View all {onLeaveToday.length} people →
                  </button>
                )}
                <div className="mt-5 pt-4 border-t border-white/[0.08]">
                  <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#3b82f6]" />
                    Upcoming (3 Days)
                  </h3>
                  <div className="flex -space-x-2">
                    {upcomingLeaves.slice(0, 5).map((emp, i) => (
                      <div 
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-[#1e1b26] bg-gradient-to-br from-[#8055f6] to-[#3b82f6] flex items-center justify-center text-[10px] text-white font-bold hover:scale-110 hover:z-10 transition-transform cursor-pointer shadow-lg"
                        title={`${emp?.firstName} ${emp?.lastName}`}
                      >
                        {emp?.firstName?.charAt(0)}{emp?.lastName?.charAt(0)}
                      </div>
                    ))}
                    {upcomingLeaves.length > 5 && (
                      <div className="w-8 h-8 rounded-full border-2 border-[#1e1b26] bg-[#2c2839] flex items-center justify-center text-[10px] text-white font-bold hover:scale-110 hover:z-10 transition-transform cursor-pointer">
                        +{upcomingLeaves.length - 5}
                      </div>
                    )}
                    {upcomingLeaves.length === 0 && (
                      <p className="text-xs text-[#5e596e]">No upcoming leaves in the next 3 days</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Approval Confirmation Modal */}
        {showApprovalModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowApprovalModal(null)}></div>
            <div className="relative w-full max-w-md bg-[rgba(30,27,38,0.98)] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] animate-fade-in-up">
              {/* Top Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0bda6c] via-[#34d399] to-[#0bda6c] rounded-t-2xl"></div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0bda6c]/20 to-[#059669]/20 flex items-center justify-center mb-4 text-[#0bda6c] border border-[#0bda6c]/20 shadow-[0_0_30px_rgba(11,218,108,0.2)]">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Approve Request?</h3>
                {(() => {
                  const leave = leaves.find(l => l.id === showApprovalModal);
                  const emp = employees.find(e => e.id === leave?.employeeId);
                  const days = leave ? differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1 : 0;
                  return (
                    <p className="text-[#a49cba] text-sm mb-6 leading-relaxed">
                      You are about to approve <span className="text-white font-medium">{emp?.firstName} {emp?.lastName}'s</span> {leave?.type} for <span className="text-white font-medium">{days} days</span>. An email notification will be sent immediately.
                    </p>
                  );
                })()}
                <div className="w-full mb-6">
                  <label className="text-xs font-bold text-[#5e596e] uppercase tracking-wider block text-left mb-2">Add Comment</label>
                  <textarea 
                    value={modalComment}
                    onChange={(e) => setModalComment(e.target.value)}
                    className="bg-[rgba(20,20,25,0.8)] border border-white/[0.08] backdrop-blur w-full rounded-xl p-3 text-sm text-white resize-none placeholder-[#5e596e] focus:outline-none focus:ring-0 focus:border-[#0bda6c]/50 focus:shadow-[0_0_20px_rgba(11,218,108,0.1)] transition-all"
                    placeholder="Add a comment for the employee (optional)..."
                    rows={3}
                  ></textarea>
                </div>
                <div className="flex gap-3 w-full">
                  <button 
                    onClick={() => { setShowApprovalModal(null); setModalComment(''); }}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-[#a49cba] font-medium hover:bg-white/10 hover:text-white border border-white/[0.08] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleApprove(showApprovalModal, modalComment)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0bda6c] to-[#059669] text-white font-bold shadow-[0_0_25px_rgba(11,218,108,0.25)] hover:shadow-[0_0_35px_rgba(11,218,108,0.4)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Scrollbar Styles */}
        <style>{`
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #131118;
          }
          ::-webkit-scrollbar-thumb {
            background: #2c2839;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #413b54;
          }
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out;
          }
        `}</style>
      </div>
    );
  }

  // Employee View - Request Time Off (Original)
  return (
    <div className="relative">
      {/* Background Decorations */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8055f6]/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#3b82f6]/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-[#0bda6c]/5 rounded-full blur-[80px]"></div>
      </div>

      <main className="px-4 py-8 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8055f6] to-[#3b82f6]">
                Request Time Off
              </span>
            </h1>
            <p className="text-[#a49cba] text-base font-normal">Manage your leave requests and track your balance.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#a49cba] bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-full">
            <Calendar className="w-4 h-4" />
            <span>Current Cycle: Jan 1 - Dec 31, 2026</span>
          </div>
        </div>

        {/* Stats Overview - Only for employees */}
        {!isAdmin && leaveBalances && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {/* Paid Leave */}
            <InteractiveCard
              interactiveColor="#0bda6c"
              borderRadius="16px"
              glowIntensity={0.5}
              tailwindBgClass="bg-[rgba(30,27,38,0.6)] backdrop-blur-xl"
            >
              <div className="p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                  <Umbrella className="w-9 h-9 text-[#0bda6c]" />
                </div>
                <div className="relative z-10">
                  <p className="text-[#a49cba] text-sm font-medium uppercase tracking-wider mb-1">Paid Leave</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold text-white">{leaveBalances.paid.available}</span>
                    <span className="text-lg text-[#a49cba]">/ {leaveBalances.paid.total} days</span>
                  </div>
                  <div className="w-full bg-[#2c2839] rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-[#0bda6c] to-[#34d399] h-2 rounded-full shadow-[0_0_10px_rgba(11,218,108,0.4)]" 
                      style={{ width: `${(leaveBalances.paid.available / leaveBalances.paid.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[#0bda6c] text-xs font-semibold">
                    +{Math.round((leaveBalances.paid.available / leaveBalances.paid.total) * 100)}% available
                  </p>
                </div>
              </div>
            </InteractiveCard>

            {/* Sick Leave */}
            <InteractiveCard
              interactiveColor="#3b82f6"
              borderRadius="16px"
              glowIntensity={0.5}
              tailwindBgClass="bg-[rgba(30,27,38,0.6)] backdrop-blur-xl"
            >
              <div className="p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                  <Stethoscope className="w-9 h-9 text-[#3b82f6]" />
                </div>
                <div className="relative z-10">
                  <p className="text-[#a49cba] text-sm font-medium uppercase tracking-wider mb-1">Sick Leave</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold text-white">{leaveBalances.sick.available}</span>
                    <span className="text-lg text-[#a49cba]">/ {leaveBalances.sick.total} days</span>
                  </div>
                  <div className="w-full bg-[#2c2839] rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] h-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]" 
                      style={{ width: `${(leaveBalances.sick.available / leaveBalances.sick.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[#3b82f6] text-xs font-semibold">
                    +{Math.round((leaveBalances.sick.available / leaveBalances.sick.total) * 100)}% available
                  </p>
                </div>
              </div>
            </InteractiveCard>

            {/* Unpaid Leave */}
            <InteractiveCard
              interactiveColor="#8055f6"
              borderRadius="16px"
              glowIntensity={0.5}
              tailwindBgClass="bg-[rgba(30,27,38,0.6)] backdrop-blur-xl"
            >
              <div className="p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-50">
                  <Wallet className="w-9 h-9 text-[#8055f6]" />
                </div>
                <div className="relative z-10">
                  <p className="text-[#a49cba] text-sm font-medium uppercase tracking-wider mb-1">Unpaid Leave</p>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-3xl font-bold text-white">{leaveBalances.unpaid.used}</span>
                    <span className="text-lg text-[#a49cba]">days used</span>
                  </div>
                  <div className="w-full bg-[#2c2839] rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-[#8055f6] to-[#a78bfa] h-2 rounded-full shadow-[0_0_10px_rgba(128,85,246,0.4)]" 
                      style={{ width: `${Math.min(leaveBalances.unpaid.used * 10, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-[#a49cba] text-xs font-medium">Used this year</p>
                </div>
              </div>
            </InteractiveCard>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* New Request Form - Only for employees */}
          {!isAdmin && (
            <InteractiveCard
              interactiveColor="#8055f6"
              borderRadius="20px"
              glowIntensity={0.4}
              rotationFactor={0.15}
              tailwindBgClass="bg-[rgba(30,27,38,0.6)] backdrop-blur-xl"
              width="100%"
              className="lg:max-w-[600px]"
            >
              <div className="p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">New Request</h3>
                  <div className="h-8 w-8 rounded-full bg-[#8055f6]/20 flex items-center justify-center text-[#8055f6]">
                    <FileText className="w-4 h-4" />
                  </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
                {/* Employee Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#a49cba] text-xs font-bold uppercase tracking-wider">Employee</label>
                  <div className="bg-[rgba(20,20,25,0.6)] border border-white/[0.1] backdrop-blur h-12 rounded-xl flex items-center px-4 text-white opacity-80 cursor-not-allowed">
                    <User className="w-5 h-5 mr-3 text-[#a49cba]" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8055f6] to-[#3b82f6] font-semibold">
                      {empData?.firstName} {empData?.lastName}
                    </span>
                  </div>
                </div>

                {/* Leave Type & Duration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Leave Type */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#a49cba] text-xs font-bold uppercase tracking-wider">Type</label>
                    <div className="relative">
                      <select 
                        {...register('type')}
                        className="bg-[rgba(20,20,25,0.6)] border border-white/[0.1] w-full h-12 rounded-xl px-4 pl-10 text-white appearance-none focus:ring-0 focus:border-[#8055f6] focus:shadow-[0_0_0_1px_#8055f6] cursor-pointer transition-all"
                      >
                        <option className="bg-[#1e1b26] text-white" value={LeaveType.PAID}>Paid Leave</option>
                        <option className="bg-[#1e1b26] text-white" value={LeaveType.SICK}>Sick Leave</option>
                        <option className="bg-[#1e1b26] text-white" value={LeaveType.CASUAL}>Casual Leave</option>
                        <option className="bg-[#1e1b26] text-white" value={LeaveType.UNPAID}>Unpaid Leave</option>
                      </select>
                      <Umbrella className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a49cba] pointer-events-none" />
                      <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a49cba] pointer-events-none rotate-[-90deg]" />
                    </div>
                    {errors.type && <p className="text-red-400 text-xs">{errors.type.message}</p>}
                  </div>

                  {/* Duration Display */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#a49cba] text-xs font-bold uppercase tracking-wider">Duration</label>
                    <div className="bg-[rgba(20,20,25,0.6)] border border-white/[0.1] h-12 rounded-xl flex items-center justify-between px-4 text-white">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#8055f6]" />
                        <span className="font-medium">{durationInfo.days} Day{durationInfo.days !== 1 ? 's' : ''}</span>
                      </div>
                      {watchStartDate && watchEndDate && (
                        <span className="text-xs text-[#a49cba] bg-white/5 px-2 py-1 rounded">
                          {format(parseISO(watchStartDate), 'MMM d')} - {format(parseISO(watchEndDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date Range Picker */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#a49cba] text-xs font-bold uppercase tracking-wider">Select Dates</label>
                  <div className="bg-[rgba(20,20,25,0.6)] border border-white/[0.1] rounded-xl p-1 flex items-center relative focus-within:border-[#8055f6] focus-within:shadow-[0_0_0_1px_#8055f6] transition-all">
                    <input 
                      type="date"
                      {...register('startDate')}
                      className="bg-transparent border-none text-white text-sm focus:ring-0 w-full p-3 cursor-pointer placeholder-gray-500 [color-scheme:dark]"
                      placeholder="mm/dd/yyyy"
                    />
                    <span className="text-[#a49cba] px-2">
                      <ArrowRight className="w-4 h-4" />
                    </span>
                    <input 
                      type="date"
                      {...register('endDate')}
                      className="bg-transparent border-none text-white text-sm focus:ring-0 w-full p-3 cursor-pointer placeholder-gray-500 text-right [color-scheme:dark]"
                      placeholder="mm/dd/yyyy"
                    />
                    <div className="absolute right-3 pointer-events-none text-[#a49cba]">
                      <Calendar className="w-5 h-5" />
                    </div>
                  </div>
                  {(errors.startDate || errors.endDate) && (
                    <p className="text-red-400 text-xs">{errors.startDate?.message || errors.endDate?.message}</p>
                  )}
                  {durationInfo.weekendDays > 0 && (
                    <div className="flex gap-2 mt-1">
                      <div className="text-xs text-orange-400 flex items-center gap-1 bg-orange-400/10 px-2 py-1 rounded w-fit">
                        <AlertCircle className="w-3 h-3" />
                        Includes {durationInfo.weekendDays} Weekend Day{durationInfo.weekendDays > 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>

                {/* File Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#a49cba] text-xs font-bold uppercase tracking-wider">Attestation (Optional)</label>
                  <div className="border border-dashed border-[#413b54] bg-[#1e1b26]/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#1e1b26] hover:border-[#8055f6]/50 hover:shadow-[0_0_20px_rgba(128,85,246,0.3)] transition-all group">
                    <div className="h-10 w-10 bg-[#2c2839] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-[#a49cba] group-hover:text-white" />
                    </div>
                    <p className="text-sm font-medium text-white mb-1">Click to upload or drag & drop</p>
                    <p className="text-xs text-[#a49cba]">PDF, JPG or PNG (max. 5MB)</p>
                  </div>
                </div>

                {/* Reason */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[#a49cba] text-xs font-bold uppercase tracking-wider">Reason</label>
                    <button
                      type="button"
                      disabled={isGeneratingReason || !watchStartDate || !watchEndDate}
                      onClick={async () => {
                        if (!watchStartDate || !watchEndDate) {
                          toast.error('Please select dates first');
                          return;
                        }
                        setIsGeneratingReason(true);
                        try {
                          const leaveType = watch('type') || LeaveType.PAID;
                          const reason = await generateLeaveReason(leaveType, watchStartDate, watchEndDate);
                          setValue('reason', reason);
                          setReasonCharCount(reason.length);
                          toast.success('AI generated reason!');
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to generate reason');
                        } finally {
                          setIsGeneratingReason(false);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                        isGeneratingReason || !watchStartDate || !watchEndDate
                          ? "bg-white/5 text-[#5e596e] cursor-not-allowed"
                          : "bg-gradient-to-r from-[#8055f6]/20 to-[#3b82f6]/20 text-[#a78bfa] hover:from-[#8055f6]/30 hover:to-[#3b82f6]/30 hover:text-white border border-[#8055f6]/30 hover:border-[#8055f6]/50 hover:shadow-[0_0_15px_rgba(128,85,246,0.3)]"
                      )}
                    >
                      {isGeneratingReason ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <textarea 
                      {...register('reason')}
                      onChange={(e) => setReasonCharCount(e.target.value.length)}
                      maxLength={200}
                      className="bg-[rgba(20,20,25,0.6)] border border-white/[0.1] w-full rounded-xl p-4 text-white text-sm focus:ring-0 focus:border-[#8055f6] focus:shadow-[0_0_0_1px_#8055f6] resize-none h-32 placeholder-[#5e596e] transition-all"
                      placeholder="Please describe the reason for your leave request..."
                    ></textarea>
                    <div className="absolute bottom-3 right-3 text-[10px] text-[#a49cba]">{reasonCharCount}/200</div>
                  </div>
                  {errors.reason && <p className="text-red-400 text-xs">{errors.reason.message}</p>}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-2 pt-4 border-t border-white/[0.08]">
                  <button 
                    type="button"
                    onClick={() => { reset(); setReasonCharCount(0); }}
                    className="flex-1 py-3 px-6 rounded-xl text-[#a49cba] font-semibold hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#8055f6] to-[#6d44d6] text-white font-bold shadow-[0_0_20px_rgba(128,85,246,0.3)] hover:shadow-[0_0_30px_rgba(128,85,246,0.5)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Submit Request</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </InteractiveCard>
          )}

          {/* My Requests / Admin View */}
          <div className="flex-1 w-full flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{isAdmin ? 'All Requests' : 'My Requests'}</h3>
              <button className="text-xs text-[#8055f6] hover:text-white transition-colors">View All</button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 border-b border-white/[0.08] overflow-x-auto pb-1 scrollbar-hide">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setFilterStatus(tab); setCurrentPage(1); }}
                  className={`px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                    filterStatus === tab
                      ? 'text-white border-b-2 border-[#8055f6] font-medium'
                      : 'text-[#a49cba] hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All Requests' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Request List */}
            <div className="flex flex-col gap-3">
              {paginatedLeaves.length === 0 ? (
                <InteractiveCard interactiveColor="#8055f6" tailwindBgClass="bg-[rgba(30,27,38,0.6)]" className="p-12 text-center">
                  <AlertCircle className="w-10 h-10 text-[#a49cba] mx-auto mb-3 opacity-50" />
                  <p className="text-[#a49cba]">No leave requests found.</p>
                </InteractiveCard>
              ) : (
                paginatedLeaves.map((leave) => {
                  const emp = employees.find(e => e.id === leave.employeeId);
                  const days = differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
                  const statusColors = getStatusColor(leave.status);
                  const statusInteractiveColor = leave.status === LeaveStatus.APPROVED ? '#10b981' 
                    : leave.status === LeaveStatus.REJECTED ? '#ef4444' 
                    : '#f59e0b';

                  return (
                    <InteractiveCard 
                      key={leave.id}
                      interactiveColor={statusInteractiveColor}
                      tailwindBgClass="bg-[rgba(30,27,38,0.6)]"
                      rotationFactor={0.15}
                      className={`p-4 border-l-4 ${statusColors.border} cursor-pointer group ${
                        leave.status === LeaveStatus.REJECTED ? 'opacity-70 hover:opacity-100' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`${statusColors.bg} p-1.5 rounded-lg ${statusColors.text}`}>
                            {getStatusIcon(leave.status)}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{leave.type}</p>
                            <p className="text-[#a49cba] text-xs">
                              Submitted {format(new Date(leave.createdAt), 'MMM d')}
                            </p>
                          </div>
                        </div>
                        <span className={`${statusColors.badge} ${statusColors.text} text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide border shadow-sm`}>
                          {leave.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-white text-sm mb-1">
                            {format(new Date(leave.startDate), 'MMM d, yyyy')}
                            {leave.startDate !== leave.endDate && ` - ${format(new Date(leave.endDate), 'MMM d, yyyy')}`}
                          </p>
                          <p className="text-[#a49cba] text-xs truncate max-w-[200px]">{leave.reason}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{days} Day{days > 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {/* Admin Actions */}
                      {isAdmin && leave.status === LeaveStatus.PENDING && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                          <button
                            onClick={() => updateLeaveStatus(leave.id, LeaveStatus.APPROVED, "Approved by Admin")}
                            className="flex-1 py-2 px-4 rounded-lg bg-emerald-500/20 text-emerald-500 text-sm font-medium hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => updateLeaveStatus(leave.id, LeaveStatus.REJECTED, "Rejected by Admin")}
                            className="flex-1 py-2 px-4 rounded-lg bg-red-500/20 text-red-500 text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </button>
                        </div>
                      )}

                      {/* Employee Cancel Action */}
                      {!isAdmin && leave.status === LeaveStatus.PENDING && (
                        <div className="h-0 overflow-hidden group-hover:h-auto group-hover:mt-3 transition-all">
                          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                            <span className="text-xs text-[#a49cba]">
                              {emp?.firstName} {emp?.lastName}
                            </span>
                            <button 
                              onClick={() => handleCancelLeave(leave.id)}
                              className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> Cancel Request
                            </button>
                          </div>
                        </div>
                      )}
                    </InteractiveCard>
                  );
                })
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 w-8 rounded-lg bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors ${
                      currentPage === page
                        ? 'bg-[#8055f6] text-white shadow-[0_0_20px_rgba(128,85,246,0.3)]'
                        : 'bg-white/5 text-[#a49cba] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 rounded-lg bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};