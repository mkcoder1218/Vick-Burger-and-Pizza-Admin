import React, { useMemo, useState } from 'react';
import { Edit2, Plus, Save, Sliders, Trash2, X } from 'lucide-react';
import Button from '../ui/Button';
import Drawer from '../ui/Drawer';
import Skeleton from '../ui/Skeleton';
import { buildUrl, createOne, deleteOne, getToken, updateOne, useGetAll } from '../../swr';
import { User } from '../../types';

const MENU_RESOURCE = 'api/admin/menu-items';
const CATEGORIES_RESOURCE = 'api/categories';

const listByBusiness = (businessId: string) => `api/admin/menu-items/business/${businessId}`;

type ApiMenuItem = {
  id: string;
  itemName: string;
  description?: string | null;
  price: string;
  imageUrl?: string | null;
  availabilityStatus: boolean;
  itemType?: string | null;
  directToWaiter?: boolean;
  categoryId: string;
  businessId: string;
};

type ApiCategory = { id: string; categoryName: string; businessId: string };

type ListResponse<T> = { success: boolean; data: T[] };

export default function AdminMenu({ currentUser }: { currentUser: User }) {
  const businessId = currentUser.business?.id || currentUser.businessId;
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data: menuData, error, isLoading } = useGetAll<ListResponse<ApiMenuItem>>(businessId ? listByBusiness(businessId) : '');
  const { data: categoriesData } = useGetAll<ListResponse<ApiCategory>>(CATEGORIES_RESOURCE);

  const menuItems = useMemo(() => menuData?.data ?? [], [menuData]);
  const pagedItems = useMemo(() => menuItems.slice(page * limit, (page + 1) * limit), [menuItems, page]);
  const categories = useMemo(() => {
    const all = categoriesData?.data ?? [];
    return businessId ? all.filter((c) => c.businessId === businessId) : all;
  }, [categoriesData, businessId]);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ApiMenuItem | null>(null);

  const [inlineId, setInlineId] = useState<string | null>(null);
  const [inlineName, setInlineName] = useState('');
  const [inlinePrice, setInlinePrice] = useState('');

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [availability, setAvailability] = useState(true);
  const [itemType, setItemType] = useState('');
  const [directToWaiter, setDirectToWaiter] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editAvailability, setEditAvailability] = useState(true);
  const [editItemType, setEditItemType] = useState('');
  const [editDirectToWaiter, setEditDirectToWaiter] = useState(false);
  const [editLogo, setEditLogo] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [editError, setEditError] = useState('');
  const [editingSaving, setEditingSaving] = useState(false);

  const uploadImage = async (file?: File | null) => {
    if (!file) return undefined;
    const token = getToken();
    const form = new FormData();
    form.append('file', file);

    const res = await fetch(buildUrl('/api/files'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || 'Upload failed');
    }

    return data?.data?.id as string | undefined;
  };

  const resetCreate = () => {
    setName('');
    setDesc('');
    setPrice('');
    setCategoryId('');
    setAvailability(true);
    setItemType('');
    setDirectToWaiter(false);
    setLogo(null);
    setLogoPreview(null);
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
      const fileId = await uploadImage(logo);
      const imageUrl = fileId ? `/uploads/${fileId}` : undefined;

      await createOne(MENU_RESOURCE, {
        itemName: name,
        description: desc || undefined,
        price,
        imageUrl,
        availabilityStatus: availability,
        itemType: itemType || undefined,
        directToWaiter,
        categoryId,
        businessId,
      });

      setOpen(false);
      resetCreate();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create item');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: ApiMenuItem) => {
    setEditing(item);
    setEditName(item.itemName);
    setEditDesc(item.description || '');
    setEditPrice(item.price);
    setEditCategoryId(item.categoryId);
    setEditAvailability(item.availabilityStatus);
    setEditItemType(item.itemType || '');
    setEditDirectToWaiter(Boolean(item.directToWaiter));
    setEditLogo(null);
    setEditLogoPreview(null);
    setEditError('');
    setEditOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError('');
    setEditingSaving(true);

    try {
      const fileId = await uploadImage(editLogo);
      const imageUrl = fileId ? `/uploads/${fileId}` : undefined;

      await updateOne(MENU_RESOURCE, editing.id, {
        itemName: editName,
        description: editDesc || undefined,
        price: editPrice,
        availabilityStatus: editAvailability,
        itemType: editItemType || undefined,
        directToWaiter: editDirectToWaiter,
        categoryId: editCategoryId,
        ...(imageUrl ? { imageUrl } : {}),
      });

      setEditOpen(false);
      setEditing(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update item');
    } finally {
      setEditingSaving(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await deleteOne(MENU_RESOURCE, id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete item');
    }
  };

  const toggleAvailability = async (item: ApiMenuItem) => {
    try {
      await updateOne(MENU_RESOURCE, item.id, { availabilityStatus: !item.availabilityStatus });
    } catch (err: any) {
      alert(err?.message || 'Failed to update availability');
    }
  };

  const startInlineEdit = (item: ApiMenuItem) => {
    setInlineId(item.id);
    setInlineName(item.itemName);
    setInlinePrice(item.price);
  };

  const cancelInline = () => {
    setInlineId(null);
    setInlineName('');
    setInlinePrice('');
  };

  const saveInline = async (item: ApiMenuItem) => {
    try {
      await updateOne(MENU_RESOURCE, item.id, {
        itemName: inlineName,
        price: inlinePrice,
      });
      cancelInline();
    } catch (err: any) {
      alert(err?.message || 'Failed to update item');
    }
  };

  if (!businessId) {
    return <div className="text-sm text-zinc-500">No business assigned to this account.</div>;
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h3 className="font-serif text-3xl text-zinc-900">Menu Curation</h3>
        <Button variant="gold" onClick={() => setOpen(true)} className="flex items-center gap-2"><Plus size={18} /> New Creation</Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-zinc-100">
              <div className="flex gap-6">
                <Skeleton className="h-32 w-32 rounded-3xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-sm text-red-500">Failed to load menu</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {pagedItems.map((item) => {
          const isInline = inlineId === item.id;
          return (
            <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 flex gap-6 hover:shadow-xl hover:shadow-black/5 transition-all duration-500 group">
              <div className="relative w-32 h-32 overflow-hidden rounded-3xl">
                <img src={buildUrl(item.imageUrl || '')} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                {!item.availabilityStatus && <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center text-[8px] font-bold text-white uppercase tracking-widest">Inactive</div>}
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div className="flex justify-between items-start">
                  <div>
                    {isInline ? (
                      <div className="space-y-2">
                        <input value={inlineName} onChange={(e) => setInlineName(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-zinc-200" />
                        <input value={inlinePrice} onChange={(e) => setInlinePrice(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-zinc-200" />
                      </div>
                    ) : (
                      <>
                        <h4 className="font-serif text-xl text-zinc-900">{item.itemName}</h4>
                        <p className="text-[10px] text-[#C5A059] uppercase font-bold tracking-widest mt-1">{categories.find((c) => c.id === item.categoryId)?.categoryName || '—'}</p>
                      </>
                    )}
                  </div>
                  {!isInline && <span className="font-bold text-zinc-900">ETB {Number(item.price).toFixed(2)}</span>}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => toggleAvailability(item)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                      item.availabilityStatus ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${item.availabilityStatus ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                    {item.availabilityStatus ? 'Available' : 'Unavailable'}
                  </button>
                  <div className="flex gap-2">
                    {isInline ? (
                      <>
                        <button onClick={() => saveInline(item)} className="p-2 text-emerald-600 hover:text-emerald-700"><Save size={18} /></button>
                        <button onClick={cancelInline} className="p-2 text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startInlineEdit(item)} className="p-2 text-zinc-300 hover:text-zinc-900 transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => openEdit(item)} className="p-2 text-zinc-300 hover:text-zinc-900 transition-colors"><Sliders size={18} /></button>
                        <button onClick={() => removeItem(item.id)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>Prev</Button>
        <div className="text-xs text-zinc-500">Page {page + 1}</div>
        <Button variant="secondary" onClick={() => setPage((p) => (p + 1))} disabled={(page + 1) * limit >= menuItems.length}>Next</Button>
      </div>

      <Drawer open={open} title="Create Menu Item" onClose={() => setOpen(false)}>
        <form className="space-y-5" onSubmit={submitCreate}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Item Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Description</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" rows={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Price</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
            </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Item Type</label>
            <input value={itemType} onChange={(e) => setItemType(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" placeholder="e.g. Beverage" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Direct To Waiter</label>
            <select value={directToWaiter ? 'yes' : 'no'} onChange={(e) => setDirectToWaiter(e.target.value === 'yes')} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Availability</label>
              <select value={availability ? 'true' : 'false'} onChange={(e) => setAvailability(e.target.value === 'true')} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Image</label>
              <label className="group block border-2 border-dashed border-burger-black/10 rounded-2xl p-4 cursor-pointer hover:border-burger-orange transition">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setLogo(f);
                    setLogoPreview(f ? URL.createObjectURL(f) : null);
                  }}
                />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden flex items-center justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} className="w-full h-full object-cover" alt="preview" />
                    ) : (
                      <span className="text-xs font-bold text-zinc-400">No Image</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold">Choose image</p>
                    <p className="text-xs text-zinc-500">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {errorMsg && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{errorMsg}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={saving}>
            {saving ? 'Creating...' : 'Create Item'}
          </Button>
        </form>
      </Drawer>

      <Drawer open={editOpen} title="Edit Menu Item" onClose={() => setEditOpen(false)}>
        <form className="space-y-5" onSubmit={submitEdit}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Item Name</label>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Description</label>
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" rows={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Price</label>
              <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
            </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Category</label>
            <select value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Item Type</label>
            <input value={editItemType} onChange={(e) => setEditItemType(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" placeholder="e.g. Beverage" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Direct To Waiter</label>
            <select value={editDirectToWaiter ? 'yes' : 'no'} onChange={(e) => setEditDirectToWaiter(e.target.value === 'yes')} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Availability</label>
              <select value={editAvailability ? 'true' : 'false'} onChange={(e) => setEditAvailability(e.target.value === 'true')} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Image</label>
              <label className="group block border-2 border-dashed border-burger-black/10 rounded-2xl p-4 cursor-pointer hover:border-burger-orange transition">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setEditLogo(f);
                    setEditLogoPreview(f ? URL.createObjectURL(f) : null);
                  }}
                />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 overflow-hidden flex items-center justify-center">
                    {editLogoPreview ? (
                      <img src={editLogoPreview} className="w-full h-full object-cover" alt="preview" />
                    ) : (
                      <span className="text-xs font-bold text-zinc-400">No Image</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold">Choose image</p>
                    <p className="text-xs text-zinc-500">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {editError && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{editError}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={editingSaving}>
            {editingSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
