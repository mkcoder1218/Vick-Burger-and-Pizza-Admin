import React, { useMemo, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Drawer from '../ui/Drawer';
import Skeleton from '../ui/Skeleton';
import { createOne, deleteOne, updateOne, useGetAll } from '../../swr';
import { User } from '../../types';

const STAFF_RESOURCE = 'api/admin/staff';
const ROLES_RESOURCE = 'api/roles';

type ApiUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avgRating?: number | null;
};

type ApiRole = { id: string; roleName: string };

type ListResponse<T> = { success: boolean; data: T[] };

export default function AdminStaff({ currentUser }: { currentUser: User }) {
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data: usersData, error: usersError, isLoading: usersLoading } = useGetAll<ListResponse<ApiUser>>(STAFF_RESOURCE);
  const { data: rolesData } = useGetAll<ListResponse<ApiRole>>(ROLES_RESOURCE);

  const users = useMemo(() => usersData?.data ?? [], [usersData]);
  const roles = useMemo(() => {
    const all = (rolesData?.data ?? []).filter((r) => ['Manager', 'Chef', 'Waiter'].includes(r.roleName));
    if (currentUser.role === 'manager') {
      return all.filter((r) => r.roleName !== 'Manager');
    }
    return all;
  }, [rolesData, currentUser.role]);
  const paged = useMemo(() => users.slice(page * limit, (page + 1) * limit), [users, page]);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const resetCreate = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRoleId('');
    setError('');
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await createOne(STAFF_RESOURCE, {
        name,
        email,
        password,
        roleId,
      });
      setOpen(false);
      resetCreate();
    } catch (err: any) {
      setError(err?.message || 'Failed to create staff');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: ApiUser) => {
    setEditing(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRoleId(u.roleId);
    setEditError('');
    setEditOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError('');
    setEditSaving(true);

    try {
      await updateOne(STAFF_RESOURCE, editing.id, {
        name: editName,
        email: editEmail,
        roleId: editRoleId,
      });
      setEditOpen(false);
      setEditing(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update staff');
    } finally {
      setEditSaving(false);
    }
  };

  const removeUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await deleteOne(STAFF_RESOURCE, id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete staff');
    }
  };

  const roleName = (roleId: string) => roles.find((r) => r.id === roleId)?.roleName ?? '—';

  if (!currentUser.businessId && !currentUser.business?.id) {
    return <div className="text-sm text-zinc-500">No business assigned to this account.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Staff Management</h3>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2"><Plus size={18} /> Add Staff</Button>
      </div>

      {usersLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}
      {usersError && <div className="text-sm text-red-500">Failed to load staff</div>}

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase">
            <tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Rating</th><th className="px-6 py-4">Actions</th></tr>
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
                <td className="px-6 py-4 text-sm text-zinc-600">{roleName(u.roleId)}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">{u.avgRating != null ? u.avgRating.toFixed(2) : '—'}</td>
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

      <Drawer open={open} title="Add Staff" onClose={() => setOpen(false)}>
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

          {error && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{error}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={saving}>
            {saving ? 'Creating...' : 'Create Staff'}
          </Button>
        </form>
      </Drawer>

      <Drawer open={editOpen} title="Edit Staff" onClose={() => setEditOpen(false)}>
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

          {editError && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{editError}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={editSaving}>
            {editSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
