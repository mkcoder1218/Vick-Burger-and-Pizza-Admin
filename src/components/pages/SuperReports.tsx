import React, { useMemo, useState } from 'react';
import Button from '../ui/Button';
import { buildUrl, getToken, useGetAll } from '../../swr';

const REPORT_RESOURCE = 'api/super-admin/reports/sales';
const BUSINESS_RESOURCE = 'api/super-admin/businesses';

const periods = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

type Business = { id: string; businessName: string };

type SalesReport = {
  period: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: string;
  businesses: { businessId: string; businessName: string; totalOrders: number; totalRevenue: string }[];
};

type ApiResponse<T> = { success: boolean; data: T };

type ApiListResponse<T> = { success: boolean; data: T[] };

export default function SuperReports() {
  const [period, setPeriod] = useState('weekly');
  const [businessId, setBusinessId] = useState('');
  const [limit, setLimit] = useState('');
  const [offset, setOffset] = useState('0');

  const { data: reportData, isLoading } = useGetAll<ApiResponse<SalesReport>>(REPORT_RESOURCE, {
    period,
    businessId: businessId || undefined,
    ...(limit ? { limit } : {}),
    ...(offset ? { offset } : {}),
  });

  const { data: businessesData } = useGetAll<ApiListResponse<Business>>(BUSINESS_RESOURCE, { limit: 500, offset: 0 });
  const businesses = useMemo(() => businessesData?.data ?? [], [businessesData]);
  const report = reportData?.data;

  const exportCsv = async () => {
    const token = getToken();
    const params = new URLSearchParams({
      period,
      ...(businessId ? { businessId } : {}),
      ...(limit ? { limit } : {}),
      ...(offset ? { offset } : {}),
    });

    const res = await fetch(buildUrl(`/api/super-admin/reports/sales/export?${params.toString()}`), {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (!res.ok) {
      return alert('Failed to export');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consolidated-report-${period}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-bold">Consolidated Reports</h3>
          <p className="text-xs text-zinc-500">Filter the report and export as CSV.</p>
        </div>
        <Button onClick={exportCsv} variant="gold">Export CSV</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Period</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full mt-2 px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
            {periods.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Business</label>
          <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="w-full mt-2 px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange">
            <option value="">All</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.businessName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Limit</label>
          <input value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="500" className="w-full mt-2 px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Offset</label>
          <input value={offset} onChange={(e) => setOffset(e.target.value)} placeholder="0" className="w-full mt-2 px-4 py-3 rounded-2xl border-2 border-burger-black/10 focus:outline-none focus:border-burger-orange" />
        </div>
      </div>

      {isLoading && <div className="text-sm text-zinc-500">Loading report...</div>}

      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase">
            <tr>
              <th className="px-6 py-4">Business</th>
              <th className="px-6 py-4">Orders</th>
              <th className="px-6 py-4">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {report?.businesses?.map((b) => (
              <tr key={b.businessId}>
                <td className="px-6 py-4 font-medium">{b.businessName}</td>
                <td className="px-6 py-4">{b.totalOrders}</td>
                <td className="px-6 py-4">ETB {Number(b.totalRevenue).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400">Total Orders</p>
            <p className="text-2xl font-black">{report.totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-zinc-100">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400">Total Revenue</p>
            <p className="text-2xl font-black">ETB {Number(report.totalRevenue).toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-zinc-100">
            <p className="text-[10px] uppercase tracking-widest text-zinc-400">Period</p>
            <p className="text-2xl font-black">{report.period}</p>
          </div>
        </div>
      )}
    </div>
  );
}
