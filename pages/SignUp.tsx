import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Role, LeaveType, Employee } from '../types';
import { Building2, User, Phone, Mail, Lock, Eye, EyeOff, ArrowRight, Infinity, Hash, Upload, X, ImageIcon } from 'lucide-react';
import RippleLoader from '../components/RippleLoader';
import WaveBackground from '../components/WaveBackground';

// Firebase authentication (optional - gracefully fallback to local)
let firebaseAuth: any = null;
const loadFirebaseAuth = async () => {
  try {
    firebaseAuth = await import('../lib/firebase');
    return true;
  } catch (e) {
    console.log('Firebase not configured, using local storage');
    return false;
  }
};
loadFirebaseAuth();

const signupSchema = z.object({
  firstName: z.string().min(2, "First Name is required"),
  lastName: z.string().min(2, "Last Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  companyName: z.string().min(2, "Company name is required"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain number"),
  confirmPassword: z.string(),
  role: z.nativeEnum(Role),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpForm = z.infer<typeof signupSchema>;

export const SignUp = () => {
  const { addEmployee, employees } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Company logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoUploading, setLogoUploading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SignUpForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: Role.EMPLOYEE,
      companyName: 'Acme Inc.'
    }
  });

  const passwordValue = watch('password', '');
  const selectedRole = watch('role');
  
  // Auto-generate Login ID
  const generatedLoginId = `Emp${Math.floor(1000 + Math.random() * 9000)}`;
  
  const getPasswordStrength = (pass: string): { strength: number; label: string; color: string } => {
    if (!pass) return { strength: 0, label: '', color: '' };
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[a-z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    
    if (strength <= 2) return { strength, label: 'Weak', color: 'text-red-500' };
    if (strength === 3) return { strength, label: 'Medium', color: 'text-yellow-500' };
    if (strength === 4) return { strength, label: 'Strong', color: 'text-green-500' };
    return { strength, label: 'Very Strong', color: 'text-emerald-400' };
  };
  
  const passwordStrength = getPasswordStrength(passwordValue);

  // Handle company logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (PNG, JPG, SVG)');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
  };

  const onSubmit = async (data: SignUpForm) => {
    if (!agreedToTerms) {
      toast.error('Please agree to the Terms of Service');
      return;
    }
    
    setLoading(true);
    
    // Check if email exists locally
    if (employees.some(e => e.email === data.email)) {
        toast.error('Email already exists');
        setLoading(false);
        return;
    }

    // Generate new Employee object with defaults - using timestamp for unique ID
    let newId = `EMP${Date.now().toString().slice(-6)}`;
    let companyLogoUrl = '';
    
    // Try Firebase registration first
    try {
      if (firebaseAuth) {
        const result = await firebaseAuth.registerWithEmail(data.email, data.password, `${data.firstName} ${data.lastName}`);
        if (result.user) {
          newId = result.user.uid; // Use Firebase UID as employee ID
          
          // Upload company logo if provided
          if (logoFile) {
            setLogoUploading(true);
            try {
              const logoResult = await firebaseAuth.uploadFile(
                logoFile, 
                `companies/${newId}/logo_${Date.now()}.${logoFile.name.split('.').pop()}`
              );
              if (logoResult.url) {
                companyLogoUrl = logoResult.url;
              }
            } catch (uploadError) {
              console.log('Logo upload failed, continuing without logo:', uploadError);
            }
            setLogoUploading(false);
          }
          
          toast.success('Firebase account created!');
        }
      }
    } catch (firebaseError: any) {
      // Check if it's a "user already exists" error
      if (firebaseError.code === 'auth/email-already-in-use') {
        toast.error('Email already registered. Please sign in.');
        setLoading(false);
        return;
      }
      console.log('Firebase registration skipped:', firebaseError.message);
    }

    const newEmployee: Employee = {
      id: newId,
      email: data.email,
      password: data.password,
      role: data.role,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || '',
      address: '',
      department: 'Unassigned',
      designation: data.role === Role.ADMIN ? 'Administrator' : 'New Joiner',
      joinDate: new Date().toISOString().split('T')[0],
      gender: 'Not Specified',
      dob: '1990-01-01', // Default
      avatarUrl: `https://ui-avatars.com/api/?name=${data.firstName}+${data.lastName}&background=random`,
      companyName: data.companyName,
      companyLogo: companyLogoUrl,
      leaveBalance: {
        [LeaveType.PAID]: 15,
        [LeaveType.SICK]: 10,
        [LeaveType.CASUAL]: 7,
        [LeaveType.UNPAID]: 0
      },
      salary: {
        basic: 3000,
        hra: 1200,
        allowances: 800,
        deductions: 200,
        netSalary: 4800
      },
      documents: []
    };

    addEmployee(newEmployee);
    toast.success('Account created successfully! Please sign in.');
    navigate('/login');
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex w-full bg-[#0F172A] text-white font-sans antialiased overflow-hidden">
      {/* Left Panel: Brand & Visuals - FIXED */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-[#0a1628] overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2027] via-[#1a3a4a] to-[#0a1628] z-0" />
        
        {/* Abstract Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#06b6d4]/25 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#0891b2]/20 rounded-full blur-[120px] mix-blend-screen" />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#8359f8] to-cyan-400 flex items-center justify-center shadow-lg shadow-[#8359f8]/20">
              <Infinity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">Dayflow</span>
          </div>
          
          {/* Ripple Loader Animation */}
          <div className="flex-1 flex items-center justify-center">
            <RippleLoader 
              icon={<Infinity />}
              size={280}
              duration={2.5}
              logoColor="#8359f8"
            />
          </div>
          
          {/* Tagline */}
          <div className="space-y-4 max-w-lg">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              Every workday, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">perfectly aligned.</span>
            </h1>
            <p className="text-slate-400 text-lg font-light">
              Experience the future of HR management. Seamless, intuitive, and designed for modern teams.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Sign Up Form */}
      <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-start lg:justify-center p-4 sm:p-6 bg-[#0F172A] overflow-y-auto">
        {/* Wave Background */}
        <WaveBackground 
          colorTheme="auth"
          backdropBlurAmount="lg"
        />
        
        {/* Gradient Glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#8359f8]/20 rounded-full blur-[100px] z-0 pointer-events-none" />
        
        {/* Sign Up Card */}
        <div 
          className="relative z-10 w-full max-w-[420px] rounded-2xl p-5 sm:p-6 flex flex-col gap-4 my-4 max-h-[90vh]"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div className="space-y-1 flex-shrink-0">
            <h2 
              className="text-2xl font-bold tracking-tight italic"
              style={{
                background: 'linear-gradient(to right, #8359f8, #c084fc, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Create Account
            </h2>
            <p className="text-slate-400 text-sm">Start managing your team effectively today.</p>
          </div>
          
          {/* Role Toggle */}
          <div className="flex bg-[#1E293B]/60 rounded-lg p-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setValue('role', Role.EMPLOYEE)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedRole === Role.EMPLOYEE 
                  ? 'bg-[#8359f8] text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Employee
            </button>
            <button
              type="button"
              onClick={() => setValue('role', Role.ADMIN)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedRole === Role.ADMIN 
                  ? 'bg-[#8359f8] text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              HR/Admin
            </button>
          </div>
          
          {/* Scrollable Form Container */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Company Name & Logo Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Company Name - Takes 2/3 */}
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Acme Inc."
                    className="w-full rounded-lg border border-slate-700 bg-[#1E293B]/80 px-4 pl-10 py-2.5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                    {...register('companyName')}
                  />
                </div>
                {errors.companyName && <p className="text-xs text-red-400">{errors.companyName.message}</p>}
              </div>
              
              {/* Company Logo - Takes 1/3 */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Logo</label>
                {logoPreview ? (
                  <div className="relative h-[42px] w-full">
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="h-[42px] w-full rounded-lg object-contain border border-slate-600 bg-slate-800/50" 
                    />
                    <button 
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white hover:bg-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center h-[42px] w-full border border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-cyan-500/50 hover:bg-slate-800/30 transition-all group">
                    <div className="flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                      <span className="text-xs text-slate-500 group-hover:text-cyan-400">Upload</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleLogoChange}
                    />
                  </label>
                )}
              </div>
            </div>
            
            {/* Login ID (Auto-generated) */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-2">
                Login ID <span className="text-slate-500 normal-case font-normal">(Auto)</span>
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={generatedLoginId}
                  disabled
                  className="w-full rounded-lg border border-slate-700 bg-[#1E293B]/50 px-4 pl-10 pr-10 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              </div>
            </div>
            
            {/* Full Name & Phone Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full rounded-lg border border-slate-700 bg-[#1E293B]/80 px-4 pl-10 py-2.5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName && <p className="text-xs text-red-400">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    className="w-full rounded-lg border border-slate-700 bg-[#1E293B]/80 px-4 pl-10 py-2.5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                    {...register('phone')}
                  />
                </div>
              </div>
            </div>
            
            {/* Hidden Last Name - using first name input for full name display */}
            <input type="hidden" value="User" {...register('lastName')} />
            
            {/* Work Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="john@company.com"
                  className="w-full rounded-lg border border-slate-700 bg-[#1E293B]/80 px-4 pl-10 py-2.5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>
            
            {/* Password Row - Side by Side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-700 bg-[#1E293B]/80 px-4 pl-10 pr-9 py-2.5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                    {...register('password')}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-700 bg-[#1E293B]/80 px-4 pl-10 pr-9 py-2.5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                    {...register('confirmPassword')}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
              </div>
            </div>
            
            {/* Password Strength Bar */}
            {passwordValue && (
              <div className="space-y-1">
                <div className="flex gap-1 h-1">
                  <div className={`flex-1 rounded-full transition-colors ${passwordStrength.strength >= 1 ? 'bg-red-500' : 'bg-slate-700'}`} />
                  <div className={`flex-1 rounded-full transition-colors ${passwordStrength.strength >= 2 ? 'bg-orange-500' : 'bg-slate-700'}`} />
                  <div className={`flex-1 rounded-full transition-colors ${passwordStrength.strength >= 3 ? 'bg-yellow-500' : 'bg-slate-700'}`} />
                  <div className={`flex-1 rounded-full transition-colors ${passwordStrength.strength >= 4 ? 'bg-green-500' : 'bg-slate-700'}`} />
                  <div className={`flex-1 rounded-full transition-colors ${passwordStrength.strength >= 5 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                </div>
                <p className={`text-xs ${passwordStrength.color}`}>{passwordStrength.label}</p>
              </div>
            )}
            
            {/* Terms Checkbox */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input 
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-600 bg-transparent checked:border-[#8359f8] checked:bg-gradient-to-tr checked:from-[#8359f8] checked:to-pink-500 focus:ring-0 transition-all"
                />
                <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/>
                </svg>
              </div>
              <span className="text-sm text-slate-400">
                I agree to the{' '}
                <a href="#" className="text-cyan-400 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-cyan-400 hover:underline">Privacy Policy</a>.
              </span>
            </label>
            
            {/* Sign Up Button */}
            <button 
              type="submit"
              disabled={loading || logoUploading}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold text-sm shadow-lg tracking-wide flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(131,89,248,0.4)] hover:brightness-110 hover:scale-[1.01]"
              style={{ background: 'linear-gradient(90deg, #8359f8 0%, #d946ef 100%)' }}
            >
              <span>{loading || logoUploading ? (logoUploading ? 'Uploading Logo...' : 'Creating Account...') : 'Sign Up'}</span>
              {!loading && !logoUploading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
          </div>
          {/* End Scrollable Form Container */}
          
          {/* Footer - Fixed at bottom */}
          <div className="text-center flex-shrink-0 pt-2">
            <p className="text-sm text-slate-400">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-white hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
        
        {/* Mobile Brand Mark */}
        <div className="lg:hidden mt-4 flex items-center gap-2 opacity-50">
          <div className="w-6 h-6 rounded bg-[#8359f8] flex items-center justify-center">
            <Infinity className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-400">Dayflow</span>
        </div>
      </div>
    </div>
  );
};