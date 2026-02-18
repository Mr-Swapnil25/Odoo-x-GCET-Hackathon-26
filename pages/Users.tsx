import React, { useState, useCallback } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card, Button, Input, Select, EmptyState, useRoleTheme, cn
} from '../components/UI';
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer';
import { GlassCard } from '../components/animations/GlassCard';
import { Tilt3DCard } from '../components/animations/Tilt3DCard';
import {
  Plus, Shield, User, Trash2, X, Loader2, Check, Mail
} from 'lucide-react';
import type { Role } from '../types';
import toast from 'react-hot-toast';

export const Users = () => {
  const { users, createUser, updateUser, deleteUser } = useStore();
  const theme = useRoleTheme();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' as Role });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      toast.error('All fields are required');
      return;
    }
    setSubmitting(true);
    const res = await createUser(formData);
    setSubmitting(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('User created');
      setFormData({ name: '', email: '', password: '', role: 'USER' });
      setShowForm(false);
    }
  }, [formData, createUser]);

  const handleRoleChange = useCallback(async (userId: string, newRole: Role) => {
    const res = await updateUser(userId, { role: newRole });
    if (res.error) toast.error(res.error);
    else toast.success('Role updated');
  }, [updateUser]);

  const handleDelete = useCallback(async (userId: string) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    setDeletingId(userId);
    const res = await deleteUser(userId);
    setDeletingId(null);
    if (res.error) toast.error(res.error);
    else toast.success('User removed');
  }, [deleteUser]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className={cn("text-sm mt-1", theme.textMuted)}>{users.length} team member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'secondary' : 'primary'}>
          {showForm ? <><X className="w-4 h-4 mr-1" /> Cancel</> : <><Plus className="w-4 h-4 mr-1" /> Add User</>}
        </Button>
      </div>

      {/* Create User Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <GlassCard elevation="high" gradientBorder className="p-6">
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <label className="block text-sm font-medium text-white mb-1.5">Full Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      placeholder="John Doe"
                      required
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <label className="block text-sm font-medium text-white mb-1.5">Email *</label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      placeholder="user@example.com"
                      required
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <label className="block text-sm font-medium text-white mb-1.5">Password *</label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <label className="block text-sm font-medium text-white mb-1.5">Role</label>
                    <Select
                      value={formData.role}
                      onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as Role }))}
                    >
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </motion.div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Creating...</> : <><Plus className="w-4 h-4 mr-1" /> Create User</>}
                  </Button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Cards Grid */}
      {users.length === 0 ? (
        <EmptyState title="No users" description="Add your first team member" />
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {users.map((user) => (
              <StaggerItem key={user.id} animation="scaleUp">
                <motion.div
                  layout
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
                  className={cn(deletingId === user.id && "opacity-50 pointer-events-none")}
                >
                  <Tilt3DCard maxTilt={4}>
                    <GlassCard elevation="medium" className="p-5">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0",
                            user.role === 'ADMIN'
                              ? "bg-gradient-to-br from-blue-500 to-blue-700"
                              : "bg-gradient-to-br from-purple-500 to-purple-700"
                          )}
                        >
                          {user.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">{user.name}</h3>
                          <p className={cn("text-xs mt-0.5 truncate flex items-center gap-1", theme.textMuted)}>
                            <Mail className="w-3 h-3 shrink-0" />
                            {user.email}
                          </p>

                          {/* Role Pill Selector */}
                          <div className="flex items-center gap-1.5 mt-3">
                            <button
                              onClick={() => handleRoleChange(user.id, 'USER')}
                              className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
                                user.role === 'USER'
                                  ? "bg-purple-500/20 text-purple-400 border-purple-500/40"
                                  : cn("border-transparent", theme.textMuted, "hover:bg-white/5")
                              )}
                            >
                              <User className="w-3 h-3" />
                              User
                            </button>
                            <button
                              onClick={() => handleRoleChange(user.id, 'ADMIN')}
                              className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all",
                                user.role === 'ADMIN'
                                  ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                                  : cn("border-transparent", theme.textMuted, "hover:bg-white/5")
                              )}
                            >
                              <Shield className="w-3 h-3" />
                              Admin
                            </button>
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </GlassCard>
                  </Tilt3DCard>
                </motion.div>
              </StaggerItem>
            ))}
          </AnimatePresence>
        </StaggerContainer>
      )}
    </div>
  );
};
