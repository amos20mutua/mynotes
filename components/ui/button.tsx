"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[color:var(--accent-blue)]/70",
  {
    variants: {
      variant: {
        default: "bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.16)] hover:-translate-y-0.5 hover:bg-white/92",
        secondary: "border border-[color:var(--accent-blue-soft)] bg-[color:var(--accent-blue-soft)] text-white backdrop-blur-xl hover:bg-[rgba(154,169,187,0.22)]",
        ghost: "text-slate-200 hover:bg-white/10",
        accent: "bg-[color:var(--accent-amber)] text-slate-950 shadow-[0_18px_40px_rgba(239,191,114,0.22)] hover:-translate-y-0.5 hover:bg-[#f3c984]",
        destructive: "bg-[color:var(--danger-deep)] text-white shadow-[0_14px_32px_rgba(143,76,76,0.18)] hover:bg-[#a75d5d]"
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
