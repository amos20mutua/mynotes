import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-24 w-full rounded-3xl border border-white/12 bg-slate-950/40 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[color:var(--accent-blue)] focus:ring-2 focus:ring-[color:var(--accent-blue-soft)]",
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = "Textarea";
