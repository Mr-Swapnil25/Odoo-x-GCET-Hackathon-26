import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Button, Card, CardContent, CardHeader, EmptyState, Input, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/UI';
import type { Role } from '../types';
import { toast } from 'react-hot-toast';

const roleOptions = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' }
];

export const Users = () => {
  const { users, fetchUsers, createUser, updateUser, deleteUser } = useStore();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' as Role });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error('Name, email, and password are required');
      return;
    }
    const res = await createUser({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role
    });
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success('User created');
    setForm({ name: '', email: '', password: '', role: 'USER' });
  };

  const handleRoleChange = async (id: string, role: Role) => {
    const res = await updateUser(id, { role });
    if (res.error) toast.error(res.error);
  };

  const handleDelete = async (id: string) => {
    const res = await deleteUser(id);
    if (res.error) toast.error(res.error);
    else toast.success('User deleted');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="text-sm text-slate-400">Create and manage access for your team.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Create User</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} options={roleOptions} />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">All Users</h2>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState title="No users yet" description="Add your first team member." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className="bg-transparent border border-slate-600 rounded-md px-2 py-1 text-sm text-white"
                      >
                        {roleOptions.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-slate-800">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

