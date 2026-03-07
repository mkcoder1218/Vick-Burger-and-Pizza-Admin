import React, { useMemo, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Drawer from '../ui/Drawer';
import Skeleton from '../ui/Skeleton';
import { createOne, deleteOne, updateOne, useGetAll } from '../../swr';

const USERS_RESOURCE = 'api/super-admin/users';
const ROLES_RESOURCE = 'api/roles';
const BUSINESSES_RESOURCE = 'api/super-admin/businesses';

type ApiUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  businessId?: string | null;
};

type ApiRole = { id: string; roleName: string };

type ApiBusiness = { id: string; businessName: string };

type ListResponse<T> = { success: boolean; data: T[] };

export default function SuperUsers() {
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data: usersData, error: usersError, isLoading: usersLoading } = useGetAll<ListResponse<ApiUser>>(USERS_RESOURCE);
  const { data: rolesData } = useGetAll<ListResponse<ApiRole>>(ROLES_RESOURCE);
  const { data: bizData } = useGetAll<ListResponse<ApiBusiness>>(BUSINESSES_RESOURCE, { limit: 500, offset: 0 });

  const users = useMemo(() => usersData?.data ?? [], [usersData]);
  const roles = useMemo(() => rolesData?.data ?? [], [rolesData]);
  const businesses = useMemo(() => bizData?.data ?? [], [bizData]);
  const paged = useMemo(() => users.slice(page * limit, (page + 1) * limit), [users, page]);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editBusinessId, setEditBusinessId] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const resetCreate = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRoleId('');
    setBusinessId('');
    setError('');
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await createOne(USERS_RESOURCE, {
        name,
        email,
        password,
        roleId,
        businessId: businessId || undefined,
      });
      setOpen(false);
      resetCreate();
    } catch (err: any) {
      setError(err?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: ApiUser) => {
    setEditing(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRoleId(u.roleId);
    setEditBusinessId(u.businessId ?? '');
    setEditError('');
    setEditOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError('');
    setEditSaving(true);

    try {
      await updateOne(USERS_RESOURCE, editing.id, {
        name: editName,
        email: editEmail,
        roleId: editRoleId,
        businessId: editBusinessId || null,
      });
      setEditOpen(false);
      setEditing(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update user');
    } finally {
      setEditSaving(false);
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteOne(USERS_RESOURCE, id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete user');
    }
  };

  const roleName = (roleId: string) => roles.find((r) => r.id === roleId)?.roleName ?? '—';
  const businessName = (id?: string | null) => businesses.find((b) => b.id === id)?.businessName ?? '—';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Staff and Admin Accounts</h3>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2"><Plus size={18} /> Create User</Button>
      </div>

      {usersLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}
      {usersError && <div className="text-sm text-red-500">Failed to load users</div>}

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase">
            <tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Business</th><th className="px-6 py-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {paged.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-xs">{u.name.charAt(0)}</div>
                    <div><p className="font-bold text-sm">{u.name}</p><p className="text-xs text-zinc-500">{u.email}</p></div>
                  </div>
                </td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${roleName(u.roleId) === 'Super Admin' ? 'bg-purple-50 text-purple-700' : roleName(u.roleId) === 'Admin' ? 'bg-blue-50 text-blue-700' : 'bg-zinc-100 text-zinc-600'}`}>{roleName(u.roleId)}</span></td>
                <td className="px-6 py-4 text-sm text-zinc-600">{businessName(u.businessId)}</td>
                <td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => openEdit(u)} className="text-zinc-400 hover:text-black"><Edit2 size={16} /></button><button onClick={() => removeUser(u.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
        <div className="text-xs text-zinc-500">Page {page + 1}</div>
        <Button variant="secondary" onClick={() => setPage((p) => (p + 1))} disabled={(page + 1) * limit >= users.length}>Next</Button>
      </div>

      <Drawer open={open} title="Create User" onClose={() => setOpen(false)}>
        <form className="space-y-5" onSubmit={submitCreate}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Role</label>
            <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
              <option value="">Select role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.roleName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Business</label>
            <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
              <option value="">None</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.businessName}</option>)}
            </select>
          </div>

          {error && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{error}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={saving}>
            {saving ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </Drawer>

      <Drawer open={editOpen} title="Edit User" onClose={() => setEditOpen(false)}>
        <form className="space-y-5" onSubmit={submitEdit}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Email</label>
            <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Role</label>
            <select value={editRoleId} onChange={(e) => setEditRoleId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
              <option value="">Select role</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.roleName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Business</label>
            <select value={editBusinessId} onChange={(e) => setEditBusinessId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
              <option value="">None</option>
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.businessName}</option>)}
            </select>
          </div>

          {editError && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{editError}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={editSaving}>
            {editSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
