import React, { useEffect, useMemo, useRef, useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { fetcher, useGetAll, buildUrl, getToken } from '../../swr';
import { io } from 'socket.io-client';
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('staffSoundEnabled') === 'true';
  });
  const soundEnabledRef = useRef(soundEnabled);
  const soundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    soundRef.current = new Audio('/mixkit-software-interface-remove-2576.wav');
  }, []);

  const playNotification = () => {
    if (!soundEnabledRef.current) return;
    try {
      if (!soundRef.current) {
        soundRef.current = new Audio('/mixkit-software-interface-remove-2576.wav');
      }
      soundRef.current.currentTime = 0;
      void soundRef.current.play();
    } catch {
      // ignore if audio not available
    }
  };

  const enableSound = () => {
    setSoundEnabled(true);
    window.localStorage.setItem('staffSoundEnabled', 'true');
    playNotification();
  };

  const disableSound = () => {
    setSoundEnabled(false);
    window.localStorage.setItem('staffSoundEnabled', 'false');
  };

  useEffect(() => {
    const token = getToken();
    const socket = io(buildUrl(''), {
      auth: token ? { token: `Bearer ${token}` } : undefined,
    });
    socket.emit('join-staff');
    const refresh = () => mutate(listKey(ASSIGNED_TABLES_RESOURCE));
    socket.on('OrderPlaced', () => {
      playNotification();
      refresh();
    });
    socket.on('TableStatusUpdated', refresh);
    socket.on('PaymentCompleted', refresh);
    socket.on('OrderStatusUpdated', (payload: { status?: string }) => {
      if (payload?.status && payload.status.toLowerCase() === 'ready') {
        playNotification();
      }
      refresh();
    });
    return () => {
      socket.off('OrderPlaced');
      socket.off('TableStatusUpdated', refresh);
      socket.off('PaymentCompleted', refresh);
      socket.off('OrderStatusUpdated');
      socket.disconnect();
    };
  }, []);

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
    setActionError(null);
    try {
      await fetcher(`/api/waiter/tables/${tableId}/complete`, {
        method: 'POST',
      });
      await mutate(listKey(ASSIGNED_TABLES_RESOURCE));
    } catch (err: any) {
      setActionError(err?.message || 'Failed to complete table visit');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Assigned Tables</h3>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={soundEnabled ? disableSound : enableSound}
            className={`px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${soundEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}
          >
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </button>
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">Your floor</div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}
      {error && <div className="text-sm text-red-500">Failed to load assigned tables</div>}
      {actionError && <div className="text-sm text-red-500">{actionError}</div>}

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
                      {order.status.toLowerCase() === 'ready' ? (
                        <Button
                          variant="gold"
                          onClick={() => updateStatus(order.id, 'Delivered')}
                          disabled={savingId === order.id}
                          className="text-[10px] py-2 px-4"
                        >
                          Deliver
                        </Button>
                      ) : (
                        <span className="text-xs text-zinc-400">Waiting for kitchen</span>
                      )}
                    </div>
                    {order.status.toLowerCase() === 'delivered' && status !== 'waiting' && (
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
