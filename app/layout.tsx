import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "@/app/globals.css";
import { siteConfig } from "@/constants/site";
import { AppShell } from "@/components/layout/app-shell";
import { AppProvider } from "@/components/providers/app-provider";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="text-slate-50 antialiased" suppressHydrationWarning>
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
