"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Heart, MapPin, MessageCircle, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useMarketStore } from "@/lib/state/use-market-store";
import type { Product, Seller } from "@/types";

export function ProductCard({ product, seller }: { product: Product; seller: Seller | undefined }) {
  const favorites = useMarketStore((state) => state.favorites);
  const toggleFavorite = useMarketStore((state) => state.toggleFavorite);

  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }}>
      <Card className="group overflow-hidden p-0">
        <div className="relative h-64 overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {product.badges.map((badge) => (
              <Badge key={badge} className="border-cyan-300/20 bg-slate-950/50 text-white">
                {badge}
              </Badge>
            ))}
          </div>
          <button
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-white/15 bg-slate-950/40 text-white backdrop-blur-xl"
            onClick={() => toggleFavorite(product.slug)}
            aria-label="Toggle favorite"
            type="button"
          >
            <Heart className={`size-4 ${favorites.includes(product.slug) ? "fill-orange-300 text-orange-300" : ""}`} />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {product.location}
            </span>
            <span>{product.seenToday} seen today</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Link href={`/products/${product.slug}`} className="text-lg font-semibold text-white transition hover:text-cyan-200">
                {product.name}
              </Link>
              <p className="text-sm leading-6 text-slate-400">{product.shortDescription}</p>
            </div>
            <div className="rounded-2xl bg-white/6 px-3 py-2 text-right">
              <p className="text-lg font-semibold text-white">{formatCurrency(product.price)}</p>
              {product.compareAtPrice ? <p className="text-xs text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</p> : null}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Star className="size-4 fill-orange-300 text-orange-300" />
              <span>{product.rating}</span>
              <span className="text-slate-500">({product.reviewsCount})</span>
            </div>
            <span className="max-w-[9rem] truncate">{seller?.name ?? "Trusted seller"}</span>
          </div>

          <div className="rounded-[24px] border border-white/8 bg-white/4 p-3">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-500">
              <span>Comparison edge</span>
              <span>{product.availability}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-center text-slate-300">{product.specs[0]?.value}</div>
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-center text-slate-300">{product.specs[1]?.value}</div>
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-center text-slate-300">{product.specs[2]?.value}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="accent" className="flex-1">
              <Link href={`/products/${product.slug}`}>
                Compare details
                <ArrowUpRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="default">
              <Link href="/messages">
                <MessageCircle className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
