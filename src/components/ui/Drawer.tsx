import React from 'react';
import { X } from 'lucide-react';

export default function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100">
          <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto h-[calc(100%-72px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
