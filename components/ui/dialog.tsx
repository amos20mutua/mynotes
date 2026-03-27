"use client";

import type { ComponentProps } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <DialogPrimitive.Overlay className={cn("fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm", className)} {...props} />;
}

export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-white/10 bg-slate-950/95 p-6 shadow-[0_30px_90px_rgba(2,8,23,0.55)]",
          className
        )}
        {...props}
      >
        {children}
        <DialogClose className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn("text-2xl font-semibold text-white", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description className={cn("text-sm leading-6 text-slate-400", className)} {...props} />;
}
