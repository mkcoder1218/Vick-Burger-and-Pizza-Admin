import React, { useMemo, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Drawer from '../ui/Drawer';
import Skeleton from '../ui/Skeleton';
import { createOne, deleteOne, updateOne, useGetAll } from '../../swr';

const ROLES_RESOURCE = 'api/roles';

type ApiRole = { id: string; roleName: string; description?: string | null };

type ListResponse<T> = { success: boolean; data: T[] };

export default function SuperRoles() {
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, error, isLoading } = useGetAll<ListResponse<ApiRole>>(ROLES_RESOURCE);
  const roles = useMemo(() => data?.data ?? [], [data]);
  const paged = useMemo(() => roles.slice(page * limit, (page + 1) * limit), [roles, page]);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ApiRole | null>(null);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const resetCreate = () => {
    setName('');
    setDesc('');
    setErrorMsg('');
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      await createOne(ROLES_RESOURCE, { roleName: name, description: desc || undefined });
      setOpen(false);
      resetCreate();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (r: ApiRole) => {
    setEditing(r);
    setEditName(r.roleName);
    setEditDesc(r.description || '');
    setEditError('');
    setEditOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError('');
    setEditSaving(true);

    try {
      await updateOne(ROLES_RESOURCE, editing.id, { roleName: editName, description: editDesc || undefined });
      setEditOpen(false);
      setEditing(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update role');
    } finally {
      setEditSaving(false);
    }
  };

  const removeRole = async (id: string) => {
    if (!confirm('Delete this role?')) return;
    try {
      await deleteOne(ROLES_RESOURCE, id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Roles</h3>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2"><Plus size={18} /> Create Role</Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}
      {error && <div className="text-sm text-red-500">Failed to load roles</div>}

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase">
            <tr><th className="px-6 py-4">Role</th><th className="px-6 py-4">Description</th><th className="px-6 py-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {paged.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4 font-bold">{r.roleName}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">{r.description || '—'}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="text-zinc-400 hover:text-black"><Edit2 size={16} /></button>
                    <button onClick={() => removeRole(r.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
        <div className="text-xs text-zinc-500">Page {page + 1}</div>
        <Button variant="secondary" onClick={() => setPage((p) => (p + 1))} disabled={(page + 1) * limit >= roles.length}>Next</Button>
      </div>

      <Drawer open={open} title="Create Role" onClose={() => setOpen(false)}>
        <form className="space-y-5" onSubmit={submitCreate}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Role Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" rows={4} />
          </div>

          {errorMsg && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{errorMsg}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={saving}>
            {saving ? 'Creating...' : 'Create Role'}
          </Button>
        </form>
      </Drawer>

      <Drawer open={editOpen} title="Edit Role" onClose={() => setEditOpen(false)}>
        <form className="space-y-5" onSubmit={submitEdit}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Role Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Description</label>
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" rows={4} />
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
