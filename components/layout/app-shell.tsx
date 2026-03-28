import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100svh]">
      <main>{children}</main>
    </div>
  );
}
