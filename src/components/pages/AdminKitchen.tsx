import React, { useEffect, useMemo, useRef, useState } from "react";
import Badge from "../ui/Badge";
import Skeleton from "../ui/Skeleton";
import { fetcher, getToken, useGetAll, buildUrl } from "../../swr";
import { mutate } from "swr";
import { listKey } from "../../swr/hooks";
import { User } from "../../types";
import { io } from "socket.io-client";

const ordersByBusiness = (businessId: string) =>
  `api/admin/orders/business/${businessId}`;
const activeKitchenOrders = "api/kitchen/orders/active";

type ApiOrder = {
  id: string;
  status: string;
  totalAmount: string;
  table?: { tableNumber: string };
  orderItems?: { quantity: number; menuItem?: { itemName: string } }[];
};

type KitchenItem = {
  itemId: string;
  itemName: string;
  quantity: number;
  specialInstruction?: string | null;
  itemImageUrl?: string | null;
};
type KitchenOrder = {
  orderId: string;
  tableId: string;
  tableNumber: string;
  status: string;
  totalAmount: string;
  timePlaced: string;
  items: KitchenItem[];
};

type OrdersResponse = { success: boolean; data: ApiOrder[] | KitchenOrder[] };

const toStatus = (status: string) =>
  status.toLowerCase() as "pending" | "preparing" | "ready" | "delivered";

export default function AdminKitchen({ currentUser }: { currentUser: User }) {
  const businessId = currentUser.business?.id || currentUser.businessId;
  const isChef = currentUser.role === "chef";
  const isWaiter = currentUser.role === "waiter";
  const isManager =
    currentUser.role === "manager" ||
    currentUser.role === "admin" ||
    currentUser.role === "super_admin";
  const isKitchenStaff = isChef || isWaiter || isManager;

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filterStatus, setFilterStatus] = useState("");

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("staffSoundEnabled") === "true";
  });
  const soundEnabledRef = useRef(soundEnabled);
  const soundRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    soundRef.current = new Audio("/mixkit-software-interface-remove-2576.wav");
  }, []);

  const resource = isKitchenStaff
    ? activeKitchenOrders
    : businessId
      ? ordersByBusiness(businessId)
      : null;

  const query = useMemo(() => {
    if (isKitchenStaff) {
      return { page, limit, status: filterStatus || undefined };
    }
    return {};
  }, [isKitchenStaff, page, limit, filterStatus]);

  const { data, isLoading } = useGetAll<any>(resource, query);

  const orders = useMemo(() => {
    const rows = data?.data ?? [];
    if (rows.length > 0 && "orderId" in rows[0]) {
      return (rows as KitchenOrder[]).map((o) => ({
        id: o.orderId,
        status: o.status,
        totalAmount: o.totalAmount,
        table: { tableNumber: o.tableNumber },
        orderItems:
          o.items?.map((i) => ({
            quantity: i.quantity,
            menuItem: {
              itemName: i.itemName,
              imageUrl: i.itemImageUrl || undefined,
            },
          })) ?? [],
      }));
    }
    return rows as ApiOrder[];
  }, [data]);

  const pagination = data?.pagination;

  const playNotification = () => {
    if (!soundEnabledRef.current) return;
    try {
      if (!soundRef.current) {
        soundRef.current = new Audio(
          "/mixkit-software-interface-remove-2576.wav",
        );
      }
      soundRef.current.currentTime = 0;
      void soundRef.current.play();
    } catch {
      // ignore if audio not available
    }
  };

  const enableSound = () => {
    setSoundEnabled(true);
    window.localStorage.setItem("staffSoundEnabled", "true");
    playNotification();
  };

  const disableSound = () => {
    setSoundEnabled(false);
    window.localStorage.setItem("staffSoundEnabled", "false");
  };

  useEffect(() => {
    if (!resource) return;
    const token = getToken();
    const socket = io(buildUrl(""), {
      auth: token ? { token: `Bearer ${token}` } : undefined,
    });
    socket.emit("join-kitchen");
    const refresh = () => mutate(listKey(resource, query));
    socket.on("OrderPlaced", () => {
      playNotification();
      refresh();
    });
    socket.on("OrderStatusUpdated", refresh);
    return () => {
      socket.off("OrderPlaced");
      socket.off("OrderStatusUpdated", refresh);
      socket.disconnect();
    };
  }, [resource, query]);

  if (!businessId && !isKitchenStaff) {
    return (
      <div className="text-sm text-zinc-500">
        No business assigned to this account.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end flex-wrap gap-6">
        <div>
          <h3 className="font-serif text-3xl text-zinc-900">Kitchen Display</h3>
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-1">
            Live queue
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {isManager && isKitchenStaff && (
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold focus:outline-none focus:border-burger-orange"
              >
                <option value="">All Active</option>
                <option value="Pending">Pending</option>
                <option value="Preparing">Preparing</option>
                <option value="Ready">Ready</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          )}

          <button
            type="button"
            onClick={soundEnabled ? disableSound : enableSound}
            className={`px-3 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${soundEnabled ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"}`}
          >
            {soundEnabled ? "Sound On" : "Sound Off"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {isLoading && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm"
              >
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-3" />
                <Skeleton className="h-4 w-2/3 mt-3" />
              </div>
            ))}
          </>
        )}
        {!isLoading && orders.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-zinc-100">
            <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">
              No orders found
            </p>
          </div>
        )}
        {!isLoading &&
          orders.map((o) => (
            <div
              key={o.id}
              className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-2xl font-black">
                    Table {o.table?.tableNumber ?? "--"}
                  </p>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                    Kitchen Order
                  </p>
                </div>
                <Badge status={toStatus(o.status)}>{toStatus(o.status)}</Badge>
              </div>
              <ul className="space-y-3 text-sm text-zinc-700">
                {o.orderItems?.map((i, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    {i.menuItem?.imageUrl && (
                      <img
                        src={buildUrl(i.menuItem.imageUrl)}
                        className="w-10 h-10 rounded-xl object-cover"
                        alt={i.menuItem.itemName}
                      />
                    )}
                    <span className="font-black">
                      {i.quantity}x {i.menuItem?.itemName ?? "Item"}
                    </span>
                  </li>
                ))}
              </ul>
              {isChef && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() =>
                      fetcher(`/api/kitchen/orders/${o.id}/status`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "Preparing" }),
                      }).then(() => mutate(listKey(resource!, query)))
                    }
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  >
                    Preparing
                  </button>
                  <button
                    onClick={() =>
                      fetcher(`/api/kitchen/orders/${o.id}/status`, {
                        method: "PATCH",
                        body: JSON.stringify({ status: "Ready" }),
                      }).then(() => mutate(listKey(resource!, query)))
                    }
                    className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-burger-orange text-white hover:bg-burger-red"
                  >
                    Ready
                  </button>
                </div>
              )}
            </div>
          ))}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs font-bold text-zinc-500">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={page === pagination.totalPages}
            className="px-4 py-2 rounded-xl bg-white border border-zinc-200 text-xs font-bold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
