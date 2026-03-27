"use client";

import Link from "next/link";
import { Grid2X2, ListFilter, Search, SlidersHorizontal, Sparkles, Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { categories, sellers } from "@/mock/data";
import { ProductCard } from "@/components/market/product-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { products } from "@/mock/data";
import { useMarketStore } from "@/lib/state/use-market-store";

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("popularity");
  const [location, setLocation] = useState("all");
  const favorites = useMarketStore((state) => state.favorites);
  const recentViews = useMarketStore((state) => state.recentViews);

  const filtered = useMemo(() => {
    const source = products.filter((product) => {
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.location.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || product.category === category;
      const matchesLocation = location === "all" || product.location === location;
      return matchesQuery && matchesCategory && matchesLocation;
    });

    return [...source].sort((a, b) => {
      if (sort === "price") return a.price - b.price;
      if (sort === "newest") return +new Date(b.createdAt) - +new Date(a.createdAt);
      return b.popularity - a.popularity;
    });
  }, [category, location, query, sort]);

  const hotZones = [
    { name: "Westlands", detail: "Best reply speed", value: "4 min median" },
    { name: "Kilimani", detail: "Style demand surging", value: "+22% saves" },
    { name: "CBD", detail: "Best utility pricing", value: "Low-cart friction" }
  ];

  return (
    <div className="relative">
      <div className="city-orb left-0 top-24 h-72 w-72 bg-cyan-400/10" />
      <div className="city-orb right-0 top-56 h-80 w-80 bg-orange-400/10" />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card className="city-panel space-y-4">
              <div>
                <Badge>Search and filter</Badge>
                <h1 className="mt-4 text-3xl font-semibold text-white">Discover Nairobi inventory</h1>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Compare across categories, zones, prices, and seller confidence signals without losing the feel of a live market.
                </p>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 size-4 text-cyan-300" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products or areas" className="pl-10" />
                </div>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-sm text-white outline-none">
                  <option value="all">All categories</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select value={location} onChange={(event) => setLocation(event.target.value)} className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-sm text-white outline-none">
                  <option value="all">All locations</option>
                  {[...new Set(products.map((item) => item.location))].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <select value={sort} onChange={(event) => setSort(event.target.value)} className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-sm text-white outline-none">
                  <option value="popularity">Sort by popularity</option>
                  <option value="price">Sort by price</option>
                  <option value="newest">Sort by newest</option>
                </select>
              </div>
            </Card>

            <Card className="city-panel space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <SlidersHorizontal className="size-4 text-cyan-300" />
                Buyer confidence signals
              </div>
              {[
                "Verified seller badge system",
                "Seen today and popular now product cues",
                "Low stock and new arrival visibility",
                "Quick access to seller chat and delivery"
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-white/6 px-4 py-3 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </Card>

            <Card className="city-panel space-y-4">
              <h2 className="text-lg font-semibold text-white">Your pulse</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Saved items</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{favorites.length}</p>
                </div>
                <div className="rounded-3xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recent views</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{recentViews.length}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recently viewed</p>
                {recentViews.map((slug) => (
                  <Link key={slug} href={`/products/${slug}`} className="block rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300 transition hover:bg-white/8">
                    {slug.replaceAll("-", " ")}
                  </Link>
                ))}
              </div>
            </Card>
          </aside>

          <section className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
              <Card className="city-panel overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Live discovery</p>
                  <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold text-white sm:text-5xl">
                    Compare with the speed of city instinct and the clarity of product truth.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                    Search feels alive here because it surfaces not just products, but buying momentum, seller reliability, and zone-by-zone commercial texture.
                  </p>
                </div>
                <div className="grid gap-3">
                  {hotZones.map((zone) => (
                    <div key={zone.name} className="rounded-3xl border border-white/8 bg-slate-950/45 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold text-white">{zone.name}</p>
                        <TrendingUp className="size-4 text-orange-200" />
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{zone.detail}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.22em] text-cyan-200">{zone.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              </Card>
            </motion.div>

            <Card className="city-panel flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Live results</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{filtered.length} products ready to compare</h2>
                <p className="mt-2 text-sm text-slate-400">Faster decisions come from stronger signal density, not from endless scrolling.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-50">Grid view</Badge>
                <Button variant="secondary" size="sm" type="button" onClick={() => toast.info("Grid view is active")}>
                  <Grid2X2 className="size-4" />
                </Button>
                <Button variant="secondary" size="sm" type="button" onClick={() => toast.info("List view can be expanded as a denser comparison mode")}>
                  <ListFilter className="size-4" />
                </Button>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: "Most active badge", value: "Popular now", icon: Sparkles },
                { label: "Best-performing zone", value: "Westlands", icon: TrendingUp },
                { label: "Most valued by buyers", value: "Fast reply sellers", icon: Star }
              ].map((item) => (
                <motion.div key={item.label} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                  <Card className="city-panel">
                  <item.icon className="size-5 text-cyan-200" />
                  <p className="mt-4 text-lg font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.label}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} seller={sellers.find((seller) => seller.id === product.sellerId)} />
              ))}
            </div>

            <Card className="city-panel space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Star className="size-4 fill-orange-300 text-orange-300" />
                Featured seller corridor
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {sellers.map((seller) => (
                  <Link key={seller.id} href="/sellers" className="rounded-3xl border border-white/8 bg-white/5 p-4 transition hover:bg-white/8">
                    <p className="text-base font-semibold text-white">{seller.name}</p>
                    <p className="mt-2 text-sm text-slate-400">{seller.location}</p>
                    <p className="mt-3 text-sm text-slate-300">{seller.responseTime}</p>
                  </Link>
                ))}
              </div>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
