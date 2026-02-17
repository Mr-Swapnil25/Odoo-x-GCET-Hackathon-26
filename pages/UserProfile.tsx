import React, { useState } from 'react';
import { useStore } from '../store';
import { Card, CardContent, CardHeader, Button, Input, Avatar, Badge, useRoleTheme, cn } from '../components/UI';
import { User, Mail, Shield, Calendar, Pencil, X, Check, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../lib/api';

export const UserProfile = () => {
  const { currentUser } = useStore();
  const theme = useRoleTheme();

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [savingName, setSavingName] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const store = useStore();

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const joinDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  // --- Handlers ---

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty');
      return;
    }
    if (trimmed === currentUser.name) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    const res = await api.updateProfile({ name: trimmed });
    setSavingName(false);

    if ('error' in res && res.error) {
      toast.error(res.error as string);
      return;
    }

    // Refresh session to pick up the new name
    store.initializeSession();
    toast.success('Name updated successfully');
    setIsEditingName(false);
  };

  const handleCancelEditName = () => {
    setEditName(currentUser.name);
    setIsEditingName(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    const res = await api.changePassword({ currentPassword, newPassword });
    setSavingPassword(false);

    if ('error' in res && res.error) {
      toast.error(res.error as string);
      return;
    }

    toast.success('Password changed successfully');
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // --- Render ---

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white">My Profile</h1>
        <p className={cn('text-sm', theme.textMuted)}>
          View and manage your account information.
        </p>
      </div>

      {/* Profile Card */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex items-center gap-5">
            <Avatar name={currentUser.name} size="xl" />
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') handleCancelEditName();
                    }}
                    autoFocus
                    className={cn(
                      'text-xl font-bold bg-transparent border-b-2 outline-none text-white pb-0.5 w-full max-w-xs',
                      theme.isAdmin ? 'border-blue-500' : 'border-[#6e3df5]'
                    )}
                    disabled={savingName}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors disabled:opacity-50"
                  >
                    {savingName ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancelEditName}
                    disabled={savingName}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white truncate">{currentUser.name}</h2>
                  <button
                    onClick={() => {
                      setEditName(currentUser.name);
                      setIsEditingName(true);
                    }}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors',
                      theme.isAdmin
                        ? 'hover:bg-slate-700 text-slate-400'
                        : 'hover:bg-[#2d2249] text-[#a090cb]'
                    )}
                    title="Edit name"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              )}
              <p className={cn('text-sm mt-1', theme.textMuted)}>{currentUser.email}</p>
              <Badge
                variant={currentUser.role === 'ADMIN' ? 'info' : 'default'}
                className="mt-2"
              >
                {currentUser.role === 'ADMIN' ? 'Administrator' : 'User'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Account Details Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-white">Account Details</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Name */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-lg',
                  theme.isAdmin ? 'bg-slate-700/50' : 'bg-[#2d2249]/50'
                )}
              >
                <User className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', theme.textMuted)}>Full Name</p>
                <p className="text-sm text-white truncate">{currentUser.name}</p>
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-lg',
                  theme.isAdmin ? 'bg-slate-700/50' : 'bg-[#2d2249]/50'
                )}
              >
                <Mail className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', theme.textMuted)}>Email Address</p>
                <p className="text-sm text-white truncate">{currentUser.email}</p>
                <p className={cn('text-xs mt-0.5', theme.textMuted)}>
                  Email cannot be changed
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-lg',
                  theme.isAdmin ? 'bg-slate-700/50' : 'bg-[#2d2249]/50'
                )}
              >
                <Shield className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', theme.textMuted)}>Role</p>
                <p className="text-sm text-white">
                  {currentUser.role === 'ADMIN' ? 'Administrator' : 'Standard User'}
                </p>
              </div>
            </div>

            {/* Join Date */}
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-lg',
                  theme.isAdmin ? 'bg-slate-700/50' : 'bg-[#2d2249]/50'
                )}
              >
                <Calendar className="w-4 h-4 text-white/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium', theme.textMuted)}>Joined</p>
                <p className="text-sm text-white">{joinDate}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Security</h3>
            {!showPasswordForm && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordForm(true)}
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        {showPasswordForm && (
          <CardContent>
            <div className="space-y-4">
              {/* Current Password */}
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  disabled={savingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-9.5 text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* New Password */}
              <div className="relative">
                <Input
                  label="New Password"
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  disabled={savingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-9.5 text-slate-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Confirm Password */}
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                error={
                  confirmPassword && newPassword !== confirmPassword
                    ? 'Passwords do not match'
                    : undefined
                }
                disabled={savingPassword}
              />

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleChangePassword}
                  disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  disabled={savingPassword}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
