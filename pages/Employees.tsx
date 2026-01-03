import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { InteractiveCard } from '../components/InteractiveCard';
import { Input, Button, Modal, Select, Badge, Avatar, cn, useRoleTheme } from '../components/UI';
import { 
  Search, Edit2, Save, X, Briefcase, DollarSign, Users, UserCheck, 
  Clock, CreditCard, TrendingUp, MoreVertical, ChevronLeft, ChevronRight,
  Plus, ArrowRight, Filter, Sparkles, Loader2, Bot, RefreshCw, Plane
} from 'lucide-react';
import { DEPARTMENTS } from '../data';
import { Role, Employee, LeaveStatus, LeaveType } from '../types';
import { toast } from 'react-hot-toast';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { generatePerformanceSummary } from '../lib/gemini';

type EmployeeStatus = 'all' | 'active' | 'on-leave' | 'remote' | 'offline';

export const Employees = () => {
  const { employees, currentUser, updateEmployee, leaves, attendance } = useStore();
  const theme = useRoleTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus>('all');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Employee | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  if (currentUser?.role !== Role.ADMIN) return <div className="text-white">Access Denied</div>;

  // Calculate stats
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const presentToday = useMemo(() => {
    return attendance.filter(a => a.date === todayStr && a.checkIn).length;
  }, [attendance, todayStr]);

  const pendingApprovals = useMemo(() => {
    return leaves.filter(l => l.status === LeaveStatus.PENDING).length;
  }, [leaves]);

  // Get employee status
  const getEmployeeStatus = (empId: string): { status: string; color: string; bgColor: string; borderColor: string } => {
    // Check if on leave today
    const onLeave = leaves.some(l => {
      if (l.employeeId !== empId || l.status !== LeaveStatus.APPROVED) return false;
      try {
        const start = parseISO(l.startDate);
        const end = parseISO(l.endDate);
        const today = new Date();
        return isWithinInterval(today, { start, end }) || format(today, 'yyyy-MM-dd') === l.startDate || format(today, 'yyyy-MM-dd') === l.endDate;
      } catch {
        return false;
      }
    });
    if (onLeave) return { status: 'On Leave', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20' };

    // Check if checked in today (active)
    const checkedIn = attendance.some(a => a.employeeId === empId && a.date === todayStr && a.checkIn);
    if (checkedIn) return { status: 'Active', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' };

    // Simulate remote/offline based on employee index
    const empIndex = employees.findIndex(e => e.id === empId);
    if (empIndex % 7 === 3) return { status: 'Remote', color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20' };
    
    return { status: 'Offline', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' };
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
      case 'On Leave': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]';
      case 'Remote': return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]';
      default: return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';
    }
  };

  const filtered = useMemo(() => {
    return employees.filter(e => {
      const matchesSearch = (e.firstName + ' ' + e.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || 
                            e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            e.designation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = deptFilter === 'ALL' || e.department === deptFilter;
      
      if (statusFilter === 'all') return matchesSearch && matchesDept;
      
      const empStatus = getEmployeeStatus(e.id).status.toLowerCase().replace(' ', '-');
      return matchesSearch && matchesDept && empStatus === statusFilter;
    });
  }, [employees, searchTerm, deptFilter, statusFilter, leaves, attendance, todayStr]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedEmployees = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleEditClick = () => {
    setEditForm(JSON.parse(JSON.stringify(selectedEmp)));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSaveEdit = () => {
    if (editForm && selectedEmp) {
      const netSalary = (Number(editForm.salary.basic) + Number(editForm.salary.hra) + Number(editForm.salary.allowances)) - Number(editForm.salary.deductions);
      const updatedEmp = {
        ...editForm,
        salary: {
          ...editForm.salary,
          netSalary
        }
      };

      updateEmployee(selectedEmp.id, updatedEmp);
      setSelectedEmp(updatedEmp);
      setIsEditing(false);
      toast.success('Employee details updated successfully');
    }
  };

  const presentPercentage = employees.length > 0 ? Math.round((presentToday / employees.length) * 100) : 0;

  return (
    <div className="relative min-h-screen">
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[#0f0f12]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(128,85,246,0.15)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      <main className="px-4 py-8 md:px-8 max-w-[1400px] mx-auto w-full">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {/* Total Employees */}
          <InteractiveCard interactiveColor={theme.primary} tailwindBgClass="bg-slate-800/40" className="p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-16 h-16 text-white" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}>
                <Users className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-sm font-medium">Total Employees</p>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-white">{employees.length}</h3>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +2.5%
              </span>
            </div>
          </InteractiveCard>

          {/* Present Today */}
          <InteractiveCard interactiveColor="#10b981" tailwindBgClass="bg-slate-800/40" className="p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserCheck className="w-16 h-16 text-emerald-500" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-sm font-medium">Present Today</p>
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold text-white">{presentToday}</h3>
              <p className="text-emerald-400 text-sm font-medium">({presentPercentage}%)</p>
            </div>
            <div className="w-full bg-white/5 rounded-full h-1 mt-3">
              <div className="bg-emerald-500 h-1 rounded-full transition-all duration-500" style={{ width: `${presentPercentage}%` }}></div>
            </div>
          </InteractiveCard>

          {/* Pending Approvals */}
          <InteractiveCard interactiveColor="#f97316" tailwindBgClass="bg-slate-800/40" className="p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <Clock className="w-16 h-16 text-orange-500" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-sm font-medium">Pending Approvals</p>
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-bold text-white">{pendingApprovals}</h3>
              {pendingApprovals > 0 && (
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Requires immediate attention</p>
          </InteractiveCard>

          {/* Payroll Status */}
          <InteractiveCard interactiveColor="#3b82f6" tailwindBgClass="bg-slate-800/40" className="p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <CreditCard className="w-16 h-16 text-blue-500" />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-sm font-medium">Payroll Status</p>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold text-white">Processing</h3>
              <p className="text-xs text-slate-500">Cycle: Nov 1 - Nov 15</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-blue-400">Syncing data...</span>
            </div>
          </InteractiveCard>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 mb-6 sticky top-20 z-30">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-md group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input 
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="block w-full rounded-lg border border-slate-600 bg-slate-900 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/70 focus:shadow-[0_0_10px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.1)] transition-all outline-none"
                placeholder="Search employees by name, ID, or role..."
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
              <div className="relative">
                <select 
                  value={deptFilter}
                  onChange={e => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                  className="appearance-none bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500/50 focus:border-blue-500/50 block w-full p-2.5 pr-8 cursor-pointer hover:border-slate-500 transition-colors outline-none"
                >
                  <option value="ALL">All Departments</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <ChevronLeft className="w-4 h-4 rotate-[-90deg]" />
                </div>
              </div>
              
              <div className="relative">
                <select 
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value as EmployeeStatus); setCurrentPage(1); }}
                  className="appearance-none bg-slate-900 border border-slate-600 text-white text-sm rounded-lg focus:ring-blue-500/50 focus:border-blue-500/50 block w-full p-2.5 pr-8 cursor-pointer hover:border-slate-500 transition-colors outline-none"
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="on-leave">On Leave</option>
                  <option value="remote">Remote</option>
                  <option value="offline">Offline</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <ChevronLeft className="w-4 h-4 rotate-[-90deg]" />
                </div>
              </div>

              <button className="flex items-center gap-2 bg-slate-900 border border-slate-600 text-white text-sm rounded-lg p-2.5 hover:border-blue-500/50 hover:text-blue-400 transition-colors">
                <Filter className="w-4 h-4" />
                <span>Sort</span>
              </button>
            </div>
          </div>
        </div>

        {/* Employee Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {paginatedEmployees.map(emp => {
            const empStatus = getEmployeeStatus(emp.id);
            const statusColor = empStatus.status === 'Active' ? '#10b981' 
              : empStatus.status === 'On Leave' ? '#f59e0b'
              : empStatus.status === 'Remote' ? '#a855f7'
              : '#ef4444';
            
            return (
              <InteractiveCard 
                key={emp.id}
                interactiveColor={statusColor}
                tailwindBgClass="bg-slate-800/40"
                className="p-5 group flex flex-col gap-4 relative overflow-hidden cursor-pointer"
                onClick={() => { setSelectedEmp(emp); setIsEditing(false); }}
              >
                {/* Top Gradient Line on Hover */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="relative">
                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-gray-800">
                        {emp.avatarUrl ? (
                          <img 
                            src={emp.avatarUrl} 
                            alt={`${emp.firstName} ${emp.lastName}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg transition-transform group-hover:scale-110">
                            {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-slate-900 flex items-center justify-center">
                        {empStatus.status === 'On Leave' ? (
                          <Plane className="w-2.5 h-2.5 text-amber-400" />
                        ) : (
                          <span className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(empStatus.status)}`}></span>
                        )}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-400 transition-all duration-300">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <p className="text-sm text-slate-400">{emp.designation}</p>
                    </div>
                  </div>
                  <button 
                    className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div className="flex flex-col gap-1 p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Department</span>
                    <span className="font-medium text-white">{emp.department}</span>
                  </div>
                  <div className="flex flex-col gap-1 p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">ID</span>
                    <span className="font-mono text-xs text-white">#{emp.id}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 mt-auto">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${empStatus.bgColor} ${empStatus.color} border ${empStatus.borderColor}`}>
                    {empStatus.status === 'On Leave' ? (
                      <Plane className="w-3 h-3" />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${empStatus.color.replace('text-', 'bg-')}`}></span>
                    )}
                    {empStatus.status}
                  </span>
                  <button 
                    className="flex items-center gap-1 text-xs font-bold text-blue-400 hover:text-white transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEmp(emp);
                      setIsEditing(false);
                    }}
                  >
                    VIEW PROFILE
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </InteractiveCard>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2 p-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/30'
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              {totalPages > 4 && (
                <span className="flex h-9 w-9 items-center justify-center text-slate-400 text-sm">...</span>
              )}
              
              {totalPages > 3 && (
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    currentPage === totalPages
                      ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/30'
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  {totalPages}
                </button>
              )}
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {paginatedEmployees.length === 0 && (
          <InteractiveCard interactiveColor={theme.primary} tailwindBgClass="bg-slate-800/40" className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-5">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-white text-lg font-medium mb-1">No employees found</p>
            <p className="text-slate-400 text-sm">Try adjusting your search or filter criteria.</p>
            {(searchTerm || deptFilter !== 'ALL' || statusFilter !== 'all') && (
              <button 
                onClick={() => { setSearchTerm(''); setDeptFilter('ALL'); setStatusFilter('all'); }}
                className="mt-4 px-4 py-2 text-sm text-[#8055f6] hover:text-white border border-[#8055f6]/30 hover:border-[#8055f6] rounded-xl transition-all"
              >
                Clear Filters
              </button>
            )}
          </InteractiveCard>
        )}
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 z-40 group">
        <div className="absolute inset-0 rounded-full bg-[#8055f6]/30 blur-xl opacity-50 group-hover:opacity-100 transition-opacity animate-pulse"></div>
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#8055f6] to-[#06b6d4] text-white shadow-xl shadow-[#8055f6]/30 transition-transform group-hover:scale-110 hover:shadow-[0_0_15px_rgba(128,85,246,0.5),0_0_30px_rgba(128,85,246,0.2)]">
          <Plus className="w-7 h-7" />
        </div>
      </button>

      {/* Employee Detail Modal */}
      <Modal 
        isOpen={!!selectedEmp} 
        onClose={() => setSelectedEmp(null)} 
        title={isEditing ? "Edit Employee Details" : "Employee Details"}
      >
        {selectedEmp && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-800">
                {selectedEmp.avatarUrl ? (
                  <img 
                    src={selectedEmp.avatarUrl} 
                    alt={`${selectedEmp.firstName} ${selectedEmp.lastName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#8055f6] to-[#06b6d4] flex items-center justify-center text-white font-bold text-xl">
                    {selectedEmp.firstName.charAt(0)}{selectedEmp.lastName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedEmp.firstName} {selectedEmp.lastName}</h2>
                <p className="text-[#a49cba]">{selectedEmp.email}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="border-[#8055f6]/50 text-[#a49cba]">{selectedEmp.role}</Badge>
                  <Badge className="bg-[#8055f6]/20 text-[#8055f6]">{selectedEmp.id}</Badge>
                </div>
              </div>
            </div>
             
            {/* EDIT FORM */}
            {isEditing && editForm ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#a49cba] uppercase">First Name</label>
                    <Input 
                      className="bg-[#1e1b27] border-[#2c2839] text-white"
                      value={editForm.firstName} 
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#a49cba] uppercase">Last Name</label>
                    <Input 
                      className="bg-[#1e1b27] border-[#2c2839] text-white"
                      value={editForm.lastName} 
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})} 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#a49cba] uppercase">Department</label>
                    <Select 
                      options={DEPARTMENTS.map(d => ({ label: d, value: d }))}
                      value={editForm.department}
                      onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                      className="bg-[#1e1b27] border-[#2c2839] text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#a49cba] uppercase">Designation</label>
                    <Input 
                      className="bg-[#1e1b27] border-[#2c2839] text-white"
                      value={editForm.designation} 
                      onChange={(e) => setEditForm({...editForm, designation: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="bg-[#2c2839]/50 p-4 rounded-lg border border-[#2c2839]">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> Salary Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#a49cba]">Basic</label>
                      <Input className="bg-[#1e1b27] border-[#2c2839] text-white" type="number" value={editForm.salary.basic} onChange={(e) => setEditForm({...editForm, salary: {...editForm.salary, basic: Number(e.target.value)}})} />
                    </div>
                    <div>
                      <label className="text-xs text-[#a49cba]">HRA</label>
                      <Input className="bg-[#1e1b27] border-[#2c2839] text-white" type="number" value={editForm.salary.hra} onChange={(e) => setEditForm({...editForm, salary: {...editForm.salary, hra: Number(e.target.value)}})} />
                    </div>
                    <div>
                      <label className="text-xs text-[#a49cba]">Allowances</label>
                      <Input className="bg-[#1e1b27] border-[#2c2839] text-white" type="number" value={editForm.salary.allowances} onChange={(e) => setEditForm({...editForm, salary: {...editForm.salary, allowances: Number(e.target.value)}})} />
                    </div>
                    <div>
                      <label className="text-xs text-[#a49cba]">Deductions</label>
                      <Input className="bg-[#1e1b27] border-[#2c2839] text-white" type="number" value={editForm.salary.deductions} onChange={(e) => setEditForm({...editForm, salary: {...editForm.salary, deductions: Number(e.target.value)}})} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveEdit}>
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </Button>
                  <Button variant="secondary" className="flex-1 bg-[#2c2839] text-white hover:bg-[#3d3559]" onClick={handleCancelEdit}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* VIEW MODE */
              <>
                {/* AI Performance Summary */}
                <div className="bg-gradient-to-br from-violet-900/30 to-purple-900/20 p-4 rounded-xl border border-violet-500/20 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">AI Performance Summary</h4>
                        <p className="text-[10px] text-violet-400 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Powered by Gemini AI
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setIsLoadingAI(true);
                        try {
                          // Calculate attendance rate and leave usage
                          const empAttendance = attendance.filter(a => a.employeeId === selectedEmp?.id);
                          const attendanceRate = empAttendance.length > 0 
                            ? Math.round((empAttendance.filter(a => a.status === 'PRESENT').length / empAttendance.length) * 100)
                            : 85;
                          const empLeaves = leaves.filter(l => l.employeeId === selectedEmp?.id && l.status === LeaveStatus.APPROVED);
                          const leaveDaysUsed = empLeaves.length;
                          const leaveBalanceValues = selectedEmp?.leaveBalance 
                            ? Object.values(selectedEmp.leaveBalance) as number[]
                            : [0];
                          const totalLeaveBalance = leaveBalanceValues.reduce((a, b) => a + b, 0);
                          
                          const summary = await generatePerformanceSummary({
                            name: `${selectedEmp?.firstName} ${selectedEmp?.lastName}`,
                            department: selectedEmp?.department || '',
                            designation: selectedEmp?.designation || '',
                            joinDate: selectedEmp?.joinDate || '',
                            attendanceRate,
                            leaveDaysUsed,
                            totalLeaveBalance
                          });
                          setAiSummary(summary);
                        } catch (error) {
                          toast.error('Failed to generate summary');
                        } finally {
                          setIsLoadingAI(false);
                        }
                      }}
                      disabled={isLoadingAI}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                        isLoadingAI 
                          ? "bg-white/5 text-slate-500 cursor-not-allowed"
                          : "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300 border border-violet-500/20"
                      )}
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", isLoadingAI && "animate-spin")} />
                      {isLoadingAI ? 'Analyzing...' : aiSummary ? 'Refresh' : 'Generate'}
                    </button>
                  </div>
                  
                  {isLoadingAI ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 bg-violet-500/20 rounded w-full"></div>
                      <div className="h-3 bg-violet-500/20 rounded w-4/5"></div>
                      <div className="h-3 bg-violet-500/20 rounded w-3/5"></div>
                    </div>
                  ) : aiSummary ? (
                    <p className="text-sm text-slate-300 leading-relaxed">{aiSummary}</p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Click "Generate" to get an AI-powered performance summary for this employee.</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#a49cba] uppercase font-semibold">Department</label>
                    <p className="font-medium text-white flex items-center gap-2">
                      <Briefcase className="w-3 h-3 text-[#a49cba]" /> {selectedEmp.department}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-[#a49cba] uppercase font-semibold">Designation</label>
                    <p className="font-medium text-white">{selectedEmp.designation}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#a49cba] uppercase font-semibold">Phone</label>
                    <p className="font-medium text-white">{selectedEmp.phone || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-xs text-[#a49cba] uppercase font-semibold">DOB</label>
                    <p className="font-medium text-white">{selectedEmp.dob}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-[#a49cba] uppercase font-semibold">Address</label>
                    <p className="font-medium text-white">{selectedEmp.address || "N/A"}</p>
                  </div>
                </div>

                <div className="bg-[#2c2839]/50 p-4 rounded-lg border border-[#2c2839]">
                  <h4 className="font-semibold mb-3 text-sm uppercase text-[#a49cba] flex justify-between items-center">
                    <span>Salary Structure</span>
                    <Badge variant="success" className="bg-emerald-900/50 text-emerald-300 border-emerald-700/50">Active</Badge>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-[#a49cba]">Basic</span> <span className="font-mono text-white">₹{selectedEmp.salary.basic}</span></div>
                    <div className="flex justify-between"><span className="text-[#a49cba]">HRA</span> <span className="font-mono text-white">₹{selectedEmp.salary.hra}</span></div>
                    <div className="flex justify-between"><span className="text-[#a49cba]">Allowances</span> <span className="font-mono text-white">₹{selectedEmp.salary.allowances}</span></div>
                    <div className="flex justify-between text-red-400"><span>Deductions</span> <span className="font-mono">-₹{selectedEmp.salary.deductions}</span></div>
                    <div className="border-t border-[#2c2839] pt-2 flex justify-between font-bold text-base mt-2 text-[#8055f6]">
                      <span>Net Salary</span> 
                      <span>₹{selectedEmp.salary.netSalary.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-[#8055f6] hover:bg-[#6d44d6]" onClick={handleEditClick}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit Employee Details
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Custom Styles */}
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #131118;
        }
        ::-webkit-scrollbar-thumb {
          background: #413b54;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #8055f6;
        }
      `}</style>
    </div>
  );
};
