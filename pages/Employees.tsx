import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { InteractiveCard } from '../components/InteractiveCard';
import { Input, Button, Modal, Select, Badge, Avatar, cn, useRoleTheme } from '../components/UI';
import { 
  Search, Edit2, Save, X, Briefcase, DollarSign, Users, UserCheck, 
  Clock, CreditCard, TrendingUp, MoreVertical, ChevronLeft, ChevronRight,
  Plus, ArrowRight, Filter, Sparkles, Loader2, Bot, RefreshCw, Plane,
  Mail, Phone, MapPin, Calendar, User, Copy, Check, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DEPARTMENTS } from '../data';
import { Role, Employee, LeaveStatus, LeaveType } from '../types';
import { toast } from 'react-hot-toast';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { generatePerformanceSummary } from '../lib/gemini';

type EmployeeStatus = 'all' | 'present' | 'on-leave' | 'absent';

export const Employees = () => {
  const { employees, currentUser, updateEmployee, leaves, attendance, addEmployee } = useStore();
  const theme = useRoleTheme();
  const navigate = useNavigate();
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
  
  // Add Employee Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmpForm, setNewEmpForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    dob: '1990-01-01',
    gender: 'Male',
    address: '',
    basicSalary: 30000,
    hra: 10000,
    allowances: 5000,
    deductions: 2000
  });
  const [generatedCredentials, setGeneratedCredentials] = useState<{ loginId: string; password: string } | null>(null);
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);

  if (currentUser?.role !== Role.ADMIN) return <div className="text-white">Access Denied</div>;

  // Calculate stats
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const presentToday = useMemo(() => {
    return attendance.filter(a => a.date === todayStr && a.checkIn).length;
  }, [attendance, todayStr]);

  const pendingApprovals = useMemo(() => {
    return leaves.filter(l => l.status === LeaveStatus.PENDING).length;
  }, [leaves]);

  // Get employee status - Updated to match wireframe:
  // Green dot = present (in office), Airplane = on leave, Yellow/Amber dot = absent
  const getEmployeeStatus = (empId: string): { status: string; color: string; bgColor: string; borderColor: string; isOnLeave: boolean } => {
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
    if (onLeave) return { status: 'On Leave', color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', isOnLeave: true };

    // Check if checked in today (present in office - green dot)
    const checkedIn = attendance.some(a => a.employeeId === empId && a.date === todayStr && a.checkIn);
    if (checkedIn) return { status: 'Present', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', isOnLeave: false };

    // Employee has not applied time off and is absent (yellow dot)
    return { status: 'Absent', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', isOnLeave: false };
  };

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]';
      case 'On Leave': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]';
      case 'Absent': return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]';
      default: return 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]';
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

  // Generate random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Generate Login ID
  const generateLoginId = (firstName: string, companyCode: string = 'DFL') => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${companyCode}${year}${random}`;
  };

  // Handle Add Employee
  const handleAddEmployee = async () => {
    if (!newEmpForm.firstName || !newEmpForm.lastName || !newEmpForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Check if email already exists
    if (employees.some(e => e.email === newEmpForm.email)) {
      toast.error('An employee with this email already exists');
      return;
    }

    setIsCreatingEmployee(true);

    try {
      const loginId = generateLoginId(newEmpForm.firstName);
      const tempPassword = generatePassword();
      const newId = `EMP${Date.now().toString().slice(-6)}`;
      
      const netSalary = newEmpForm.basicSalary + newEmpForm.hra + newEmpForm.allowances - newEmpForm.deductions;

      const newEmployee: Employee = {
        id: newId,
        email: newEmpForm.email,
        password: tempPassword,
        role: Role.EMPLOYEE,
        firstName: newEmpForm.firstName,
        lastName: newEmpForm.lastName,
        phone: newEmpForm.phone,
        address: newEmpForm.address,
        department: newEmpForm.department,
        designation: newEmpForm.designation,
        joinDate: new Date().toISOString().split('T')[0],
        gender: newEmpForm.gender,
        dob: newEmpForm.dob,
        avatarUrl: `https://ui-avatars.com/api/?name=${newEmpForm.firstName}+${newEmpForm.lastName}&background=random`,
        leaveBalance: {
          [LeaveType.PAID]: 15,
          [LeaveType.SICK]: 10,
          [LeaveType.CASUAL]: 7,
          [LeaveType.UNPAID]: 0
        },
        salary: {
          basic: newEmpForm.basicSalary,
          hra: newEmpForm.hra,
          allowances: newEmpForm.allowances,
          deductions: newEmpForm.deductions,
          netSalary
        },
        documents: []
      };

      addEmployee(newEmployee);
      setGeneratedCredentials({ loginId, password: tempPassword });
      toast.success('Employee created successfully!');
    } catch (error) {
      toast.error('Failed to create employee');
      console.error(error);
    } finally {
      setIsCreatingEmployee(false);
    }
  };

  const resetAddForm = () => {
    setNewEmpForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: 'Engineering',
      designation: '',
      dob: '1990-01-01',
      gender: 'Male',
      address: '',
      basicSalary: 30000,
      hra: 10000,
      allowances: 5000,
      deductions: 2000
    });
    setGeneratedCredentials(null);
    setShowAddModal(false);
  };

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success(`${field} copied to clipboard!`);
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
            {/* Left Section - NEW Button and Search */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* NEW Button */}
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold px-4 py-2.5 rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                NEW
              </button>
              
              {/* Search */}
              <div className="relative flex-1 md:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="block w-full rounded-lg border border-slate-600 bg-slate-900 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 focus:border-blue-500/70 focus:ring-1 focus:ring-blue-500/70 focus:shadow-[0_0_10px_rgba(59,130,246,0.3),0_0_20px_rgba(59,130,246,0.1)] transition-all outline-none"
                  placeholder="Search..."
                />
              </div>
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
                  <option value="present">Present</option>
                  <option value="on-leave">On Leave</option>
                  <option value="absent">Absent</option>
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
                
                {/* Status Indicator at Top Right */}
                <div className="absolute top-3 right-3">
                  {empStatus.isOnLeave ? (
                    <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Plane className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                  ) : (
                    <span className={`h-3 w-3 rounded-full ${getStatusDotColor(empStatus.status)}`}></span>
                  )}
                </div>
                
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
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-400 transition-all duration-300">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <p className="text-sm text-slate-400">{emp.designation}</p>
                    </div>
                  </div>
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
                    {empStatus.isOnLeave ? (
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
                    VIEW
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
      <button 
        className="fixed bottom-8 right-8 z-40 group"
        onClick={() => setShowAddModal(true)}
      >
        <div className="absolute inset-0 rounded-full bg-[#8055f6]/30 blur-xl opacity-50 group-hover:opacity-100 transition-opacity animate-pulse"></div>
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#8055f6] to-[#06b6d4] text-white shadow-xl shadow-[#8055f6]/30 transition-transform group-hover:scale-110 hover:shadow-[0_0_15px_rgba(128,85,246,0.5),0_0_30px_rgba(128,85,246,0.2)]">
          <Plus className="w-7 h-7" />
        </div>
      </button>

      {/* Employee Detail Modal */}
      <Modal 
        isOpen={!!selectedEmp} 
        onClose={() => { setSelectedEmp(null); setIsEditing(false); setAiSummary(''); }} 
        title={isEditing ? "Edit Employee Details" : "Employee Details"}
        size="lg"
      >
        {selectedEmp && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
            {/* Header with Employee Info and Actions */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#2c2839]">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
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
                  <p className="text-[#a49cba] text-sm">{selectedEmp.email}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="border-[#8055f6]/50 text-[#a49cba]">{selectedEmp.role}</Badge>
                    <Badge className="bg-[#8055f6]/20 text-[#8055f6]">{selectedEmp.id}</Badge>
                  </div>
                </div>
              </div>
              {/* Quick Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setSelectedEmp(null);
                    navigate('/chat', { state: { selectedEmployee: selectedEmp } });
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                  title="Message Employee"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
                <button
                  onClick={() => { setSelectedEmp(null); setIsEditing(false); setAiSummary(''); }}
                  className="p-2 rounded-lg bg-[#2c2839] hover:bg-[#3d3559] text-slate-400 hover:text-white transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
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

                <div className="flex gap-3 pt-4 border-t border-[#2c2839]">
                  <Button className="flex-1 bg-[#8055f6] hover:bg-[#6d44d6]" onClick={handleEditClick}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setSelectedEmp(null);
                      navigate('/chat', { state: { selectedEmployee: selectedEmp } });
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Message
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Add Employee Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={resetAddForm} 
        title={generatedCredentials ? "Employee Created Successfully!" : "Add New Employee"}
      >
        {generatedCredentials ? (
          // Show generated credentials
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-900/10 p-6 rounded-xl border border-emerald-500/30 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Employee Added!</h3>
              <p className="text-slate-400 text-sm">Share these credentials with the new employee</p>
            </div>

            <div className="space-y-4">
              <div className="bg-[#1e1b27] p-4 rounded-lg border border-[#2c2839]">
                <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Login ID</label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg text-white">{generatedCredentials.loginId}</span>
                  <button
                    onClick={() => copyToClipboard(generatedCredentials.loginId, 'Login ID')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {copiedField === 'Login ID' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-[#1e1b27] p-4 rounded-lg border border-[#2c2839]">
                <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Email</label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg text-white">{newEmpForm.email}</span>
                  <button
                    onClick={() => copyToClipboard(newEmpForm.email, 'Email')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {copiedField === 'Email' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-[#1e1b27] p-4 rounded-lg border border-[#2c2839]">
                <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Temporary Password</label>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg text-white">{generatedCredentials.password}</span>
                  <button
                    onClick={() => copyToClipboard(generatedCredentials.password, 'Password')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {copiedField === 'Password' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-300 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Employee will be prompted to change password on first login
              </p>
            </div>

            <Button className="w-full bg-[#8055f6] hover:bg-[#6d44d6]" onClick={resetAddForm}>
              Done
            </Button>
          </div>
        ) : (
          // Add Employee Form
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#a49cba] uppercase flex items-center gap-1">
                  <User className="w-3 h-3" /> First Name *
                </label>
                <Input 
                  className="bg-[#1e1b27] border-[#2c2839] text-white"
                  placeholder="John"
                  value={newEmpForm.firstName}
                  onChange={(e) => setNewEmpForm({...newEmpForm, firstName: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#a49cba] uppercase">Last Name *</label>
                <Input 
                  className="bg-[#1e1b27] border-[#2c2839] text-white"
                  placeholder="Doe"
                  value={newEmpForm.lastName}
                  onChange={(e) => setNewEmpForm({...newEmpForm, lastName: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#a49cba] uppercase flex items-center gap-1">
                <Mail className="w-3 h-3" /> Work Email *
              </label>
              <Input 
                className="bg-[#1e1b27] border-[#2c2839] text-white"
                type="email"
                placeholder="john.doe@company.com"
                value={newEmpForm.email}
                onChange={(e) => setNewEmpForm({...newEmpForm, email: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#a49cba] uppercase flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </label>
                <Input 
                  className="bg-[#1e1b27] border-[#2c2839] text-white"
                  placeholder="+91 9876543210"
                  value={newEmpForm.phone}
                  onChange={(e) => setNewEmpForm({...newEmpForm, phone: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#a49cba] uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Date of Birth
                </label>
                <Input 
                  className="bg-[#1e1b27] border-[#2c2839] text-white"
                  type="date"
                  value={newEmpForm.dob}
                  onChange={(e) => setNewEmpForm({...newEmpForm, dob: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#a49cba] uppercase">Department</label>
                <Select 
                  options={DEPARTMENTS.map(d => ({ label: d, value: d }))}
                  value={newEmpForm.department}
                  onChange={(e) => setNewEmpForm({...newEmpForm, department: e.target.value})}
                  className="bg-[#1e1b27] border-[#2c2839] text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#a49cba] uppercase">Designation</label>
                <Input 
                  className="bg-[#1e1b27] border-[#2c2839] text-white"
                  placeholder="Software Engineer"
                  value={newEmpForm.designation}
                  onChange={(e) => setNewEmpForm({...newEmpForm, designation: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#a49cba] uppercase">Gender</label>
              <Select 
                options={[
                  { label: 'Male', value: 'Male' },
                  { label: 'Female', value: 'Female' },
                  { label: 'Other', value: 'Other' }
                ]}
                value={newEmpForm.gender}
                onChange={(e) => setNewEmpForm({...newEmpForm, gender: e.target.value})}
                className="bg-[#1e1b27] border-[#2c2839] text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#a49cba] uppercase flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Address
              </label>
              <Input 
                className="bg-[#1e1b27] border-[#2c2839] text-white"
                placeholder="123 Main St, City, Country"
                value={newEmpForm.address}
                onChange={(e) => setNewEmpForm({...newEmpForm, address: e.target.value})} 
              />
            </div>

            {/* Salary Configuration */}
            <div className="bg-[#2c2839]/50 p-4 rounded-lg border border-[#2c2839]">
              <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Salary Configuration
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#a49cba]">Basic Salary</label>
                  <Input 
                    className="bg-[#1e1b27] border-[#2c2839] text-white" 
                    type="number" 
                    value={newEmpForm.basicSalary} 
                    onChange={(e) => setNewEmpForm({...newEmpForm, basicSalary: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a49cba]">HRA</label>
                  <Input 
                    className="bg-[#1e1b27] border-[#2c2839] text-white" 
                    type="number" 
                    value={newEmpForm.hra} 
                    onChange={(e) => setNewEmpForm({...newEmpForm, hra: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a49cba]">Allowances</label>
                  <Input 
                    className="bg-[#1e1b27] border-[#2c2839] text-white" 
                    type="number" 
                    value={newEmpForm.allowances} 
                    onChange={(e) => setNewEmpForm({...newEmpForm, allowances: Number(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="text-xs text-[#a49cba]">Deductions</label>
                  <Input 
                    className="bg-[#1e1b27] border-[#2c2839] text-white" 
                    type="number" 
                    value={newEmpForm.deductions} 
                    onChange={(e) => setNewEmpForm({...newEmpForm, deductions: Number(e.target.value)})} 
                  />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#2c2839] flex justify-between text-sm">
                <span className="text-[#a49cba]">Net Salary</span>
                <span className="font-bold text-emerald-400">
                  ₹{(newEmpForm.basicSalary + newEmpForm.hra + newEmpForm.allowances - newEmpForm.deductions).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                className="flex-1 bg-[#8055f6] hover:bg-[#6d44d6]" 
                onClick={handleAddEmployee}
                disabled={isCreatingEmployee}
              >
                {isCreatingEmployee ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" /> Create Employee
                  </>
                )}
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 bg-[#2c2839] text-white hover:bg-[#3d3559]" 
                onClick={resetAddForm}
              >
                Cancel
              </Button>
            </div>
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
