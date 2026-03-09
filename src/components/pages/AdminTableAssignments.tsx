import React, { useEffect, useMemo, useState } from 'react';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { buildUrl, createOne, deleteOne, useGetAll, getToken } from '../../swr';
import { io } from 'socket.io-client';
import { mutate } from 'swr';
import { listKey } from '../../swr/hooks';

const STAFF_RESOURCE = 'api/admin/staff';
const ROLES_RESOURCE = 'api/roles';
const TABLES_RESOURCE = 'api/admin/tables';
const ASSIGN_RESOURCE = 'api/admin/table-assignments';

type ApiUser = { id: string; name: string; email: string; roleId: string };
type ApiRole = { id: string; roleName: string };
type ApiTable = { id: string; tableNumber: string };
type ApiAssignment = {
  id: string;
  tableId: string;
  waiterId: string;
  table?: { id: string; tableNumber: string };
  waiter?: { id: string; name: string; email: string; role?: { roleName: string }; avgRating?: number | null };
};

type ListResponse<T> = { success: boolean; data: T[] };

export default function AdminTableAssignments() {
  const { data: usersData, isLoading: usersLoading } = useGetAll<ListResponse<ApiUser>>(STAFF_RESOURCE);
  const { data: rolesData } = useGetAll<ListResponse<ApiRole>>(ROLES_RESOURCE);
  const { data: tablesData, isLoading: tablesLoading } = useGetAll<ListResponse<ApiTable>>(TABLES_RESOURCE);
  const { data: assignmentsData, isLoading: assignmentsLoading } = useGetAll<ListResponse<ApiAssignment>>(ASSIGN_RESOURCE);

  const users = useMemo(() => usersData?.data ?? [], [usersData]);
  const roles = useMemo(() => rolesData?.data ?? [], [rolesData]);
  const tables = useMemo(() => tablesData?.data ?? [], [tablesData]);
  const assignments = useMemo(() => assignmentsData?.data ?? [], [assignmentsData]);

  const roleName = (roleId: string) => roles.find((r) => r.id === roleId)?.roleName ?? '';
  const waiters = users.filter((u) => roleName(u.roleId) === 'Waiter');

  const [tableId, setTableId] = useState('');
  const [waiterId, setWaiterId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    const socket = io(buildUrl(''), {
      auth: token ? { token: `Bearer ${token}` } : undefined,
    });
    socket.emit('join-admin');
    const refresh = () => mutate(listKey(ASSIGN_RESOURCE));
    socket.on('TableStatusUpdated', refresh);
    socket.on('PaymentCompleted', refresh);
    return () => {
      socket.off('TableStatusUpdated', refresh);
      socket.off('PaymentCompleted', refresh);
      socket.disconnect();
    };
  }, []);

  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableId || !waiterId) {
      setError('Select table and waiter.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await createOne(ASSIGN_RESOURCE, { tableId, waiterId });
      setTableId('');
      setWaiterId('');
    } catch (err: any) {
      setError(err?.message || 'Failed to assign table');
    } finally {
      setSaving(false);
    }
  };

  const unassign = async (id: string) => {
    if (!confirm('Remove this assignment?')) return;
    try {
      await deleteOne(ASSIGN_RESOURCE, id);
    } catch (err: any) {
      alert(err?.message || 'Failed to remove assignment');
    }
  };

  const assignmentByTable = new Map(assignments.map((a) => [a.tableId, a]));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Table Assignments</h3>
        <p className="text-xs text-zinc-500">Assign tables to waiters.</p>
      </div>

      <form className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-zinc-100" onSubmit={assign}>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Table</label>
          <select value={tableId} onChange={(e) => setTableId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
            <option value="">Select table</option>
            {tables.map((t) => (
              <option key={t.id} value={t.id}>{t.tableNumber}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-burger-black/40">Waiter</label>
          <select value={waiterId} onChange={(e) => setWaiterId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
            <option value="">Select waiter</option>
            {waiters.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.email})</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="gold" className="w-full" disabled={saving}>
            {saving ? 'Assigning...' : 'Assign Table'}
          </Button>
        </div>
        {error && <div className="md:col-span-3 px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{error}</div>}
      </form>

      {(usersLoading || tablesLoading || assignmentsLoading) && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase">
            <tr><th className="px-6 py-4">Table</th><th className="px-6 py-4">Waiter</th><th className="px-6 py-4">Rating</th><th className="px-6 py-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {tables.map((t) => {
              const a = assignmentByTable.get(t.id);
              return (
                <tr key={t.id} className="hover:bg-zinc-50">
                  <td className="px-6 py-4 font-bold">{t.tableNumber}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    {a?.waiter ? `${a.waiter.name} (${a.waiter.email})` : 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">
                    {a?.waiter?.avgRating != null ? a.waiter.avgRating.toFixed(2) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    {a ? (
                      <Button variant="secondary" onClick={() => unassign(t.id)} className="text-[10px] py-2 px-4">
                        Unassign
                      </Button>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
