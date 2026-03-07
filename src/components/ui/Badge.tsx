import React from 'react';
import { OrderStatus } from '../../types';

export default function Badge({ children, status }: { children: React.ReactNode; status: OrderStatus }) {
  const colors = {
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    preparing: 'bg-blue-50 text-blue-700 border-blue-100',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    delivered: 'bg-zinc-50 text-zinc-500 border-zinc-100',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${colors[status]}`}>
      {children}
    </span>
  );
}
