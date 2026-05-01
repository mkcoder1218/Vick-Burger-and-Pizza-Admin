import React, { useState } from 'react';
import { useGetAll } from '../../swr';

type KitchenAnalyticsResponse = {
  success: boolean;
  data: {
    completedOrders: number;
    producedAmount: number;
    completedItems: Array<{
      orderId: string;
      tableNumber: string;
      totalAmount: number;
      completedAt: string;
      foods: Array<{ itemName: string; quantity: number }>;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
};

export default function KitchenAnalytics() {
  const [filter, setFilter] = useState<'today' | 'all_time'>('today');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetAll<KitchenAnalyticsResponse>(`api/kitchen/analytics?filter=${filter}&page=${page}&limit=10`);
  const stats = data?.data;

  if (isLoading) return <div className="text-sm text-zinc-500">Loading analytics...</div>;
  if (error) return <div className="text-sm text-red-500">Failed to load kitchen analytics.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => { setFilter('today'); setPage(1); }} className={`px-3 py-2 rounded-xl text-xs font-black ${filter === 'today' ? 'bg-burger-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>Today</button>
        <button onClick={() => { setFilter('all_time'); setPage(1); }} className={`px-3 py-2 rounded-xl text-xs font-black ${filter === 'all_time' ? 'bg-burger-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>All Time</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl border border-zinc-100 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Completed Orders</p>
        <p className="text-4xl font-black text-zinc-900 mt-2">{stats?.completedOrders ?? 0}</p>
      </div>
      <div className="bg-white rounded-3xl border border-zinc-100 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Production Value</p>
        <p className="text-4xl font-black text-zinc-900 mt-2">ETB {(stats?.producedAmount ?? 0).toFixed(2)}</p>
      </div>
      </div>
      <div className="bg-white rounded-3xl border border-zinc-100 p-6 space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Completed List</p>
        {(stats?.completedItems ?? []).map((item) => (
          <div key={item.orderId} className="border border-zinc-100 rounded-2xl p-3">
            <p className="text-sm font-bold">Table {item.tableNumber} • ETB {item.totalAmount.toFixed(2)}</p>
            <p className="text-xs text-zinc-500">{item.foods.map((f) => `${f.quantity}x ${f.itemName}`).join(', ')}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Page {stats?.pagination?.page ?? 1} of {stats?.pagination?.totalPages ?? 1}</p>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-xl bg-zinc-100 text-xs font-black" disabled={(stats?.pagination?.page ?? 1) <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
          <button className="px-3 py-2 rounded-xl bg-zinc-100 text-xs font-black" disabled={(stats?.pagination?.page ?? 1) >= (stats?.pagination?.totalPages ?? 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
