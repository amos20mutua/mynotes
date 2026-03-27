"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { PwaRegistrar } from "@/components/providers/pwa-registrar";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <PwaRegistrar />
      {children}
      <Toaster
        richColors
        closeButton={false}
        position="top-right"
        toastOptions={{
          className: "border border-white/10 !bg-slate-950/94 !text-white px-3 py-2 text-xs shadow-[0_16px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl"
        }}
      />
    </ThemeProvider>
  );
}
