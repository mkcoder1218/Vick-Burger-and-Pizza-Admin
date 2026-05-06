import React, { useMemo } from "react";
import { ChefHat, ClipboardList, TrendingUp } from "lucide-react";
import Badge from "../ui/Badge";
import Skeleton from "../ui/Skeleton";
import { useGetAll } from "../../swr";
import { User } from "../../types";

const ANALYTICS_RESOURCE = "api/reports/analytics";
const SALES_RESOURCE = "api/reports/sales";

const ordersByBusiness = (businessId: string) =>
  `api/admin/orders/business/${businessId}`;

type AnalyticsReport = {
  totalOrders: number;
  averageOrderValue: string;
  topItems: { itemName: string; totalQuantity: number; totalRevenue: string }[];
};

type SalesReport = { totalRevenue: string };

type ApiResponse<T> = { success: boolean; data: T };

type ApiOrder = {
  id: string;
  status: string;
  totalAmount: string;
  table?: { tableNumber: string };
  orderItems?: { quantity: number; menuItem?: { itemName: string } }[];
};

type OrdersResponse = { success: boolean; data: ApiOrder[] };

const toStatus = (status: string) =>
  status.toLowerCase() as "pending" | "preparing" | "ready" | "delivered";

export default function AdminDashboard({ currentUser }: { currentUser: User }) {
  const isSuperAdmin = currentUser.role === "super_admin";
  const businessId = currentUser.business?.id || currentUser.businessId;
  const period = "weekly";

  const { data: analyticsData, isLoading: analyticsLoading } = useGetAll<
    ApiResponse<AnalyticsReport>
  >(businessId || isSuperAdmin ? ANALYTICS_RESOURCE : null, {
    period,
    businessId,
  });
  const { data: salesData, isLoading: salesLoading } = useGetAll<
    ApiResponse<SalesReport>
  >(businessId || isSuperAdmin ? SALES_RESOURCE : null, { period, businessId });
  const { data: ordersData, isLoading: ordersLoading } =
    useGetAll<OrdersResponse>(businessId ? ordersByBusiness(businessId) : null);

  const orders = useMemo(() => ordersData?.data ?? [], [ordersData]);
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const totalOrders = analyticsData?.data?.totalOrders ?? 0;
  const avgOrder = analyticsData?.data?.averageOrderValue ?? "0";
  const totalRevenue = salesData?.data?.totalRevenue ?? "0";

  if (!businessId && !isSuperAdmin) {
    return (
      <div className="text-sm text-zinc-500">
        No business assigned to this account.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Total Orders", value: totalOrders, icon: ClipboardList },
          {
            label: "Avg Order Value",
            value: `ETB ${Number(avgOrder).toFixed(2)}`,
            icon: TrendingUp,
          },
          {
            label: "Revenue (Weekly)",
            value: `ETB ${Number(totalRevenue).toFixed(2)}`,
            icon: ChefHat,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm"
          >
            <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-[#C5A059] mb-6">
              <s.icon size={24} />
            </div>
            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-1">
              {s.label}
            </p>
            {analyticsLoading || salesLoading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <p className="text-3xl font-serif text-[#C5A059]">{s.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2rem] border border-zinc-100 overflow-hidden shadow-sm">
        <div className="p-8 border-b border-zinc-50 flex justify-between items-center">
          <h3 className="font-serif text-2xl text-zinc-900">Recent Orders</h3>
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Live
          </div>
        </div>
        <div className="divide-y divide-zinc-50">
          {ordersLoading && (
            <div className="p-8 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6" />
              ))}
            </div>
          )}
          {!ordersLoading &&
            recentOrders.map((o) => (
              <div
                key={o.id}
                className="p-8 flex items-center justify-between hover:bg-zinc-50/50 transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center font-serif text-xl text-white shadow-lg shadow-black/10">
                    {o.table?.tableNumber ?? "--"}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{o.id}</p>
                    <p className="text-xs text-zinc-400 font-medium">
                      {o.orderItems?.length ?? 0} items - ETB{" "}
                      {Number(o.totalAmount).toFixed(2)}
                    </p>
                  </div>
                </div>
                <Badge status={toStatus(o.status)}>{toStatus(o.status)}</Badge>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
