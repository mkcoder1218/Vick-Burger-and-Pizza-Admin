import React, { useMemo, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { User } from "../../types";
import Drawer from "../ui/Drawer";

export type StaffNavItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export default function StaffLayout({
  currentUser,
  staffView,
  onNavigate,
  onLogout,
  navItems,
  children,
}: {
  currentUser: User;
  staffView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  navItems: StaffNavItem[];
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const currentLabel = useMemo(
    () => navItems.find((m) => m.id === staffView)?.label ?? "",
    [navItems, staffView],
  );

  const headerTitle =
    currentUser.role === "super_admin"
      ? "Vick"
      : currentUser.business?.businessName || "Admin Panel";

  const headerSubtitle =
    currentUser.role === "super_admin"
      ? "Super Admin Panel"
      : currentUser.role === "chef"
        ? "Kitchen Panel"
        : currentUser.role === "manager"
          ? "Manager Panel"
          : "Establishment";

  return (
    <div className="min-h-screen bg-burger-cream flex">
      <aside className="w-80 bg-white border-r border-burger-black/5 flex flex-col hidden lg:flex">
        <div className="p-12">
          <h1 className="font-black text-4xl text-burger-black uppercase tracking-tighter">
            {headerTitle}
            <span className="text-burger-orange">.</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-burger-black/40 mt-2">
            {headerSubtitle}
          </p>
        </div>
        <nav className="flex-1 px-8 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-tight transition-all duration-300 ${
                staffView === item.id
                  ? "bg-burger-black text-white shadow-2xl shadow-burger-black/20"
                  : "text-burger-black/40 hover:bg-zinc-50 hover:text-burger-black"
              }`}
            >
              <item.icon
                size={20}
                className={staffView === item.id ? "text-burger-orange" : ""}
              />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-8 border-t border-burger-black/5">
          <div className="px-6 py-5 mb-6 bg-burger-cream rounded-3xl border border-burger-black/5">
            <p className="text-[10px] font-black text-burger-black/40 uppercase tracking-widest mb-2">
              Active Session
            </p>
            <p className="text-sm font-black text-burger-black truncate">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-burger-black/60 truncate font-bold">
              {currentUser.email}
            </p>
            <p className="text-[10px] text-burger-black/40 uppercase tracking-widest font-black mt-2">
              {currentUser.role.replace("_", " ")}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-6 py-5 rounded-2xl text-sm font-black uppercase tracking-tight text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 sm:h-20 lg:h-24 bg-white/80 backdrop-blur-md border-b border-burger-black/5 flex items-center justify-between px-4 sm:px-6 lg:px-12">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-2xl hover:bg-zinc-50 border border-burger-black/10"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h2 className="font-black text-lg sm:text-2xl lg:text-3xl text-burger-black uppercase tracking-tighter truncate">
                {currentLabel}
              </h2>
              <div className="lg:hidden text-[10px] font-black uppercase tracking-[0.25em] text-burger-black/40 truncate">
                {headerSubtitle}
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-xs font-bold uppercase tracking-widest text-burger-black/40">
              {currentUser.role.replace("_", " ")}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-12">
          {children}
        </div>
      </main>

      <Drawer
        open={mobileNavOpen}
        title="Menu"
        onClose={() => setMobileNavOpen(false)}
      >
        <div className="pb-4 border-b border-zinc-100">
          <div className="font-black text-2xl text-burger-black uppercase tracking-tighter">
            {headerTitle}
            <span className="text-burger-orange">.</span>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-burger-black/40 mt-2">
            {headerSubtitle}
          </div>
          <div className="mt-4 px-4 py-4 bg-burger-cream rounded-3xl border border-burger-black/5">
            <p className="text-[10px] font-black text-burger-black/40 uppercase tracking-widest mb-2">
              Active Session
            </p>
            <p className="text-sm font-black text-burger-black truncate">
              {currentUser.name}
            </p>
            <p className="text-[10px] text-burger-black/60 truncate font-bold">
              {currentUser.email}
            </p>
            <p className="text-[10px] text-burger-black/40 uppercase tracking-widest font-black mt-2">
              {currentUser.role.replace("_", " ")}
            </p>
          </div>
        </div>

        <nav className="pt-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-tight transition-colors ${
                staffView === item.id
                  ? "bg-burger-black text-white"
                  : "text-burger-black/60 hover:bg-zinc-50 hover:text-burger-black"
              }`}
            >
              <item.icon
                size={18}
                className={staffView === item.id ? "text-burger-orange" : ""}
              />
              <span className="text-left">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-6">
          <button
            onClick={() => {
              setMobileNavOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-black uppercase tracking-tight text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </Drawer>
    </div>
  );
}
