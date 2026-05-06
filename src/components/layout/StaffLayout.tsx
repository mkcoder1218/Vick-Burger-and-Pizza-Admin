import React from "react";
import { LogOut } from "lucide-react";
import { User } from "../../types";

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
  return (
    <div className="min-h-screen bg-burger-cream flex">
      <aside className="w-80 bg-white border-r border-burger-black/5 flex flex-col hidden lg:flex">
        <div className="p-12">
          <h1 className="font-black text-4xl text-burger-black uppercase tracking-tighter">
            {currentUser.role === "super_admin"
              ? "Vick"
              : currentUser.business?.businessName || "Admin Panel"}
            <span className="text-burger-orange">.</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-burger-black/40 mt-2">
            {currentUser.role === "super_admin"
              ? "Super Admin Panel"
              : currentUser.role === "chef"
                ? "Kitchen Panel"
                : currentUser.role === "manager"
                  ? "Manager Panel"
                  : "Establishment"}
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
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-burger-black/5 flex items-center justify-between px-12">
          <h2 className="font-black text-3xl text-burger-black uppercase tracking-tighter">
            {navItems.find((m) => m.id === staffView)?.label}
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-xs font-bold uppercase tracking-widest text-burger-black/40">
              {currentUser.role.replace("_", " ")}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-12">{children}</div>
      </main>
    </div>
  );
}
