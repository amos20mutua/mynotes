import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_60px_rgba(2,8,23,0.22)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
