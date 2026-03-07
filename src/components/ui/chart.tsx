import * as React from 'react';
import { ResponsiveContainer } from 'recharts';

export type ChartConfig = Record<string, { label: string; color: string }>;

export function ChartContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`h-[320px] w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

export function ChartTooltipLabel({ label }: { label?: string }) {
  if (!label) return null;
  return <div className="text-xs font-bold text-zinc-700">{label}</div>;
}

export function ChartTooltipValue({ value }: { value?: string | number }) {
  if (value === undefined || value === null) return null;
  return <div className="text-sm font-black text-zinc-900">{value}</div>;
}
