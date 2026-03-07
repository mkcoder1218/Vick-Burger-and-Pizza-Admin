import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ClipboardList, TrendingUp, Users as UsersIcon } from 'lucide-react';
import { ChartContainer, ChartLegend, ChartTooltipLabel, ChartTooltipValue } from '../ui/chart';
import { useGetAll } from '../../swr';

const COLORS = {
  sales: '#C5A059',
  orders: '#111827',
};

type SalesReport = {
  period: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: string;
  businesses: { businessId: string; businessName: string; totalOrders: number; totalRevenue: string }[];
};

type SalesSeriesPoint = { date: string; totalRevenue: string; totalOrders: number };

type RecentActivity = { id: string; tableNumber: string; businessName: string; totalAmount: string; status: string; createdAt: string };

type ApiResponse<T> = { success: boolean; data: T };

type ApiListResponse<T> = { success: boolean; data: T[] };

export default function SuperDashboard() {
  const { data: salesReport } = useGetAll<ApiResponse<SalesReport>>('api/super-admin/reports/sales', { period: 'weekly' });
  const { data: salesSeries } = useGetAll<ApiListResponse<SalesSeriesPoint>>('api/super-admin/reports/sales-series', { period: 'weekly' });
  const { data: recentActivity } = useGetAll<ApiListResponse<RecentActivity>>('api/super-admin/reports/recent-activity', { limit: 5 });

  const report = salesReport?.data;
  const series = salesSeries?.data ?? [];
  const activity = recentActivity?.data ?? [];

  const totalSales = Number(report?.totalRevenue || 0);
  const totalOrders = Number(report?.totalOrders || 0);
  const totalBusinesses = report?.businesses?.length || 0;

  const ordersByBusiness = useMemo(() => {
    return (report?.businesses ?? []).map((b) => ({ label: b.businessName, value: b.totalOrders }));
  }, [report]);

  const salesSeriesData = useMemo(() => {
    return series.map((p) => ({ label: p.date.slice(5), value: Number(p.totalRevenue) }));
  }, [series]);

  const topBusiness = useMemo(() => {
    const sorted = [...(report?.businesses ?? [])].sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue));
    return sorted[0]?.businessName || '—';
  }, [report]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: 'Network Sales', value: `ETB ${totalSales.toFixed(2)}`, icon: TrendingUp },
          { label: 'Active Orders', value: totalOrders, icon: ClipboardList },
          { label: 'Total Businesses', value: totalBusinesses, icon: UsersIcon },
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
            <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-[#C5A059] mb-6">
              <s.icon size={24} />
            </div>
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-3xl font-serif text-[#C5A059]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Weekly Sales</h3>
              <p className="text-xs text-zinc-400">Consolidated revenue overview</p>
            </div>
            <ChartLegend items={[{ label: 'Sales', color: COLORS.sales }]} />
          </div>
          <ChartContainer>
            <LineChart data={salesSeriesData} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip content={({ label, payload }) => (
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xl">
                  <ChartTooltipLabel label={label as string} />
                  <ChartTooltipValue value={`ETB ${payload?.[0]?.value ?? 0}`} />
                </div>
              )} />
              <Line type="monotone" dataKey="value" stroke={COLORS.sales} strokeWidth={3} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Orders by Business</h3>
              <p className="text-xs text-zinc-400">Live order distribution</p>
            </div>
            <ChartLegend items={[{ label: 'Orders', color: COLORS.orders }]} />
          </div>
          <ChartContainer>
            <BarChart data={ordersByBusiness} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip content={({ label, payload }) => (
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xl">
                  <ChartTooltipLabel label={label as string} />
                  <ChartTooltipValue value={payload?.[0]?.value ?? 0} />
                </div>
              )} />
              <Bar dataKey="value" fill={COLORS.orders} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-tight mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {activity.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50">
                <div>
                  <p className="text-sm font-bold">{order.businessName}</p>
                  <p className="text-xs text-zinc-500">Table {order.tableNumber} • {order.id.slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black">ETB {Number(order.totalAmount).toFixed(2)}</p>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-400">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
          <h3 className="text-xl font-black uppercase tracking-tight mb-6">Consolidated Report</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-50">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400">Top Business</p>
              <p className="text-sm font-bold">{topBusiness}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400">Avg Orders / Business</p>
              <p className="text-sm font-bold">{totalBusinesses ? Math.round(totalOrders / totalBusinesses) : 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-50">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400">Total Businesses</p>
              <p className="text-sm font-bold">{totalBusinesses}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
