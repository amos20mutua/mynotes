"use client";

import Link from "next/link";
import { BookOpenText, Plus } from "lucide-react";
import { toast } from "sonner";
import { navLinks, siteConfig } from "@/constants/site";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useVaultStore } from "@/lib/state/use-vault-store";

export function Navbar() {
  const createNote = useVaultStore((state) => state.createNote);

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-slate-950/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="city-panel flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-amber-200 via-orange-300 to-rose-300 text-slate-950 shadow-[0_16px_40px_rgba(251,146,60,0.18)]">
            <BookOpenText className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-white uppercase">Obsidian</p>
            <p className="text-xs text-slate-400">{siteConfig.description}</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/8 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="accent"
            size="sm"
            type="button"
            onClick={async () => {
              try {
                await createNote();
                toast.success("New note created");
              } catch {
                toast.error("Could not create note");
              }
            }}
          >
            <Plus className="size-4" />
            New note
          </Button>
        </div>
      </div>
    </header>
  );
}
