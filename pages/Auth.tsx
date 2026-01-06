import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '../store';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Role } from '../types';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Infinity, Chrome } from 'lucide-react';
import RippleLoader from '../components/RippleLoader';
import WaveBackground from '../components/WaveBackground';

// Firebase authentication (optional - gracefully fallback to local auth)
let firebaseAuth: any = null;
const loadFirebaseAuth = async () => {
  try {
    firebaseAuth = await import('../lib/firebase');
    return true;
  } catch (e) {
    console.log('Firebase not configured, using local authentication');
    return false;
  }
};
loadFirebaseAuth();

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Login = () => {
  const { employees, login } = useStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  // Firebase Email/Password Login
  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    
    try {
      // Try Firebase authentication first
      if (firebaseAuth) {
        const result = await firebaseAuth.signInWithEmail(data.email, data.password);
        if (result.user) {
          // Find matching employee or create session
          const user = employees.find(e => e.email === data.email);
          if (user) {
            login({
              id: user.id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              role: user.role,
              companyName: user.companyName,
              companyLogo: user.companyLogo
            });
          } else {
            // Create user session from Firebase auth
            login({
              id: result.user.uid,
              email: result.user.email || data.email,
              name: result.user.displayName || data.email.split('@')[0],
              role: Role.EMPLOYEE
            });
          }
          toast.success('Welcome back!');
          navigate('/');
          return;
        }
      }
    } catch (firebaseError: any) {
      console.log('Firebase auth failed, trying local auth:', firebaseError.message);
    }

    // Fallback to local authentication
    const user = employees.find(e => e.email === data.email && e.password === data.password);

    if (user) {
      login({
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        companyName: user.companyName,
        companyLogo: user.companyLogo
      });
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error('Invalid email or password');
    }
    setLoading(false);
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    if (!firebaseAuth) {
      toast.error('Firebase not configured for Google Sign-In');
      return;
    }
    
    setGoogleLoading(true);
    try {
      const result = await firebaseAuth.signInWithGoogle();
      if (result.user) {
        // Find matching employee or create new session
        const existingEmployee = employees.find(e => e.email === result.user.email);
        
        if (existingEmployee) {
          login({
            id: existingEmployee.id,
            email: existingEmployee.email,
            name: `${existingEmployee.firstName} ${existingEmployee.lastName}`,
            role: existingEmployee.role
          });
        } else {
          // Create new user session from Google auth
          login({
            id: result.user.uid,
            email: result.user.email || '',
            name: result.user.displayName || 'Google User',
            role: Role.EMPLOYEE
          });
        }
        
        toast.success(`Welcome, ${result.user.displayName || 'User'}!`);
        navigate('/');
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      toast.error(error.message || 'Google Sign-In failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex w-full bg-[#0F172A] text-white font-sans antialiased overflow-hidden">
      {/* Left Panel: Brand & Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between bg-[#0a0f1e] overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#0f172a] z-0" />
        
        {/* Abstract Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#8359f8]/30 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[120px] mix-blend-screen" />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
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

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 relative flex flex-col items-center justify-start lg:justify-center p-6 bg-[#0F172A] overflow-y-auto">
        {/* Wave Background */}
        <WaveBackground 
          colorTheme="auth"
          backdropBlurAmount="lg"
        />
        
        {/* Gradient Glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#8359f8]/20 rounded-full blur-[100px] z-0 pointer-events-none" />
        
        {/* Login Card */}
        <div 
          className="relative z-10 w-full max-w-[420px] rounded-2xl p-8 sm:p-10 flex flex-col gap-6"
          style={{
            background: 'rgba(30, 41, 59, 0.4)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 
              className="text-3xl font-bold tracking-tight pb-1"
              style={{
                background: 'linear-gradient(to right, #8359f8, #c084fc, #22d3ee)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Welcome Back
            </h2>
            <p className="text-slate-400 text-sm font-normal">Enter your details to access your workspace.</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Input */}
            <div className="relative group">
              <input
                type="email"
                id="email"
                placeholder="Email address"
                className="peer block w-full rounded-lg border border-slate-700 bg-[#1E293B]/80 px-4 pl-11 pb-2.5 pt-5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 appearance-none transition-all duration-300 placeholder-transparent outline-none"
                {...register('email')}
              />
              <label 
                htmlFor="email"
                className="absolute left-11 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-sm text-slate-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-cyan-400 cursor-text"
              >
                Email address
              </label>
              <Mail className="absolute left-3 top-4 w-5 h-5 text-slate-500 transition-colors peer-focus:text-cyan-400" />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>
            
            {/* Password Input */}
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Password"
                className="peer block w-full rounded-lg border border-slate-700 bg-[#1E293B]/80 px-4 pl-11 pr-10 pb-2.5 pt-5 text-sm text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 appearance-none transition-all duration-300 placeholder-transparent outline-none"
                {...register('password')}
              />
              <label 
                htmlFor="password"
                className="absolute left-11 top-4 z-10 origin-[0] -translate-y-2.5 scale-75 transform text-sm text-slate-400 duration-300 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-2.5 peer-focus:scale-75 peer-focus:text-cyan-400 cursor-text"
              >
                Password
              </label>
              <Lock className="absolute left-3 top-4 w-5 h-5 text-slate-500 transition-colors peer-focus:text-cyan-400" />
              {/* Toggle Visibility */}
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-4 text-slate-500 hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>
            
            {/* Options Row */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-600 bg-transparent checked:border-[#8359f8] checked:bg-gradient-to-tr checked:from-[#8359f8] checked:to-pink-500 focus:ring-0 focus:ring-offset-0 transition-all"
                  />
                  <svg className="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/>
                  </svg>
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors hover:underline">
                Forgot Password?
              </a>
            </div>
            
            {/* Sign In Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-lg text-white font-semibold text-sm shadow-lg tracking-wide flex items-center justify-center gap-2 mt-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(131,89,248,0.4)] hover:brightness-110 hover:scale-[1.01]"
              style={{ background: 'linear-gradient(90deg, #8359f8 0%, #d946ef 100%)' }}
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
          
          {/* Divider */}
          <div className="relative flex items-center py-2">
            <div className="flex-1 border-t border-slate-700"></div>
            <span className="px-4 text-sm text-slate-500">or continue with</span>
            <div className="flex-1 border-t border-slate-700"></div>
          </div>
          
          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 px-4 rounded-lg bg-slate-800/50 border border-slate-700 text-white font-medium text-sm flex items-center justify-center gap-3 transition-all duration-300 hover:bg-slate-700/50 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span>{googleLoading ? 'Signing in...' : 'Continue with Google'}</span>
          </button>
          
          {/* Footer */}
          <div className="text-center pt-2">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                className="font-semibold hover:opacity-80 transition-opacity"
                style={{
                  background: 'linear-gradient(to right, #8359f8, #d946ef)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
        
        {/* Mobile Brand Mark */}
        <div className="lg:hidden mt-8 flex items-center gap-2 opacity-50">
          <div className="w-6 h-6 rounded bg-[#8359f8] flex items-center justify-center">
            <Infinity className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-400">Dayflow</span>
        </div>
      </div>
    </div>
  );
};