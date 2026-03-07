import React from 'react';
import { Order, OrderStatus } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export function WaiterDashboard({ orders }: { orders: Order[] }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="font-serif text-3xl text-zinc-900">Table Service</h3>
        <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Active floor</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {orders.slice(0, 6).map((o) => (
          <div key={o.id} className="bg-white p-6 rounded-[2rem] border border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Table</p>
            <p className="text-4xl font-black text-zinc-900">{o.tableNumber}</p>
            <div className="mt-3"><Badge status={o.status}>{o.status}</Badge></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WaiterOrders({ orders, onUpdateStatus }: { orders: Order[]; onUpdateStatus: (id: string, status: OrderStatus) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Active Orders</h3>
      </div>
      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-zinc-50 text-xs font-bold text-zinc-500 uppercase">
            <tr><th className="px-6 py-4">Order</th><th className="px-6 py-4">Table</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4 font-bold">{o.id}</td>
                <td className="px-6 py-4">{o.tableNumber}</td>
                <td className="px-6 py-4"><Badge status={o.status}>{o.status}</Badge></td>
                <td className="px-6 py-4">
                  {o.status === 'ready' ? (
                    <Button onClick={() => onUpdateStatus(o.id, 'delivered')} variant="gold" className="text-[10px] py-2 px-4">Deliver</Button>
                  ) : (
                    <span className="text-xs text-zinc-400">Waiting</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
