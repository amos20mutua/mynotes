import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("overflow-hidden rounded-[28px] border border-white/10", className)}>{children}</div>;
}

export function TableHeader({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-4 gap-4 border-b border-white/10 bg-white/6 px-5 py-4 text-xs uppercase tracking-[0.24em] text-slate-400">{children}</div>;
}

export function TableRow({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("grid grid-cols-4 gap-4 border-b border-white/6 px-5 py-4 text-sm text-slate-200 last:border-b-0", className)}>{children}</div>;
}
