import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Role } from '../types';
import { InteractiveCard } from '../components/InteractiveCard';
import { cn, useRoleTheme, Input } from '../components/UI';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  User, Mail, Phone, MapPin, Briefcase, Calendar, Edit2, BadgeCheck, 
  FileText, Lock, Wallet, Shield, Heart, Gamepad2, Zap, Award, 
  Plus, Eye, EyeOff, Building2, CreditCard, Star, Laptop, Smartphone,
  Monitor, Check, X, Trash2, Clock, IndianRupee, Users
} from 'lucide-react';
import { format } from 'date-fns';

type TabType = 'resume' | 'private' | 'salary' | 'security';

// Salary calculation constants based on wireframe
const SALARY_CONFIG = {
  basicPercentage: 50, // 50% of wage
  hraPercentage: 50, // 50% of Basic
  standardAllowancePercentage: 16.67,
  performanceBonusPercentage: 8.33,
  ltaPercentage: 8.333,
  pfRate: 12, // 12% for both employee and employer
  professionalTax: 200,
};

interface Skill {
  name: string;
  featured: boolean;
}

interface Certification {
  name: string;
  issuer: string;
  date: string;
  expires: string | null;
}

export const Profile = () => {
  const { currentUser, employees, updateEmployee } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('resume');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  
  // Wage state for admin editing
  const [monthlyWage, setMonthlyWage] = useState(50000);
  const [workingDaysPerWeek, setWorkingDaysPerWeek] = useState(5);
  const [breakTimeHours, setBreakTimeHours] = useState(1);
  
  // Check if current user is admin
  const isAdmin = currentUser?.role === Role.ADMIN;
  
  // Skills State
  const [skills, setSkills] = useState<Skill[]>([
    { name: 'React', featured: true },
    { name: 'TypeScript', featured: true },
    { name: 'Node.js', featured: true },
    { name: 'System Design', featured: true },
    { name: 'Agile', featured: true },
    { name: 'Team Leadership', featured: false },
    { name: 'Problem Solving', featured: false },
  ]);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  
  // Certifications State
  const [certifications, setCertifications] = useState<Certification[]>([
    { name: 'AWS Solutions Architect', issuer: 'Amazon', date: 'Aug 2022', expires: null },
    { name: 'Certified ScrumMaster (CSM)', issuer: 'Scrum Alliance', date: 'Jan 2021', expires: 'Jan 2025' },
  ]);
  const [isAddingCert, setIsAddingCert] = useState(false);
  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '', expires: '' });

  if (!currentUser) return null;
  const employee = employees.find(e => e.id === currentUser.id);
  if (!employee) return null;

  const { register, handleSubmit } = useForm({
    defaultValues: {
      phone: employee.phone,
      address: employee.address,
      avatarUrl: employee.avatarUrl
    }
  });

  const onSubmit = (data: any) => {
    updateEmployee(employee.id, data);
    toast.success('Profile updated successfully');
    setIsEditing(false);
  };

  // Add Skill Handler
  const handleAddSkill = () => {
    if (newSkillName.trim()) {
      if (skills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
        toast.error('Skill already exists!');
        return;
      }
      setSkills([...skills, { name: newSkillName.trim(), featured: false }]);
      setNewSkillName('');
      setIsAddingSkill(false);
      toast.success('Skill added successfully!');
    }
  };

  // Remove Skill Handler
  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter(s => s.name !== skillName));
    toast.success('Skill removed');
  };

  // Toggle Skill Featured
  const toggleSkillFeatured = (skillName: string) => {
    setSkills(skills.map(s => 
      s.name === skillName ? { ...s, featured: !s.featured } : s
    ));
  };

  // Add Certification Handler
  const handleAddCertification = () => {
    if (newCert.name.trim() && newCert.issuer.trim() && newCert.date.trim()) {
      setCertifications([...certifications, {
        name: newCert.name.trim(),
        issuer: newCert.issuer.trim(),
        date: newCert.date.trim(),
        expires: newCert.expires.trim() || null
      }]);
      setNewCert({ name: '', issuer: '', date: '', expires: '' });
      setIsAddingCert(false);
      toast.success('Certification added successfully!');
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  // Remove Certification Handler
  const handleRemoveCertification = (certName: string) => {
    setCertifications(certifications.filter(c => c.name !== certName));
    toast.success('Certification removed');
  };

  // Profile data (non-editable parts)
  const profileData = {
    aboutMe: `Experienced ${employee.designation} with expertise in the ${employee.department} domain. Passionate about building efficient solutions and driving team success. I believe in the power of collaboration and data-driven decisions.`,
    whatILove: `The collaborative culture at Dayflow is unmatched. I love the freedom to experiment with new technologies and the constant challenge of improving our core product for thousands of users.`,
    interests: ['Photography', 'Cycling', 'Sci-Fi Novels', 'Generative Art'],
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumber: '****6789',
      ifsc: 'HDFC0001234',
      pan: 'XXXX-XX-1234',
    },
    loginHistory: [
      { device: 'Chrome on Windows', location: 'Kolkata, IN', datetime: 'Jan 3, 2026 at 10:30 AM', status: 'active' },
      { device: 'Safari on iPhone', location: 'Kolkata, IN', datetime: 'Jan 2, 2026 at 08:15 PM', status: 'success' },
      { device: 'Edge on Windows', location: 'Delhi, IN', datetime: 'Dec 28, 2025 at 02:00 PM', status: 'success' },
    ],
  };

  // Calculate salary breakdown based on wireframe specifications
  const calculatedSalary = useMemo(() => {
    const wage = monthlyWage;
    const basic = Math.round(wage * (SALARY_CONFIG.basicPercentage / 100));
    const hra = Math.round(basic * (SALARY_CONFIG.hraPercentage / 100));
    const standardAllowance = Math.round(wage * (SALARY_CONFIG.standardAllowancePercentage / 100));
    const performanceBonus = Math.round(wage * (SALARY_CONFIG.performanceBonusPercentage / 100));
    const lta = Math.round(wage * (SALARY_CONFIG.ltaPercentage / 100));
    const totalComponents = basic + hra + standardAllowance + performanceBonus + lta;
    const fixedAllowance = Math.max(0, wage - totalComponents);
    
    // PF Calculations
    const employeePF = Math.round(basic * (SALARY_CONFIG.pfRate / 100));
    const employerPF = Math.round(basic * (SALARY_CONFIG.pfRate / 100));
    
    return {
      wage,
      yearlyWage: wage * 12,
      basic,
      hra,
      standardAllowance,
      performanceBonus,
      lta,
      fixedAllowance,
      employeePF,
      employerPF,
      professionalTax: SALARY_CONFIG.professionalTax,
    };
  }, [monthlyWage]);

  const salaryBreakdown = [
    { name: 'Basic Salary', percentage: `${SALARY_CONFIG.basicPercentage}%`, amount: calculatedSalary.basic, description: 'Define Basic salary from company cost compute it based on monthly wages' },
    { name: 'House Rent Allowance', percentage: `${SALARY_CONFIG.hraPercentage}%`, amount: calculatedSalary.hra, description: 'HRA provided to employees 50% of the basic salary' },
    { name: 'Standard Allowance', percentage: `${SALARY_CONFIG.standardAllowancePercentage}%`, amount: calculatedSalary.standardAllowance, description: 'A standard allowance is a predetermined, fixed amount provided to employee as part of their salary' },
    { name: 'Performance Bonus', percentage: `${SALARY_CONFIG.performanceBonusPercentage}%`, amount: calculatedSalary.performanceBonus, description: 'Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary' },
    { name: 'Leave Travel Allowance', percentage: `${SALARY_CONFIG.ltaPercentage}%`, amount: calculatedSalary.lta, description: 'LTA is paid by the company to employees to cover their travel expenses, and calculated as a % of the basic salary' },
    { name: 'Fixed Allowance', percentage: `${((calculatedSalary.fixedAllowance / calculatedSalary.wage) * 100).toFixed(2)}%`, amount: calculatedSalary.fixedAllowance, description: 'Fixed allowance portion of wages is determined after calculating all salary components' },
  ];

  // Tabs - Salary Info only visible to Admin
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = isAdmin
    ? [
        { id: 'resume', label: 'Resume', icon: <FileText className="w-5 h-5" /> },
        { id: 'private', label: 'Private Info', icon: <Lock className="w-5 h-5" /> },
        { id: 'salary', label: 'Salary Info', icon: <Wallet className="w-5 h-5" /> },
        { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
      ]
    : [
        { id: 'resume', label: 'Resume', icon: <FileText className="w-5 h-5" /> },
        { id: 'private', label: 'Private Info', icon: <Lock className="w-5 h-5" /> },
        { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
      ];

  return (
    <div className="p-4 lg:p-8">
      {/* Main Content */}
      <div className="flex flex-col max-w-[1200px] mx-auto w-full gap-6">
          {/* Page Title */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
          </div>

          {/* Profile Header */}
          <InteractiveCard interactiveColor="#6e3df5" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" borderRadius="16px" className="p-6 md:p-8 relative overflow-hidden group">
            {/* Abstract BG Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#6e3df5]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <div className="flex flex-col lg:flex-row gap-8 relative z-10">
              {/* Left Section - Avatar and Basic Info */}
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start flex-1">
                {/* Avatar with Gradient Ring */}
                <div className="relative shrink-0">
                  <div className="relative p-[3px] rounded-full bg-gradient-to-br from-[#6e3df5] via-cyan-400 to-[#6e3df5]">
                    <div className="h-[100px] w-[100px] rounded-full border-4 border-[#151022] bg-gradient-to-br from-[#6e3df5] to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="absolute bottom-1 right-1 bg-[#151022] rounded-full p-1.5 border border-[#2d2249] cursor-pointer hover:border-[#6e3df5] transition-colors group/edit"
                  >
                    <Edit2 className="w-4 h-4 text-white group-hover/edit:text-[#6e3df5] transition-colors" />
                  </button>
                </div>

                {/* Name and Basic Details */}
                <div className="flex flex-col text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-[#a090cb]">
                      {employee.firstName} {employee.lastName}
                    </span>
                  </h1>
                  <div className="space-y-2 text-sm">
                    <p className="text-[#a090cb] flex items-center gap-2 justify-center md:justify-start">
                      <Briefcase className="w-4 h-4 text-[#564a75]" />
                      <span>{employee.designation}</span>
                    </p>
                    <p className="text-[#a090cb] flex items-center gap-2 justify-center md:justify-start">
                      <Mail className="w-4 h-4 text-[#564a75]" />
                      {employee.email}
                    </p>
                    <p className="text-[#a090cb] flex items-center gap-2 justify-center md:justify-start">
                      <Phone className="w-4 h-4 text-[#564a75]" />
                      {employee.phone || '+91 9876543210'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Section - Company Details */}
              <div className="grid grid-cols-2 gap-4 border-l-0 lg:border-l border-[#2d2249] lg:pl-8">
                <div>
                  <label className="text-xs text-[#a090cb] uppercase font-semibold">Company</label>
                  <p className="text-white font-medium">{employee.companyName || 'Dayflow Inc.'}</p>
                </div>
                <div>
                  <label className="text-xs text-[#a090cb] uppercase font-semibold">Department</label>
                  <p className="text-white font-medium">{employee.department}</p>
                </div>
                <div>
                  <label className="text-xs text-[#a090cb] uppercase font-semibold">Manager</label>
                  <p className="text-white font-medium">John Smith</p>
                </div>
                <div>
                  <label className="text-xs text-[#a090cb] uppercase font-semibold">Location</label>
                  <p className="text-white font-medium">{employee.address.split(',').slice(-2).join(',') || 'Kolkata, India'}</p>
                </div>
              </div>
            </div>
          </InteractiveCard>

          {/* Tabs Navigation */}
          <div className="mb-2">
            <nav className="flex gap-1 p-1 bg-[#151022]/60 rounded-xl border border-[#2d2249] inline-flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'bg-[#2d2249] text-white shadow-lg' 
                      : 'text-[#a090cb] hover:text-white hover:bg-[#1e1730]'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-[#6e3df5]' : ''}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {/* Resume Tab */}
            {activeTab === 'resume' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                {/* Left Column */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  {/* About Me */}
                  <InteractiveCard interactiveColor="#6e3df5" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-[#6e3df5]/10 text-[#6e3df5]">
                        <User className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white">About Me</h3>
                    </div>
                    {isEditing ? (
                      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#a090cb] mb-1.5">Phone Number</label>
                          <input 
                            {...register('phone')}
                            className="w-full bg-[#1e1730] border border-white/[0.08] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6e3df5] focus:ring-1 focus:ring-[#6e3df5] transition-all duration-200 placeholder-[#564a75]"
                            placeholder="+91 98xxx xxxxx"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#a090cb] mb-1.5">Address</label>
                          <textarea 
                            {...register('address')}
                            className="w-full bg-[#1e1730] border border-white/[0.08] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6e3df5] focus:ring-1 focus:ring-[#6e3df5] transition-all duration-200 placeholder-[#564a75] resize-none h-24"
                            placeholder="Enter your address"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="bg-[#6e3df5] hover:bg-[#6e3df5]/80 text-white font-bold py-2.5 px-6 rounded-lg shadow-[0_0_20px_-5px_rgba(110,61,245,0.4)] transition-all"
                        >
                          Save Changes
                        </button>
                      </form>
                    ) : (
                      <p className="text-[#a090cb] leading-relaxed text-sm">
                        {profileData.aboutMe}
                      </p>
                    )}
                  </InteractiveCard>

                  {/* What I love */}
                  <InteractiveCard interactiveColor="#ec4899" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-[#6e3df5]/10 text-[#6e3df5]">
                        <Heart className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white">What I love about my job</h3>
                    </div>
                    <p className="text-[#a090cb] leading-relaxed text-sm">
                      {profileData.whatILove}
                    </p>
                  </InteractiveCard>

                  {/* Interests */}
                  <InteractiveCard interactiveColor="#06b6d4" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-[#6e3df5]/10 text-[#6e3df5]">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Interests and Hobbies</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {profileData.interests.map((interest, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-[#2d2249] text-[#a090cb] text-sm border border-[#403168]"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </InteractiveCard>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  {/* Skills */}
                  <InteractiveCard interactiveColor="#8b5cf6" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#6e3df5]/10 text-[#6e3df5]">
                          <Zap className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Skills</h3>
                      </div>
                      <button 
                        onClick={() => setIsAddingSkill(true)}
                        className="text-xs text-[#6e3df5] font-bold hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add Skills
                      </button>
                    </div>
                    
                    {/* Add Skill Input */}
                    {isAddingSkill && (
                      <div className="mb-4 p-3 bg-[#1e1730] rounded-lg border border-[#6e3df5]/30">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSkillName}
                            onChange={(e) => setNewSkillName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                            placeholder="Enter skill name..."
                            className="flex-1 bg-[#151022] border border-white/[0.08] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6e3df5] focus:ring-1 focus:ring-[#6e3df5] placeholder-[#564a75]"
                            autoFocus
                          />
                          <button
                            onClick={handleAddSkill}
                            className="p-2 bg-[#6e3df5] text-white rounded-lg hover:bg-[#6e3df5]/80 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setIsAddingSkill(false); setNewSkillName(''); }}
                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, idx) => (
                        <div
                          key={idx}
                          className={`group relative px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                            skill.featured 
                              ? 'bg-gradient-to-r from-[#6e3df5]/80 to-purple-500/80 text-white shadow-[0_0_10px_-2px_rgba(110,61,245,0.3)]'
                              : 'bg-[#2d2249] text-[#a090cb] border border-[#403168] hover:border-[#6e3df5]/50'
                          }`}
                          onClick={() => toggleSkillFeatured(skill.name)}
                          title="Click to toggle featured"
                        >
                          {skill.name}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveSkill(skill.name); }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </InteractiveCard>

                  {/* Certifications */}
                  <InteractiveCard interactiveColor="#f59e0b" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-[#6e3df5]/10 text-[#6e3df5]">
                          <Award className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Certifications</h3>
                      </div>
                      <button 
                        onClick={() => setIsAddingCert(true)}
                        className="text-xs text-[#6e3df5] font-bold hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add
                      </button>
                    </div>
                    
                    {/* Add Certification Form */}
                    {isAddingCert && (
                      <div className="mb-4 p-4 bg-[#1e1730] rounded-lg border border-[#6e3df5]/30">
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={newCert.name}
                            onChange={(e) => setNewCert({...newCert, name: e.target.value})}
                            placeholder="Certification name *"
                            className="w-full bg-[#151022] border border-white/[0.08] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6e3df5] placeholder-[#564a75]"
                          />
                          <input
                            type="text"
                            value={newCert.issuer}
                            onChange={(e) => setNewCert({...newCert, issuer: e.target.value})}
                            placeholder="Issuing organization *"
                            className="w-full bg-[#151022] border border-white/[0.08] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6e3df5] placeholder-[#564a75]"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={newCert.date}
                              onChange={(e) => setNewCert({...newCert, date: e.target.value})}
                              placeholder="Issue date * (e.g. Jan 2024)"
                              className="bg-[#151022] border border-white/[0.08] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6e3df5] placeholder-[#564a75]"
                            />
                            <input
                              type="text"
                              value={newCert.expires}
                              onChange={(e) => setNewCert({...newCert, expires: e.target.value})}
                              placeholder="Expiry (optional)"
                              className="bg-[#151022] border border-white/[0.08] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6e3df5] placeholder-[#564a75]"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={handleAddCertification}
                              className="flex-1 py-2 bg-[#6e3df5] text-white rounded-lg text-sm font-medium hover:bg-[#6e3df5]/80 transition-colors"
                            >
                              Add Certification
                            </button>
                            <button
                              onClick={() => { setIsAddingCert(false); setNewCert({ name: '', issuer: '', date: '', expires: '' }); }}
                              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-4">
                      {certifications.map((cert, idx) => (
                        <div key={idx} className={`group flex gap-3 items-start ${idx < certifications.length - 1 ? 'border-b border-[#2d2249] pb-3' : ''}`}>
                          <div className="bg-white/5 p-2 rounded-lg">
                            <Star className={`w-5 h-5 ${idx === 0 ? 'text-orange-400' : 'text-yellow-500'}`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-white text-sm font-semibold">{cert.name}</p>
                            <p className="text-[#a090cb] text-xs">
                              {cert.issuer} • Issued {cert.date} • {cert.expires ? `Expires ${cert.expires}` : 'No Expiration'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveCertification(cert.name)}
                            className="p-1.5 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {certifications.length === 0 && (
                        <p className="text-[#a090cb] text-sm text-center py-4">No certifications added yet</p>
                      )}
                    </div>
                  </InteractiveCard>
                </div>
              </div>
            )}

            {/* Private Info Tab */}
            {activeTab === 'private' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
                {/* Personal Details */}
                <InteractiveCard interactiveColor="#6e3df5" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-6 lg:p-8">
                  <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-[#2d2249]">Personal Details</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm text-[#564a75]">Date of Birth</label>
                        <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white">{employee.dob}</span></div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-[#564a75]">Gender</label>
                        <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white">{employee.gender}</span></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[#564a75]">Residing Address</label>
                      <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white">{employee.address || 'Not provided'}</span></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm text-[#564a75]">Nationality</label>
                        <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white">Indian</span></div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-[#564a75]">Marital Status</label>
                        <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white">Single</span></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[#564a75]">Personal Email</label>
                      <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white">{employee.email}</span></div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[#564a75]">Date of Joining</label>
                      <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white">{employee.joinDate}</span></div>
                    </div>
                  </div>
                </InteractiveCard>

                {/* Bank Details */}
                <InteractiveCard interactiveColor="#10b981" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-6 lg:p-8">
                  <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-[#2d2249]">Bank Details</h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm text-[#564a75]">Account Number</label>
                      <div className="border-b-2 border-[#2d2249] pb-2 flex items-center justify-between">
                        <span className="text-white font-mono tracking-wider">{showAccountNumber ? '123456789012' : '••••••••9012'}</span>
                        <button onClick={() => setShowAccountNumber(!showAccountNumber)} className="text-[#564a75] hover:text-white transition-colors">
                          {showAccountNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[#564a75]">Bank Name</label>
                      <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white">{profileData.bankDetails.bankName}</span></div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[#564a75]">IFSC Code</label>
                      <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white font-mono">{profileData.bankDetails.ifsc}</span></div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[#564a75]">PAN No</label>
                      <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white font-mono">{profileData.bankDetails.pan}</span></div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[#564a75]">UAN NO</label>
                      <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white font-mono">101234567890</span></div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[#564a75]">Emp Code</label>
                      <div className="border-b-2 border-[#2d2249] pb-2"><span className="text-white font-mono">{employee.id}</span></div>
                    </div>
                  </div>
                </InteractiveCard>
              </div>
            )}

            {/* Salary Info Tab - Admin Only */}
            {activeTab === 'salary' && isAdmin && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                {/* Top Section - Wage Info and Working Schedule */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Wage Cards */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InteractiveCard interactiveColor="#6e3df5" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-5">
                      <label className="text-[#a090cb] text-sm font-medium mb-2 block">Month Wage</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={monthlyWage}
                          onChange={(e) => setMonthlyWage(Number(e.target.value))}
                          className="text-2xl font-bold text-white bg-transparent border-b border-[#2d2249] focus:border-[#6e3df5] outline-none w-32 text-right"
                        />
                        <span className="text-[#a090cb]">/ Month</span>
                      </div>
                    </InteractiveCard>
                    <InteractiveCard interactiveColor="#10b981" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-5">
                      <label className="text-[#a090cb] text-sm font-medium mb-2 block">Yearly Wage</label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white">
                          {calculatedSalary.yearlyWage.toLocaleString()}
                        </span>
                        <span className="text-[#a090cb]">/ Yearly</span>
                      </div>
                    </InteractiveCard>
                  </div>
                  
                  {/* Working Schedule */}
                  <InteractiveCard interactiveColor="#8055f6" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-5">
                    <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#6e3df5]" /> Working Schedule
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#a090cb] text-sm">No of working days in a week:</span>
                        <input
                          type="number"
                          value={workingDaysPerWeek}
                          onChange={(e) => setWorkingDaysPerWeek(Number(e.target.value))}
                          className="w-12 text-center bg-[#1e1730] border border-[#2d2249] rounded text-white px-2 py-1"
                          min={1}
                          max={7}
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#a090cb] text-sm">Break Time:</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={breakTimeHours}
                            onChange={(e) => setBreakTimeHours(Number(e.target.value))}
                            className="w-12 text-center bg-[#1e1730] border border-[#2d2249] rounded text-white px-2 py-1"
                            min={0}
                            max={4}
                          />
                          <span className="text-[#a090cb] text-sm">/hrs</span>
                        </div>
                      </div>
                    </div>
                  </InteractiveCard>
                </div>

                {/* Salary Components Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Salary Components Table */}
                  <div className="lg:col-span-2">
                    <InteractiveCard interactiveColor="#8055f6" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="overflow-hidden" disableRotation>
                      <div className="p-5 border-b border-[#2d2249]">
                        <h3 className="text-lg font-bold text-white">Salary Components</h3>
                      </div>
                      <div className="divide-y divide-[#2d2249]">
                        {salaryBreakdown.map((item, idx) => (
                          <div key={idx} className="p-4 hover:bg-white/5 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-white font-medium">{item.name}</span>
                              <div className="flex items-center gap-3 text-right">
                                <span className="font-mono text-white">₹{item.amount.toLocaleString()}</span>
                                <span className="text-[#a090cb] text-sm">₹ / month</span>
                                <span className="text-[#6e3df5] font-semibold min-w-[60px] text-right">{item.percentage}</span>
                              </div>
                            </div>
                            <p className="text-[#a090cb] text-xs">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </InteractiveCard>
                  </div>

                  {/* Right Column - PF and Tax */}
                  <div className="space-y-4">
                    {/* PF Contribution */}
                    <InteractiveCard interactiveColor="#f97316" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-5">
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-orange-400" />
                        Provident Fund (PF) Contribution
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[#a090cb] text-sm">Employee</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-white">₹{calculatedSalary.employeePF.toLocaleString()}</span>
                              <span className="text-[#a090cb] text-xs">₹ / month</span>
                              <span className="text-[#6e3df5] text-sm">{SALARY_CONFIG.pfRate}%</span>
                            </div>
                          </div>
                          <p className="text-[#a090cb] text-xs">PF is calculated based on the basic salary</p>
                        </div>
                        <div className="border-t border-[#2d2249] pt-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[#a090cb] text-sm">Employer</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-white">₹{calculatedSalary.employerPF.toLocaleString()}</span>
                              <span className="text-[#a090cb] text-xs">₹ / month</span>
                              <span className="text-[#6e3df5] text-sm">{SALARY_CONFIG.pfRate}%</span>
                            </div>
                          </div>
                          <p className="text-[#a090cb] text-xs">PF is calculated based on the basic salary</p>
                        </div>
                      </div>
                    </InteractiveCard>

                    {/* Tax Deductions */}
                    <InteractiveCard interactiveColor="#ef4444" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="p-5">
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-red-400" />
                        Tax Deductions
                      </h4>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[#a090cb] text-sm">Professional Tax</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white">₹{calculatedSalary.professionalTax.toLocaleString()}</span>
                            <span className="text-[#a090cb] text-xs">₹ / month</span>
                          </div>
                        </div>
                        <p className="text-[#a090cb] text-xs">Professional Tax deducted from the Gross salary</p>
                      </div>
                    </InteractiveCard>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                {/* Change Password & 2FA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Password */}
                  <InteractiveCard interactiveColor="#6e3df5" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="lg:col-span-2 p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Change Password</h3>
                    <div className="space-y-4 max-w-lg">
                      <div>
                        <label className="block text-sm font-medium text-[#a090cb] mb-1.5">Current Password</label>
                        <input 
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-[#1e1730] border border-white/[0.08] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6e3df5] focus:ring-1 focus:ring-[#6e3df5] transition-all duration-200 placeholder-[#564a75]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#a090cb] mb-1.5">New Password</label>
                        <input 
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-[#1e1730] border border-white/[0.08] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6e3df5] focus:ring-1 focus:ring-[#6e3df5] transition-all duration-200 placeholder-[#564a75]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#a090cb] mb-1.5">Confirm New Password</label>
                        <input 
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-[#1e1730] border border-white/[0.08] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#6e3df5] focus:ring-1 focus:ring-[#6e3df5] transition-all duration-200 placeholder-[#564a75]"
                        />
                      </div>
                      <button className="bg-[#6e3df5] hover:bg-[#6e3df5]/80 text-white font-bold py-2.5 px-6 rounded-lg shadow-[0_0_20px_-5px_rgba(110,61,245,0.4)] transition-all mt-2">
                        Update Password
                      </button>
                    </div>
                  </InteractiveCard>

                  {/* 2FA */}
                  <InteractiveCard interactiveColor="#10b981" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="lg:col-span-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <Shield className="w-8 h-8 text-[#6e3df5]" />
                        <h3 className="text-lg font-bold text-white">Two-Factor Auth</h3>
                      </div>
                      <p className="text-[#a090cb] text-sm mb-6">
                        Add an extra layer of security to your account by enabling 2FA via SMS or Authenticator App.
                      </p>
                    </div>
                    <div className="flex items-center justify-between bg-[#1e1730] p-4 rounded-lg border border-[#2d2249]">
                      <span className="text-white font-medium">Enable 2FA</span>
                      {/* Toggle Switch */}
                      <button 
                        onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          twoFactorEnabled ? 'bg-[#6e3df5] shadow-[0_0_10px_-2px_rgba(110,61,245,0.3)]' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            twoFactorEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
                          }`}
                        />
                      </button>
                    </div>
                  </InteractiveCard>
                </div>

                {/* Login History */}
                <InteractiveCard interactiveColor="#3b82f6" tailwindBgClass="bg-[rgba(21,16,35,0.7)]" className="overflow-hidden" disableRotation>
                  <div className="p-6 border-b border-[#2d2249]">
                    <h3 className="text-lg font-bold text-white">Recent Login History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#1e1730] text-[#a090cb] text-xs uppercase font-semibold">
                        <tr>
                          <th className="px-6 py-4">Device</th>
                          <th className="px-6 py-4">Location</th>
                          <th className="px-6 py-4">Date & Time</th>
                          <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2d2249] text-sm text-white">
                        {profileData.loginHistory.map((login, idx) => (
                          <tr key={idx} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 flex items-center gap-2">
                              {login.device.includes('Chrome') || login.device.includes('Edge') ? (
                                <Laptop className="w-5 h-5 text-[#a090cb]" />
                              ) : login.device.includes('iPhone') ? (
                                <Smartphone className="w-5 h-5 text-[#a090cb]" />
                              ) : (
                                <Monitor className="w-5 h-5 text-[#a090cb]" />
                              )}
                              {login.device}
                            </td>
                            <td className="px-6 py-4">{login.location}</td>
                            <td className="px-6 py-4">{login.datetime}</td>
                            <td className="px-6 py-4 text-right">
                              {login.status === 'active' ? (
                                <span className="text-green-400 text-xs border border-green-400/30 bg-green-400/10 px-2 py-1 rounded">
                                  Active Now
                                </span>
                              ) : (
                                <span className="text-[#a090cb]">Success</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </InteractiveCard>
              </div>
            )}
          </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
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