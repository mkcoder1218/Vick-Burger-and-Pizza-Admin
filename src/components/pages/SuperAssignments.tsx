import React, { useMemo, useState } from 'react';
import Button from '../ui/Button';
import { createOne, useGetAll } from '../../swr';

const USERS_RESOURCE = 'api/super-admin/users';
const ROLES_RESOURCE = 'api/roles';
const BUSINESSES_RESOURCE = 'api/super-admin/businesses';

const ASSIGN_ENDPOINT = (id: string) => `api/super-admin/users/${id}/businesses`;

type ApiUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
};

type ApiRole = { id: string; roleName: string };

type ApiBusiness = { id: string; businessName: string };

type ListResponse<T> = { success: boolean; data: T[] };

export default function SuperAssignments() {
  const { data: usersData } = useGetAll<ListResponse<ApiUser>>(USERS_RESOURCE);
  const { data: rolesData } = useGetAll<ListResponse<ApiRole>>(ROLES_RESOURCE);
  const { data: bizData } = useGetAll<ListResponse<ApiBusiness>>(BUSINESSES_RESOURCE, { limit: 500, offset: 0 });

  const users = useMemo(() => usersData?.data ?? [], [usersData]);
  const roles = useMemo(() => rolesData?.data ?? [], [rolesData]);
  const businesses = useMemo(() => bizData?.data ?? [], [bizData]);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const roleName = (roleId: string) => roles.find((r) => r.id === roleId)?.roleName ?? '';

  const adminUsers = users.filter((u) => {
    const r = roleName(u.roleId);
    return r === 'Admin' || r === 'Manager' || r === 'Super Admin';
  });

  const toggleBusiness = (id: string) => {
    setSelectedBusinessIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const saveAssignments = async () => {
    if (!selectedUserId) {
      setError('Select a user first.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await createOne(ASSIGN_ENDPOINT(selectedUserId), { businessIds: selectedBusinessIds });
      setSelectedBusinessIds([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to assign businesses');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold">Business Assignments</h3>
        <p className="text-xs text-zinc-500">Connect businesses to admins and managers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Admins</p>
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
            <option value="">Select admin</option>
            {adminUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({roleName(u.roleId)})</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">Businesses</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {businesses.map((b) => (
              <label key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-burger-orange cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBusinessIds.includes(b.id)}
                  onChange={() => toggleBusiness(b.id)}
                />
                <span className="text-sm font-medium">{b.businessName}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">{error}</div>}

      <Button variant="gold" onClick={saveAssignments} disabled={saving}>
        {saving ? 'Saving...' : 'Save Assignments'}
      </Button>
    </div>
  );
}
