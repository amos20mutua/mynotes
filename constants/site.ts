import type { Route } from "next";

export const siteConfig = {
  name: "Obsidian Vault",
  description:
    "A local-first writing workspace for capturing notes, shaping ideas, and building your own personal vault.",
  url: "http://127.0.0.1:3000",
  ogImage: "/og-image.png"
};

export const navLinks = [
  { href: "/", label: "Vault" }
] satisfies Array<{ href: Route; label: string }>;

export const operatorLinks = [] satisfies Array<{ href: Route; label: string }>;
