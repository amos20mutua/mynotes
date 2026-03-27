"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-cyan-400/70",
  {
    variants: {
      variant: {
        default: "bg-white text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.18)] hover:-translate-y-0.5 hover:bg-white/90",
        secondary: "border border-white/15 bg-white/8 text-white backdrop-blur-xl hover:bg-white/14",
        ghost: "text-slate-200 hover:bg-white/10",
        accent: "bg-gradient-to-r from-cyan-300 to-orange-300 text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.2)] hover:-translate-y-0.5",
        destructive: "bg-rose-500 text-white hover:bg-rose-400"
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
