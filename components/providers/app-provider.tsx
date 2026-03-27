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
        closeButton
        position="top-right"
        toastOptions={{
          className: "border border-white/12 !bg-slate-950/95 !text-white backdrop-blur-xl"
        }}
      />
    </ThemeProvider>
  );
}
