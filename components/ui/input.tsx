import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-white/12 bg-slate-950/40 px-4 py-2 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[color:var(--accent-blue)] focus:ring-2 focus:ring-[color:var(--accent-blue-soft)]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
