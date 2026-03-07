import React, { useMemo, useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Drawer from '../ui/Drawer';
import Skeleton from '../ui/Skeleton';
import { createOne, deleteOne, updateOne, useGetAll } from '../../swr';
import { User } from '../../types';

const CATEGORIES_RESOURCE = 'api/categories';

type ApiCategory = { id: string; categoryName: string; description?: string | null; businessId: string };

type ListResponse<T> = { success: boolean; data: T[] };

export default function AdminCategories({ currentUser }: { currentUser: User }) {
  const businessId = currentUser.business?.id || currentUser.businessId;
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, error, isLoading } = useGetAll<ListResponse<ApiCategory>>(CATEGORIES_RESOURCE);
  const categories = useMemo(() => {
    const all = data?.data ?? [];
    const filtered = businessId ? all.filter((c) => c.businessId === businessId) : all;
    return filtered;
  }, [data, businessId]);
  const paged = useMemo(() => categories.slice(page * limit, (page + 1) * limit), [categories, page]);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ApiCategory | null>(null);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const resetCreate = () => {
    setName('');
    setDesc('');
    setErrorMsg('');
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) {
      setErrorMsg('No business assigned.');
      return;
    }
    setErrorMsg('');
    setSaving(true);

    try {
      await createOne(CATEGORIES_RESOURCE, {
        categoryName: name,
        description: desc || undefined,
        businessId,
      });
      setOpen(false);
      resetCreate();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c: ApiCategory) => {
    setEditing(c);
    setEditName(c.categoryName);
    setEditDesc(c.description || '');
    setEditError('');
    setEditOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError('');
    setEditSaving(true);

    try {
      await updateOne(CATEGORIES_RESOURCE, editing.id, {
        categoryName: editName,
        description: editDesc || undefined,
      });
      setEditOpen(false);
      setEditing(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update category');
    } finally {
      setEditSaving(false);
    }
  };

  const removeCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteOne(CATEGORIES_RESOURCE, id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete category');
    }
  };

  if (!businessId) {
    return <div className="text-sm text-zinc-500">No business assigned to this account.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Categories</h3>
        <Button onClick={() => setOpen(true)} className="flex items-center gap-2"><Plus size={18} /> Create Category</Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}
      {error && <div className="text-sm text-red-500">Failed to load categories</div>}

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase">
            <tr><th className="px-6 py-4">Category</th><th className="px-6 py-4">Description</th><th className="px-6 py-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {paged.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4 font-bold">{c.categoryName}</td>
                <td className="px-6 py-4 text-sm text-zinc-500">{c.description || '—'}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-zinc-400 hover:text-black"><Edit2 size={16} /></button>
                    <button onClick={() => removeCategory(c.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={16} /></button>
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
        <Button variant="secondary" onClick={() => setPage((p) => (p + 1))} disabled={(page + 1) * limit >= categories.length}>Next</Button>
      </div>

      <Drawer open={open} title="Create Category" onClose={() => setOpen(false)}>
        <form className="space-y-5" onSubmit={submitCreate}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Category Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" rows={3} />
          </div>

          {errorMsg && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{errorMsg}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={saving}>
            {saving ? 'Creating...' : 'Create Category'}
          </Button>
        </form>
      </Drawer>

      <Drawer open={editOpen} title="Edit Category" onClose={() => setEditOpen(false)}>
        <form className="space-y-5" onSubmit={submitEdit}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Category Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Description</label>
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" rows={3} />
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
