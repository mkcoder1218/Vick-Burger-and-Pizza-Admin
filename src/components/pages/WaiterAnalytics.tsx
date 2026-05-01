import React, { useState } from 'react';
import { useGetAll } from '../../swr';

type WaiterAnalyticsResponse = {
  success: boolean;
  data: {
    deliveredOrders: number;
    deliveredAmount: number;
    deliveredItems: Array<{
      orderId: string;
      tableId: string;
      tableNumber: string;
      totalAmount: number;
      deliveredAt: string;
      foods: Array<{ itemName: string; quantity: number }>;
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
  };
};

export default function WaiterAnalytics() {
  const [filter, setFilter] = useState<'today' | 'all_time'>('today');
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useGetAll<WaiterAnalyticsResponse>(`api/waiter/analytics?filter=${filter}&page=${page}&limit=10`);
  const stats = data?.data;

  if (isLoading) return <div className="text-sm text-zinc-500">Loading analytics...</div>;
  if (error) return <div className="text-sm text-red-500">Failed to load waiter analytics.</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-zinc-100 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Delivered Orders</p>
        <p className="text-4xl font-black text-zinc-900 mt-2">{stats?.deliveredOrders ?? 0}</p>
        </div>
        <div className="bg-white rounded-3xl border border-zinc-100 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Delivered Amount</p>
        <p className="text-4xl font-black text-zinc-900 mt-2">ETB {(stats?.deliveredAmount ?? 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => { setFilter('today'); setPage(1); }} className={`px-3 py-2 rounded-xl text-xs font-black ${filter === 'today' ? 'bg-burger-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>Today</button>
        <button onClick={() => { setFilter('all_time'); setPage(1); }} className={`px-3 py-2 rounded-xl text-xs font-black ${filter === 'all_time' ? 'bg-burger-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>All Time</button>
      </div>
      <div className="bg-white rounded-3xl border border-zinc-100 p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Delivered List</p>
        {(stats?.deliveredItems ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500">No delivered orders yet.</p>
        ) : (
          <div className="space-y-3">
            {(stats?.deliveredItems ?? []).map((item) => (
              <div key={item.orderId} className="flex items-center justify-between rounded-2xl border border-zinc-100 p-3">
                <div>
                  <p className="text-sm font-bold text-zinc-900">Table {item.tableNumber}</p>
                  <p className="text-xs text-zinc-500">Order {item.orderId}</p>
                  <p className="text-xs text-zinc-500">{item.foods.map((f) => `${f.quantity}x ${f.itemName}`).join(', ')}</p>
                </div>
                <p className="text-sm font-black text-zinc-900">ETB {item.totalAmount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        )}
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
