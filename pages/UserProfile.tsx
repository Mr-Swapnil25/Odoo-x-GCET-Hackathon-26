import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, Button, Input, Badge, useRoleTheme, cn
} from '../components/UI';
import { GlassCard } from '../components/animations/GlassCard';
import { CountUpNumber } from '../components/animations/CountUpNumber';
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer';
import {
  User, Mail, Shield, Calendar, Edit3, Check, X, Lock, Unlock,
  ChevronDown, Eye, EyeOff, ClipboardList, CheckCircle2, Clock, AlertTriangle
} from 'lucide-react';
import * as api from '../lib/api';
import toast from 'react-hot-toast';

function getPasswordStrength(pw: string): { level: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (score <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' };
  if (score <= 3) return { level: 3, label: 'Good', color: '#3b82f6' };
  return { level: 4, label: 'Strong', color: '#10b981' };
}

export const UserProfile = () => {
  const { currentUser, tasks, initializeSession } = useStore();
  const theme = useRoleTheme();
  const isAdmin = currentUser?.role === 'ADMIN';

  // Name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [savingName, setSavingName] = useState(false);

  // Password
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const activityStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length;
    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const handleSaveName = useCallback(async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === currentUser?.name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    const res = await api.updateProfile({ name: trimmed });
    setSavingName(false);
    if (res.error) {
      toast.error(typeof res.error === 'string' ? res.error : 'Failed to update name');
      return;
    }
    await initializeSession();
    toast.success('Name updated');
    setIsEditingName(false);
  }, [editName, currentUser?.name, initializeSession]);

  const handleChangePassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) { toast.error('Fill in all fields'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPassword(true);
    const res = await api.changePassword({ currentPassword, newPassword });
    setSavingPassword(false);
    if (res.error) {
      toast.error(typeof res.error === 'string' ? res.error : 'Failed to change password');
      return;
    }
    toast.success('Password updated');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordOpen(false);
  }, [currentPassword, newPassword, confirmPassword]);

  if (!currentUser) return null;

  const themeColors = {
    from: isAdmin ? '#1E3A8A' : '#4C1D95',
    to: isAdmin ? '#3B82F6' : '#8B5CF6',
  };

  const createdDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'N/A';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard elevation="high" className="relative overflow-hidden">
          {/* Gradient Background Blur */}
          <div
            className="absolute inset-0 opacity-20 blur-3xl"
            style={{
              background: `radial-gradient(ellipse at 30% 30%, ${themeColors.from}60, transparent 70%), radial-gradient(ellipse at 70% 70%, ${themeColors.to}40, transparent 70%)`
            }}
          />

          <div className="relative p-8 flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar with pulsing ring */}
            <div className="relative">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${themeColors.from}, ${themeColors.to})`,
                  boxShadow: `0 20px 40px -10px ${themeColors.from}50`
                }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div
                className="absolute -inset-1.5 rounded-2xl animate-pulse-slow pointer-events-none"
                style={{ border: `2px solid ${themeColors.to}40` }}
              />
            </div>

            <div className="text-center sm:text-left flex-1">
              {/* Editable Name */}
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-lg font-bold w-56"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button onClick={handleSaveName} disabled={savingName} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setIsEditingName(false); setEditName(currentUser.name); }} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl font-bold text-[#E8E8FF]">{currentUser.name}</h1>
                  <button
                    onClick={() => { setIsEditingName(true); setEditName(currentUser.name); }}
                    className={cn("p-1.5 rounded-lg transition-all hover:bg-white/5", theme.textMuted, "hover:text-white")}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className={cn("text-sm mt-1 flex items-center gap-1.5 justify-center sm:justify-start", theme.textMuted)}>
                <Mail className="w-4 h-4" />
                {currentUser.email}
              </p>

              {/* Role Badge */}
              <div className="mt-3 flex items-center gap-2 justify-center sm:justify-start">
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border animate-float",
                  isAdmin
                    ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                    : "bg-violet-500/15 text-violet-400 border-violet-500/30"
                )}>
                  <Shield className="w-3.5 h-3.5" />
                  {isAdmin ? 'Administrator' : 'User'}
                </span>
                <span className={cn("flex items-center gap-1 text-xs", theme.textMuted)}>
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {createdDate}
                </span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Activity Stats */}
      <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-3" staggerDelay={0.08}>
        {[
          { label: 'Total Tasks', value: activityStats.total, icon: <ClipboardList className="w-4 h-4" />, color: isAdmin ? 'text-blue-400' : 'text-violet-400' },
          { label: 'Completed', value: activityStats.completed, icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-emerald-400' },
          { label: 'In Progress', value: activityStats.inProgress, icon: <Clock className="w-4 h-4" />, color: 'text-blue-400' },
          { label: 'Overdue', value: activityStats.overdue, icon: <AlertTriangle className="w-4 h-4" />, color: 'text-red-400' },
        ].map((stat) => (
          <StaggerItem key={stat.label} animation="scaleUp">
            <Card variant="elevated" className="p-4">
              <div className="flex items-center gap-3">
                <span className={stat.color}>{stat.icon}</span>
                <div>
                  <p className="text-xl font-bold text-[#E8E8FF]"><CountUpNumber end={stat.value} /></p>
                  <p className={cn("text-[10px]", theme.textMuted)}>{stat.label}</p>
                </div>
              </div>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Account Details */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <div className={cn("px-6 py-4 border-b border-white/6")}>
            <h2 className="text-lg font-semibold text-[#E8E8FF]">Account Details</h2>
          </div>
          <div className="p-6 space-y-4">
            {[
              { icon: <User className="w-4 h-4" />, label: 'Full Name', value: currentUser.name },
              { icon: <Mail className="w-4 h-4" />, label: 'Email Address', value: currentUser.email },
              { icon: <Shield className="w-4 h-4" />, label: 'Role', value: isAdmin ? 'Administrator' : 'User' },
              { icon: <Calendar className="w-4 h-4" />, label: 'Member Since', value: createdDate },
            ].map((row) => (
              <div key={row.label} className={cn("flex items-center gap-4 py-2.5 px-3 -mx-3 rounded-lg transition-colors hover:bg-white/3 group")}>
                <span className={cn("p-2 rounded-lg transition-colors group-hover:bg-white/5", theme.textMuted)}>{row.icon}</span>
                <div className="flex-1">
                  <p className={cn("text-[10px] uppercase tracking-wider", theme.textMuted)}>{row.label}</p>
                  <p className="text-sm font-medium text-[#E8E8FF]">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Change Password Accordion */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <button
            onClick={() => setPasswordOpen(!passwordOpen)}
            className={cn(
              "w-full flex items-center justify-between px-6 py-4 text-left transition-colors",
              "hover:bg-white/3"
            )}
          >
            <div className="flex items-center gap-3">
              <span className={cn("p-2 rounded-lg", theme.isAdmin ? "bg-blue-500/15 text-blue-400" : "bg-violet-500/15 text-violet-400")}>
                <Lock className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-semibold text-[#E8E8FF]">Change Password</h2>
            </div>
            <ChevronDown className={cn("w-5 h-5 transition-transform duration-300", theme.textMuted, passwordOpen && "rotate-180")} />
          </button>

          <AnimatePresence>
            {passwordOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <form onSubmit={handleChangePassword} className={cn("p-6 pt-2 border-t space-y-4 border-white/6")}>
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-[#E8E8FF] mb-1.5">Current Password</label>
                    <div className="relative">
                      <Input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent(!showCurrent)}
                        className={cn("absolute right-3 top-1/2 -translate-y-1/2", theme.textMuted)}
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-[#E8E8FF] mb-1.5">New Password</label>
                    <div className="relative">
                      <Input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className={cn("absolute right-3 top-1/2 -translate-y-1/2", theme.textMuted)}
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength Bar */}
                    {newPassword.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={cn("h-1.5 flex-1 rounded-full overflow-hidden bg-[#111827]")}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(passwordStrength.level / 4) * 100}%` }}
                              transition={{ duration: 0.3 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: passwordStrength.color }}
                            />
                          </div>
                          <span className="text-[10px] font-medium" style={{ color: passwordStrength.color }}>
                            {passwordStrength.label}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-[#E8E8FF] mb-1.5">Confirm New Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingPassword}>
                      {savingPassword ? (
                        <><span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" /> Updating...</>
                      ) : (
                        <><Unlock className="w-4 h-4 mr-1" /> Update Password</>
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};
