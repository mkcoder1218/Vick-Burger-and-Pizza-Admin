import React, { useMemo, useState } from "react";
import Skeleton from "../ui/Skeleton";
import { useGetAll } from "../../swr";
import { User } from "../../types";

const REPORT_RESOURCE = "api/reports/sales";

const periods = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

type SalesReport = {
  period: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: string;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    totalQuantity: number;
    totalRevenue: string;
  }[];
};

type ApiResponse<T> = { success: boolean; data: T };

export default function AdminReports({ currentUser }: { currentUser: User }) {
  const isSuperAdmin = currentUser.role === "super_admin";
  const businessId = currentUser.business?.id || currentUser.businessId;
  const [period, setPeriod] = useState("weekly");

  const { data, isLoading } = useGetAll<ApiResponse<SalesReport>>(
    businessId || isSuperAdmin ? REPORT_RESOURCE : null,
    { period, businessId },
  );
  const report = data?.data;

  if (!businessId && !isSuperAdmin) {
    return (
      <div className="text-sm text-zinc-500">
        No business assigned to this account.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Sales Reports</h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange"
        >
          {periods.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase">
            <tr>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Quantity</th>
              <th className="px-6 py-4">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {report?.categoryBreakdown?.map((c) => (
              <tr key={c.categoryId}>
                <td className="px-6 py-4 font-medium">{c.categoryName}</td>
                <td className="px-6 py-4">{c.totalQuantity}</td>
                <td className="px-6 py-4">
                  ETB {Number(c.totalRevenue).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400">
              Total Orders
            </p>
            <p className="text-2xl font-black">{report.totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-zinc-100">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400">
              Total Revenue
            </p>
            <p className="text-2xl font-black">
              ETB {Number(report.totalRevenue).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
