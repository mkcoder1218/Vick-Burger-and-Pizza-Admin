import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Plus, Trash2, QrCode } from 'lucide-react';
import Button from '../ui/Button';
import Drawer from '../ui/Drawer';
import Skeleton from '../ui/Skeleton';
import { createOne, deleteOne, updateOne, useGetAll, getToken, buildUrl } from '../../swr';
import { io } from 'socket.io-client';
import { mutate } from 'swr';
import { listKey } from '../../swr/hooks';
import { User } from '../../types';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

const TABLES_RESOURCE = 'api/admin/tables';

type ApiTable = {
  id: string;
  tableNumber: string;
  isActive: boolean;
  isAvailable: boolean;
  status?: string;
};

type ListResponse<T> = { success: boolean; data: T[] };

export default function AdminTables({ currentUser }: { currentUser: User }) {
  const businessId = currentUser.business?.id || currentUser.businessId;
  const businessName = currentUser.business?.businessName || 'Business';
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, error, isLoading } = useGetAll<ListResponse<ApiTable>>(businessId ? TABLES_RESOURCE : null);
  const tables = useMemo(() => data?.data ?? [], [data]);
  const paged = useMemo(() => tables.slice(page * limit, (page + 1) * limit), [tables, page]);

  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ApiTable | null>(null);

  const [tableNumber, setTableNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const [count, setCount] = useState('10');
  const [prefix, setPrefix] = useState('Table');
  const [bulkError, setBulkError] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  const [editNumber, setEditNumber] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editAvailable, setEditAvailable] = useState(true);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [userBaseUrl, setUserBaseUrl] = useState(() => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem('userAppBaseUrl') || 'http://localhost:4000';
  });

  useEffect(() => {
    if (!businessId) return;
    const token = getToken();
    const socket = io(buildUrl(''), {
      auth: token ? { token: token  } : undefined,
    });
    socket.emit('join-admin');
    const refresh = () => mutate(listKey(TABLES_RESOURCE));
    socket.on('TableStatusUpdated', refresh);
    return () => {
      socket.off('TableStatusUpdated', refresh);
      socket.disconnect();
    };
  }, [businessId]);

  const resetCreate = () => {
    setTableNumber('');
    setIsActive(true);
    setIsAvailable(true);
    setErrorMsg('');
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSaving(true);

    try {
      await createOne(TABLES_RESOURCE, {
        tableNumber,
        isActive,
        isAvailable,
      });
      setOpen(false);
      resetCreate();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create table');
    } finally {
      setSaving(false);
    }
  };

  const submitBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    setBulkSaving(true);

    try {
      await createOne(`${TABLES_RESOURCE}/bulk`, {
        count: Number(count),
        prefix: prefix || undefined,
      });
      setBulkOpen(false);
    } catch (err: any) {
      setBulkError(err?.message || 'Failed to create tables');
    } finally {
      setBulkSaving(false);
    }
  };

  const openEdit = (t: ApiTable) => {
    setEditing(t);
    setEditNumber(t.tableNumber);
    setEditActive(t.isActive);
    setEditAvailable(t.isAvailable);
    setEditError('');
    setEditOpen(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setEditError('');
    setEditSaving(true);

    try {
      await updateOne(TABLES_RESOURCE, editing.id, {
        tableNumber: editNumber,
        isActive: editActive,
        isAvailable: editAvailable,
      });
      setEditOpen(false);
      setEditing(null);
    } catch (err: any) {
      setEditError(err?.message || 'Failed to update table');
    } finally {
      setEditSaving(false);
    }
  };

  const removeTable = async (id: string) => {
    if (!confirm('Delete this table?')) return;
    try {
      await deleteOne(TABLES_RESOURCE, id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete table');
    }
  };

  const tableQrUrl = (tableId: string) => `${userBaseUrl.replace(/\/$/, '')}/?tableId=${tableId}`;

  const exportQrPdf = async (table: ApiTable) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(tableQrUrl(table.id), { width: 512, margin: 2 });
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Table ${table.tableNumber}`, 14, 18);
      doc.setFontSize(10);
      doc.text(tableQrUrl(table.id), 14, 26);
      doc.addImage(qrDataUrl, 'PNG', 30, 35, 150, 150);
      doc.save(`table-${table.tableNumber}-qr.pdf`);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate QR PDF');
    }
  };

  if (!businessId) {
    return <div className="text-sm text-zinc-500">No business assigned to this account.</div>;
  }

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || 'table';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Tables</h3>
        <div className="flex gap-2">
          <Button onClick={() => setBulkOpen(true)} variant="secondary">Bulk Create</Button>
          <Button onClick={() => setOpen(true)} className="flex items-center gap-2"><Plus size={18} /> Create Table</Button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-zinc-200 p-4">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">User App Base URL (for QR links)</label>
        <div className="mt-2 flex gap-2">
          <input
            value={userBaseUrl}
            onChange={(e) => setUserBaseUrl(e.target.value)}
            placeholder="http://localhost:4000"
            className="w-full px-4 py-3 rounded-2xl border-2 border-zinc-200 focus:outline-none focus:border-burger-orange"
          />
          <Button
            variant="secondary"
            onClick={() => {
              window.localStorage.setItem('userAppBaseUrl', userBaseUrl);
              alert('User app base URL saved for QR generation.');
            }}
          >
            Save
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}
      {error && <div className="text-sm text-red-500">Failed to load tables</div>}

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase">
            <tr><th className="px-6 py-4">Table</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Active</th><th className="px-6 py-4">Available</th><th className="px-6 py-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {paged.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4 font-bold">{t.tableNumber}</td>
                <td className="px-6 py-4 text-sm text-zinc-600 capitalize">{t.status ?? 'waiting'}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">{t.isActive ? 'Yes' : 'No'}</td>
                <td className="px-6 py-4 text-sm text-zinc-600">{t.isAvailable ? 'Yes' : 'No'}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => exportQrPdf(t)} className="text-zinc-400 hover:text-black" title="Export QR PDF">
                      <QrCode size={16} />
                    </button>
                    <button onClick={() => openEdit(t)} className="text-zinc-400 hover:text-black"><Edit2 size={16} /></button>
                    <button onClick={() => removeTable(t.id)} className="text-zinc-400 hover:text-red-500"><Trash2 size={16} /></button>
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
        <Button variant="secondary" onClick={() => setPage((p) => (p + 1))} disabled={(page + 1) * limit >= tables.length}>Next</Button>
      </div>

      <Drawer open={open} title="Create Table" onClose={() => setOpen(false)}>
        <form className="space-y-5" onSubmit={submitCreate}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Table Name/Number</label>
            <input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Active</label>
              <select value={isActive ? 'true' : 'false'} onChange={(e) => setIsActive(e.target.value === 'true')} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Available</label>
              <select value={isAvailable ? 'true' : 'false'} onChange={(e) => setIsAvailable(e.target.value === 'true')} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>

          {errorMsg && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{errorMsg}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={saving}>
            {saving ? 'Creating...' : 'Create Table'}
          </Button>
        </form>
      </Drawer>

      <Drawer open={bulkOpen} title="Bulk Create Tables" onClose={() => setBulkOpen(false)}>
        <form className="space-y-5" onSubmit={submitBulk}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Count</label>
            <input value={count} onChange={(e) => setCount(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Prefix</label>
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPrefix(slugify(businessName))}
              >
                Use Business Name
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPrefix(`${slugify(businessName)}-${Math.floor(Math.random() * 900 + 100)}`)}
              >
                Randomize
              </Button>
            </div>
            <p className="text-[10px] text-burger-black/40 font-bold uppercase tracking-widest">Creates names like "{prefix || 'Table'}-1"</p>
          </div>

          {bulkError && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{bulkError}</div>}

          <Button type="submit" variant="gold" className="w-full" disabled={bulkSaving}>
            {bulkSaving ? 'Creating...' : 'Create Tables'}
          </Button>
        </form>
      </Drawer>

      <Drawer open={editOpen} title="Edit Table" onClose={() => setEditOpen(false)}>
        <form className="space-y-5" onSubmit={submitEdit}>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Table Name/Number</label>
            <input value={editNumber} onChange={(e) => setEditNumber(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Active</label>
              <select value={editActive ? 'true' : 'false'} onChange={(e) => setEditActive(e.target.value === 'true')} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Available</label>
              <select value={editAvailable ? 'true' : 'false'} onChange={(e) => setEditAvailable(e.target.value === 'true')} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
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
