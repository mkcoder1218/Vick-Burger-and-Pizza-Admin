import React, { useMemo, useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { fetcher, useGetAll } from '../../swr';
import { mutate } from 'swr';
import { listKey } from '../../swr/hooks';
import { User } from '../../types';

const ASSIGNED_TABLES_RESOURCE = 'api/waiter/tables/assigned';

type ApiOrderItem = { quantity: number; menuItem?: { itemName: string } };
type ApiOrder = {
  id: string;
  status: string;
  totalAmount: string;
  paymentMethod?: string | null;
  table?: { tableNumber: string };
  orderItems?: ApiOrderItem[];
};

type AssignedRow = {
  assignment: { id: string; createdAt: string };
  table: { id: string; tableNumber: string; isActive: boolean; isAvailable: boolean; status?: string } | null;
  order: ApiOrder | null;
  paymentStatus: string | null;
  paid: boolean;
};

type ListResponse<T> = { success: boolean; data: T[] };

const toStatus = (status: string) => status.toLowerCase() as 'pending' | 'preparing' | 'ready' | 'delivered';

export default function WaiterTables({ currentUser }: { currentUser: User }) {
  const { data, isLoading, error } = useGetAll<ListResponse<AssignedRow>>(ASSIGNED_TABLES_RESOURCE);
  const rows = useMemo(() => data?.data ?? [], [data]);
  const [savingId, setSavingId] = useState<string | null>(null);

  const updateStatus = async (orderId: string, status: 'Pending' | 'Preparing' | 'Ready' | 'Delivered') => {
    setSavingId(orderId);
    try {
      await fetcher(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await mutate(listKey(ASSIGNED_TABLES_RESOURCE));
    } finally {
      setSavingId(null);
    }
  };

  const confirmPayment = async (orderId: string, status: 'Paid' | 'Unpaid', paymentMethod?: string | null) => {
    setSavingId(orderId);
    try {
      await fetcher(`/api/orders/${orderId}/confirm-payment`, {
        method: 'POST',
        body: JSON.stringify({ status, paymentMethod: paymentMethod || undefined }),
      });
      await mutate(listKey(ASSIGNED_TABLES_RESOURCE));
    } finally {
      setSavingId(null);
    }
  };

  const completeVisit = async (tableId: string) => {
    setSavingId(tableId);
    try {
      await fetcher(`/api/waiter/tables/${tableId}/complete`, {
        method: 'POST',
      });
      await mutate(listKey(ASSIGNED_TABLES_RESOURCE));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Assigned Tables</h3>
        <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Your floor</div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}
      {error && <div className="text-sm text-red-500">Failed to load assigned tables</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {!isLoading &&
          rows.map((row) => {
            const tableNumber = row.table?.tableNumber ?? '—';
            const order = row.order;
            const paidLabel = row.paid ? 'Paid' : 'Unpaid';
            const status = row.table?.status ?? 'waiting';
            return (
              <div key={row.assignment.id} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Table</p>
                    <p className="text-3xl font-black text-zinc-900">{tableNumber}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-2">Status</p>
                    <p className="text-sm font-bold text-zinc-700 capitalize">{status}</p>
                  </div>
                  <div className={`text-xs font-black uppercase tracking-widest px-3 py-2 rounded-full ${row.paid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {paidLabel}
                  </div>
                </div>

                {order ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Order</p>
                        <p className="text-sm font-bold">{order.id}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-2">Payment Method</p>
                        <p className="text-xs text-zinc-600">{order.paymentMethod ?? '—'}</p>
                      </div>
                      <Badge status={toStatus(order.status)}>{toStatus(order.status)}</Badge>
                    </div>
                    <ul className="space-y-1 text-sm text-zinc-600">
                      {order.orderItems?.map((i, idx) => (
                        <li key={idx}>{i.quantity}x {i.menuItem?.itemName ?? 'Item'}</li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      {order.status.toLowerCase() !== 'delivered' ? (
                        <Button
                          variant="gold"
                          onClick={() => updateStatus(order.id, 'Delivered')}
                          disabled={savingId === order.id}
                          className="text-[10px] py-2 px-4"
                        >
                          Deliver
                        </Button>
                      ) : (
                        <span className="text-xs text-zinc-400">Delivered</span>
                      )}
                    </div>
                    {status !== 'waiting' && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="secondary"
                          onClick={() => confirmPayment(order.id, 'Unpaid', order.paymentMethod)}
                          disabled={savingId === order.id || !row.paid}
                          className="text-[10px] py-2 px-4"
                        >
                          Mark Unpaid
                        </Button>
                        <Button
                          variant="gold"
                          onClick={() => confirmPayment(order.id, 'Paid', order.paymentMethod)}
                          disabled={savingId === order.id || row.paid}
                          className="text-[10px] py-2 px-4"
                        >
                          {row.paid ? 'Paid' : 'Confirm Paid'}
                        </Button>
                      </div>
                    )}
                    {status === 'enjoying' && (
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          variant="gold"
                          onClick={() => row.table?.id && completeVisit(row.table.id)}
                          disabled={savingId === row.table?.id}
                          className="text-[10px] py-2 px-4"
                        >
                          Mark Left
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-zinc-400">No orders yet for this table.</div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
