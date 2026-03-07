import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { SWRConfig } from 'swr';
import { BarChart3, Building2, ChefHat, ClipboardList, LayoutGrid, TrendingUp, Users as UsersIcon, Grid3X3 } from 'lucide-react';
import { Business, MenuItem, Order, OrderStatus, User } from './types';
import { MOCK_BUSINESSES, MOCK_MENU, MOCK_ORDERS, MOCK_USERS } from './constants';
import AdminLogin from './components/auth/AdminLogin';
import StaffLayout, { StaffNavItem } from './components/layout/StaffLayout';
import SuperDashboard from './components/pages/SuperDashboard';
import SuperBusinesses from './components/pages/SuperBusinesses';
import SuperUsers from './components/pages/SuperUsers';
import SuperReports from './components/pages/SuperReports';
import SuperAssignments from './components/pages/SuperAssignments';
import SuperRoles from './components/pages/SuperRoles';
import AdminDashboard from './components/pages/AdminDashboard';
import AdminKitchen from './components/pages/AdminKitchen';
import AdminMenu from './components/pages/AdminMenu';
import AdminReports from './components/pages/AdminReports';
import AdminCategories from './components/pages/AdminCategories';
import AdminStaff from './components/pages/AdminStaff';
import AdminTables from './components/pages/AdminTables';
import AdminTableAssignments from './components/pages/AdminTableAssignments';
import WaiterTables from './components/pages/WaiterTables';
import Profile from './components/pages/Profile';
import { clearToken, getMe, normalizeUser, swrConfig } from './swr';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [staffView, setStaffView] = useState<string>('');

  const [menuItems, setMenuItems] = useState<MenuItem[]>(MOCK_MENU);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [businesses] = useState<Business[]>(MOCK_BUSINESSES);
  const [users] = useState<User[]>(MOCK_USERS);

  const currency = 'ETB';

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'super_admin') setStaffView('super_dashboard');
      else if (currentUser.role === 'waiter') setStaffView('waiter_kitchen');
      else if (currentUser.role === 'chef') setStaffView('admin_kitchen');
      else setStaffView('admin_dashboard');
    }
  }, [currentUser]);

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((res) => {
        const u = (res as any).data ? normalizeUser((res as any).data) : null;
        if (mounted && u) setCurrentUser(u as User);
      })
      .catch(() => {
        // not logged in
      });
    return () => {
      mounted = false;
    };
  }, []);

  const navItems = useMemo<StaffNavItem[]>(() => {
    if (!currentUser) return [];

    if (currentUser.role === 'super_admin') {
      return [
        { id: 'super_dashboard', label: 'Overview', icon: BarChart3 },
        { id: 'super_businesses', label: 'Businesses', icon: Building2 },
        { id: 'super_users', label: 'User Management', icon: UsersIcon },
        { id: 'super_assignments', label: 'Assignments', icon: UsersIcon },
        { id: 'super_roles', label: 'Roles', icon: UsersIcon },
        { id: 'super_reports', label: 'Consolidated Reports', icon: TrendingUp },
        { id: 'profile', label: 'Profile', icon: UsersIcon },
      ];
    }

    if (currentUser.role === 'waiter') {
      return [
        { id: 'waiter_kitchen', label: 'Kitchen Display', icon: ChefHat },
        { id: 'waiter_tables', label: 'My Tables', icon: LayoutGrid },
        { id: 'profile', label: 'Profile', icon: UsersIcon },
      ];
    }

    if (currentUser.role === 'chef') {
      return [
        { id: 'admin_kitchen', label: 'Kitchen Display', icon: ChefHat },
        { id: 'profile', label: 'Profile', icon: UsersIcon },
      ];
    }

    if (currentUser.role === 'manager') {
      return [
        { id: 'admin_dashboard', label: currentUser.business?.businessName || 'Dashboard', icon: LayoutGrid },
        { id: 'admin_kitchen', label: 'Kitchen Display', icon: ChefHat },
        { id: 'admin_menu', label: 'Menu Editor', icon: ClipboardList },
        { id: 'admin_categories', label: 'Category Management', icon: ClipboardList },
        { id: 'admin_tables', label: 'Tables', icon: Grid3X3 },
        { id: 'admin_staff', label: 'Staff Manager', icon: UsersIcon },
        { id: 'admin_table_assignments', label: 'Table Assignments', icon: UsersIcon },
        { id: 'admin_reports', label: 'Sales Analytics', icon: BarChart3 },
        { id: 'profile', label: 'Profile', icon: UsersIcon },
      ];
    }

    return [
      { id: 'admin_dashboard', label: currentUser.business?.businessName || 'Dashboard', icon: LayoutGrid },
      { id: 'admin_kitchen', label: 'Kitchen Display', icon: ChefHat },
      { id: 'admin_menu', label: 'Menu Editor', icon: ClipboardList },
      { id: 'admin_categories', label: 'Categories', icon: ClipboardList },
      { id: 'admin_staff', label: 'Staff (Managers, Chef, Waiters)', icon: UsersIcon },
      { id: 'admin_tables', label: 'Tables', icon: Grid3X3 },
      { id: 'admin_table_assignments', label: 'Table Assignments', icon: UsersIcon },
      { id: 'admin_reports', label: 'Sales Reports', icon: BarChart3 },
      { id: 'profile', label: 'Profile', icon: UsersIcon },
    ];
  }, [currentUser]);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const toggleAvailability = (id: string) => {
    setMenuItems((prev:any) => prev.map((m:any) => (m.id === id ? { ...m, available: !m.available } : m)));
  };

  return (
    <SWRConfig value={swrConfig}>
      <div className="font-sans text-zinc-900 selection:bg-black selection:text-white">
        <AnimatePresence mode="wait">
          {!currentUser ? (
            <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AdminLogin onLogin={setCurrentUser} />
            </motion.div>
          ) : (
            <motion.div key="staff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StaffLayout
                currentUser={currentUser}
                staffView={staffView}
                onNavigate={setStaffView}
                onLogout={() => {
                  clearToken();
                  setCurrentUser(null);
                }}
                navItems={navItems}
              >
                {staffView === 'super_dashboard' && (
                  <SuperDashboard />
                )}
                {staffView === 'super_businesses' && (
                  <SuperBusinesses />
                )}
                {staffView === 'super_users' && (
                  <SuperUsers users={users} businesses={businesses} />
                )}
                {staffView === 'super_assignments' && <SuperAssignments />}
                {staffView === 'super_roles' && <SuperRoles />}
                {staffView === 'super_reports' && <SuperReports />}

                {staffView === 'waiter_kitchen' && <AdminKitchen currentUser={currentUser} />}
                {staffView === 'waiter_tables' && <WaiterTables currentUser={currentUser} />}

                {staffView === 'admin_dashboard' && (
                  <AdminDashboard currentUser={currentUser} />
                )}
                {staffView === 'admin_kitchen' && (
                  <AdminKitchen currentUser={currentUser} />
                )}
                {staffView === 'admin_menu' && (
                  <AdminMenu currentUser={currentUser} />
                )}
                {staffView === 'admin_categories' && (
                  <AdminCategories currentUser={currentUser} />
                )}
                {staffView === 'admin_staff' && (
                  <AdminStaff currentUser={currentUser} />
                )}
                {staffView === 'admin_tables' && (
                  <AdminTables currentUser={currentUser} />
                )}
                {staffView === 'admin_table_assignments' && (
                  <AdminTableAssignments />
                )}
                {staffView === 'admin_reports' && <AdminReports currentUser={currentUser} />}
                {staffView === 'profile' && currentUser && <Profile user={currentUser} onUpdated={setCurrentUser} />}
              </StaffLayout>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SWRConfig>
  );
}
