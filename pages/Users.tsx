import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { cn } from '../components/UI';
import type { Role, User } from '../types';
import toast from 'react-hot-toast';
import { Loader2, Mail, Plus, Search, Shield, Trash2, User as UserIcon, UserPlus } from 'lucide-react';

interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

const defaultFormState: CreateUserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'USER',
};

const getInitials = (name: string) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    .slice(0, 2);
  return initials || 'U';
};

const getLastActiveLabel = (createdAt?: string) => {
  if (!createdAt) return 'Unknown';
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) return 'Unknown';

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes <= 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const getRoleSwitchClass = (activeRole: Role, buttonRole: Role) => {
  if (activeRole !== buttonRole) {
    return 'text-white/40 hover:text-white';
  }

  if (buttonRole === 'ADMIN') {
    return 'role-switch-active';
  }

  return 'bg-violet-500/25 border border-violet-500/40 text-white shadow-[0_0_10px_rgba(139,92,246,0.25)]';
};

export const Users = () => {
  const { currentUser, users, createUser, updateUser, deleteUser } = useStore();

  const [query, setQuery] = useState('');
  const [formData, setFormData] = useState<CreateUserFormData>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const adminCount = useMemo(() => users.filter((user) => user.role === 'ADMIN').length, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return users;

    return users.filter((user) =>
      user.name.toLowerCase().includes(normalizedQuery)
      || user.email.toLowerCase().includes(normalizedQuery)
      || user.role.toLowerCase().includes(normalizedQuery),
    );
  }, [users, query]);

  const createButtonLabel = submitting ? 'Creating Profile...' : 'Create Profile';

  const resetForm = useCallback(() => {
    setFormData(defaultFormState);
  }, []);

  const handleCreate = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const name = formData.name.trim();
      const email = formData.email.trim().toLowerCase();
      const password = formData.password.trim();

      if (!name || !email || !password) {
        toast.error('All fields are required');
        return;
      }
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      setSubmitting(true);
      const response = await createUser({
        name,
        email,
        password,
        role: formData.role,
      });
      setSubmitting(false);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success('User created');
      resetForm();
    },
    [formData, createUser, resetForm],
  );

  const handleRoleChange = useCallback(
    async (target: User, nextRole: Role) => {
      if (target.role === nextRole) return;

      const isSelf = target.id === currentUser?.id;
      const isDemotingLastAdmin = target.role === 'ADMIN' && nextRole === 'USER' && adminCount <= 1;

      if (isSelf && nextRole === 'USER') {
        toast.error('You cannot remove your own admin access');
        return;
      }

      if (isDemotingLastAdmin) {
        toast.error('At least one admin account is required');
        return;
      }

      setUpdatingRoleId(target.id);
      const response = await updateUser(target.id, { role: nextRole });
      setUpdatingRoleId(null);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success(`Role updated to ${nextRole}`);
    },
    [currentUser?.id, adminCount, updateUser],
  );

  const handleDelete = useCallback(
    async (target: User) => {
      const isSelf = target.id === currentUser?.id;
      const isLastAdmin = target.role === 'ADMIN' && adminCount <= 1;

      if (isSelf) {
        toast.error('You cannot delete your own account');
        return;
      }
      if (isLastAdmin) {
        toast.error('Cannot delete the last admin account');
        return;
      }
      if (!window.confirm(`Delete "${target.name}"? This action cannot be undone.`)) return;

      setDeletingId(target.id);
      const response = await deleteUser(target.id);
      setDeletingId(null);

      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success('User removed');
    },
    [currentUser?.id, adminCount, deleteUser],
  );

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-aurora-move" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-cyan/10 rounded-full blur-[120px] animate-aurora-move" style={{ animationDelay: '-5s' }} />
        <div className="absolute top-[20%] right-[30%] w-[30%] h-[30%] bg-electric-indigo/10 rounded-full blur-[100px] animate-aurora-move" style={{ animationDelay: '-2s' }} />
        <div className="absolute inset-0 bg-grid-overlay opacity-[0.03]" />
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white/40 rounded-full" />
        <div className="absolute top-3/4 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full" />
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white/30 rounded-full" />
        <div className="absolute bottom-1/4 right-1/2 w-2 h-2 bg-primary/30 rounded-full blur-[1px]" />
      </div>

      <div className="relative z-10 space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-white tracking-tight">User Management</h1>
            <p className="text-white/40 font-mono text-sm mt-1">
              {query
                ? `${filteredUsers.length} of ${users.length} team members`
                : `${users.length} team members active`}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-[#111827] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-white/20"
                placeholder="Search personnel..."
                type="text"
              />
            </div>
            <button
              onClick={() => {
                nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                window.setTimeout(() => nameInputRef.current?.focus(), 200);
              }}
              className="bg-gradient-to-r from-blue-500 to-electric-indigo hover:from-blue-500/90 hover:to-electric-indigo/90 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all flex items-center gap-2 shrink-0"
            >
              <Plus className="h-5 w-5" />
              <span>Add User</span>
            </button>
          </div>
        </header>

        <section className="glass-panel rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
              <UserPlus className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-semibold text-white">New Personnel Profile</h3>
          </div>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleCreate}>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60 ml-1">Full Name</label>
              <input
                ref={nameInputRef}
                value={formData.name}
                onChange={(event) => setFormData((value) => ({ ...value, name: event.target.value }))}
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-white/20"
                placeholder="e.g. Lt. Cmdr. Data"
                type="text"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60 ml-1">Email Address</label>
              <input
                value={formData.email}
                onChange={(event) => setFormData((value) => ({ ...value, email: event.target.value }))}
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-white/20"
                placeholder="data@enterprise.space"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60 ml-1">Access Key (Password)</label>
              <input
                value={formData.password}
                onChange={(event) => setFormData((value) => ({ ...value, password: event.target.value }))}
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-white/20"
                placeholder="........"
                type="password"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-white/60 ml-1">Clearance Level</label>
              <select
                value={formData.role}
                onChange={(event) => setFormData((value) => ({ ...value, role: event.target.value as Role }))}
                className="w-full bg-[#111827] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
              >
                <option value="USER" className="bg-[#0B1120]">Level 1 - User</option>
                <option value="ADMIN" className="bg-[#0B1120]">Level 5 - Admin</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                type="button"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button
                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 px-6 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
                type="submit"
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {createButtonLabel}
              </button>
            </div>
          </form>
        </section>

        {filteredUsers.length === 0 ? (
          <section className="glass-panel rounded-2xl p-10 border border-white/10 text-center">
            <div className="size-14 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="text-white text-lg font-semibold mt-4">No personnel found</h3>
            <p className="text-white/45 text-sm mt-1">Try a different search query.</p>
          </section>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.map((user) => {
              const isRoleUpdating = updatingRoleId === user.id;
              const isDeleting = deletingId === user.id;
              const isBusy = isRoleUpdating || isDeleting;
              const isAdmin = user.role === 'ADMIN';

              return (
                <article
                  key={user.id}
                  className={cn(
                    'glass-panel card-3d rounded-2xl p-6 relative overflow-hidden group border-l-4',
                    isAdmin ? 'border-l-blue-500' : 'border-l-violet-500',
                    isBusy && 'opacity-65 pointer-events-none',
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={cn(
                        'size-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg',
                        isAdmin
                          ? 'bg-gradient-to-br from-blue-500 to-primary shadow-blue-500/20'
                          : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/20',
                      )}
                    >
                      {getInitials(user.name)}
                    </div>

                    <div className="flex bg-black/40 rounded-full p-1 border border-white/10">
                      <button
                        onClick={() => handleRoleChange(user, 'USER')}
                        className={cn(
                          'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1',
                          getRoleSwitchClass(user.role, 'USER'),
                        )}
                      >
                        <UserIcon className="h-3 w-3" />
                        User
                      </button>
                      <button
                        onClick={() => handleRoleChange(user, 'ADMIN')}
                        className={cn(
                          'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1',
                          getRoleSwitchClass(user.role, 'ADMIN'),
                        )}
                      >
                        <Shield className="h-3 w-3" />
                        Admin
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white truncate">{user.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-white/50 text-sm truncate">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className={cn('text-xs font-mono', isAdmin ? 'text-blue-400' : 'text-violet-400')}>
                      Last active: {getLastActiveLabel(user.createdAt)}
                    </span>
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-2 rounded-lg hover:bg-alert-red/10 text-white/20 hover:text-alert-red transition-colors"
                      title="Delete user"
                    >
                      {isDeleting ? <Loader2 className="h-5 w-5 animate-spin text-alert-red" /> : <Trash2 className="h-5 w-5" />}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <div className="flex justify-between items-center text-xs text-white/30 font-mono border-t border-white/5 pt-4">
          <div className="flex gap-4">
            <span>DB_NODES: 12/12 ONLINE</span>
            <span>LATENCY: 14ms</span>
          </div>
          <div>USER DATABASE // SECURE</div>
        </div>
      </div>
    </div>
  );
};

