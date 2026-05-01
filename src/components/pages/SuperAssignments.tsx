import React, { useMemo, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Hash,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import Button from "../ui/Button";
import { createOne, deleteOne, useGetAll } from "../../swr";
import { mutate } from "swr";

const USERS_RESOURCE = "api/super-admin/users";
const ROLES_RESOURCE = "api/roles";
const BUSINESSES_RESOURCE = "api/super-admin/businesses";
const ASSIGNMENTS_RESOURCE = "api/super-admin/assignments";

const ASSIGN_ENDPOINT = (id: string) =>
  `api/super-admin/users/${id}/businesses`;

type ApiUser = {
  id: string;
  name: string;
  email: string;
  roleId: string;
};

type ApiRole = { id: string; roleName: string };

type ApiBusiness = { id: string; businessName: string };

type ApiAssignment = {
  id: string;
  userId: string;
  businessId: string;
  user: { name: string; email: string };
  business: { businessName: string };
  createdAt: string;
};

type ListResponse<T> = {
  success: boolean;
  data: T[];
  meta?: { count: number; limit: number; offset: number };
};

export default function SuperAssignments() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data: usersData } = useGetAll<ListResponse<ApiUser>>(USERS_RESOURCE);
  const { data: rolesData } = useGetAll<ListResponse<ApiRole>>(ROLES_RESOURCE);
  const { data: bizData } = useGetAll<ListResponse<ApiBusiness>>(
    BUSINESSES_RESOURCE,
    { limit: 500, offset: 0 },
  );
  const { data: assignmentsData, isLoading: loadingAssignments } = useGetAll<
    ListResponse<ApiAssignment>
  >(ASSIGNMENTS_RESOURCE, { q: q || undefined, limit, offset: page * limit });

  // Global assignments to identify taken businesses (up to 1000)
  const { data: allAssignmentsData } = useGetAll<ListResponse<ApiAssignment>>(
    ASSIGNMENTS_RESOURCE,
    { limit: 1000, offset: 0 },
  );

  const users = useMemo(() => usersData?.data ?? [], [usersData]);
  const roles = useMemo(() => rolesData?.data ?? [], [rolesData]);
  const businesses = useMemo(() => bizData?.data ?? [], [bizData]);
  const assignments = useMemo(
    () => assignmentsData?.data ?? [],
    [assignmentsData],
  );
  const allAssignments = useMemo(
    () => allAssignmentsData?.data ?? [],
    [allAssignmentsData],
  );
  const totalAssignments = assignmentsData?.meta?.count ?? 0;

  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [assignmentToUnassign, setAssignmentToUnassign] =
    useState<ApiAssignment | null>(null);
  const [unassigning, setUnassigning] = useState(false);

  const availableBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      // Find who this business is assigned to
      const assignment = allAssignments.find((a) => a.businessId === b.id);
      // If ANY assignment exists, hide it from the selection list
      return !assignment;
    });
  }, [businesses, allAssignments]);

  const roleName = (roleId: string) =>
    roles.find((r) => r.id === roleId)?.roleName ?? "";

  const adminUsers = users.filter((u) => {
    const r = roleName(u.roleId);
    return r === "Admin" || r === "Manager" || r === "Super Admin";
  });

  const toggleBusiness = (id: string) => {
    setSelectedBusinessIds((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id],
    );
  };

  const saveAssignments = async () => {
    if (!selectedUserId) {
      setError("Select a user first.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await createOne(ASSIGN_ENDPOINT(selectedUserId), {
        businessIds: [...selectedBusinessIds], // Send only newly selected ones
      });
      setSelectedBusinessIds([]);
      // Refresh assignments data
      mutate((key) => Array.isArray(key) && key[0] === ASSIGNMENTS_RESOURCE);
    } catch (err: any) {
      setError(err?.message || "Failed to assign businesses");
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    if (!assignmentToUnassign) return;
    setUnassigning(true);
    try {
      await deleteOne(ASSIGNMENTS_RESOURCE, assignmentToUnassign.id);
      mutate((key) => Array.isArray(key) && key[0] === ASSIGNMENTS_RESOURCE);
      setAssignmentToUnassign(null);
    } catch (err: any) {
      setError(err?.message || "Failed to unassign business");
    } finally {
      setUnassigning(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* Confirmation Modal */}
      {assignmentToUnassign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-burger-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !unassigning && setAssignmentToUnassign(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h4 className="text-2xl font-black text-center text-burger-black mb-2">
                Unassign Business?
              </h4>
              <p className="text-zinc-500 text-center text-sm mb-8">
                This will remove{" "}
                <span className="font-bold text-burger-black">
                  "{assignmentToUnassign.business.businessName}"
                </span>{" "}
                from{" "}
                <span className="font-bold text-burger-black">
                  {assignmentToUnassign.user.name}
                </span>
                .
              </p>

              <div className="flex flex-col gap-3">
                <Button
                  variant="danger"
                  className="w-full !py-4"
                  onClick={handleUnassign}
                  disabled={unassigning}
                >
                  {unassigning ? "Removing..." : "Yes, Unassign"}
                </Button>
                <Button
                  variant="secondary"
                  className="w-full !py-4"
                  onClick={() => setAssignmentToUnassign(null)}
                  disabled={unassigning}
                >
                  Cancel
                </Button>
              </div>
            </div>
            <button
              onClick={() => setAssignmentToUnassign(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-burger-black hover:bg-zinc-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold">Business Assignments</h3>
          <p className="text-xs text-zinc-500">
            Connect businesses to admins and managers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
              Admins
            </p>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
            >
              <option value="">Select admin</option>
              {adminUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({roleName(u.roleId)})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-zinc-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3">
              Businesses
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableBusinesses.map((b) => (
                <label
                  key={b.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-burger-orange cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedBusinessIds.includes(b.id)}
                    onChange={() => toggleBusiness(b.id)}
                  />
                  <span className="text-sm font-medium">{b.businessName}</span>
                </label>
              ))}
              {availableBusinesses.length === 0 && (
                <p className="text-sm text-zinc-400 italic py-4">
                  No available businesses found.
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">
            {error}
          </div>
        )}

        <Button variant="gold" onClick={saveAssignments} disabled={saving}>
          {saving ? "Saving..." : "Save Assignments"}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold">Assigned Items</h3>
            <p className="text-xs text-zinc-500">
              View and manage existing assignments.
            </p>
          </div>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search assignments..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              className="w-full pl-11 pr-4 py-2 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    User
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Email
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Business
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Assigned At
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loadingAssignments ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="h-4 bg-zinc-100 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-zinc-100 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-zinc-100 rounded w-28"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-zinc-100 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-zinc-100 rounded w-16"></div>
                      </td>
                    </tr>
                  ))
                ) : assignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-zinc-500 text-sm italic"
                    >
                      No assignments found
                    </td>
                  </tr>
                ) : (
                  assignments.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-zinc-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-burger-black">
                          {a.user?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-zinc-500">
                          {a.user?.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-burger-orange/10 flex items-center justify-center">
                            <Hash size={12} className="text-burger-orange" />
                          </div>
                          <span className="text-sm font-medium">
                            {a.business?.businessName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-zinc-400">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setAssignmentToUnassign(a)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                          Unassign
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium">
              Showing {Math.min(totalAssignments, page * limit + 1)} to{" "}
              {Math.min(totalAssignments, (page + 1) * limit)} of{" "}
              {totalAssignments} assignments
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loadingAssignments}
                className="p-2 rounded-xl hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(totalAssignments / limit) })
                  .map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                        page === i
                          ? "bg-burger-orange text-white shadow-lg shadow-burger-orange/20"
                          : "hover:bg-zinc-100 text-zinc-400"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))
                  .slice(
                    Math.max(0, page - 2),
                    Math.min(Math.ceil(totalAssignments / limit), page + 3),
                  )}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={
                  (page + 1) * limit >= totalAssignments || loadingAssignments
                }
                className="p-2 rounded-xl hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
