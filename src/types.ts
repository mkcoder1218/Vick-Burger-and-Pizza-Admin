import { LucideIcon } from 'lucide-react';

export type Category = 'Burgers' | 'Pizzas' | 'Drinks' | 'Desserts';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  image: string;
  available: boolean;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered';

export interface OrderItem {
  menuItemId: string;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  items: (OrderItem & { name: string; price: number })[];
  total: number;
  status: OrderStatus;
  timestamp: string;
  businessId: string;
}

export interface Business {
  id: string;
  name: string;
  location: string;
  totalSales: number;
  activeOrders: number;
  staffCount: number;
  performance: number; // 0-100
  logoFileId?: string;
}

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'chef' | 'waiter';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessId?: string; // null for super_admin
  businessIds?: string[];
  businesses?: { id: string; businessName: string }[];
  business?: { id: string; businessName: string } | null;
  profileFileId?: string;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  view: string;
}
