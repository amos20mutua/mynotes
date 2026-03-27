import { ChevronRight, MapPin, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Seller } from "@/types";

export function SellerCard({ seller }: { seller: Seller }) {
  return (
    <Card className="city-panel space-y-5">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-300 to-orange-300 text-lg font-black text-slate-950">
          {seller.logo}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{seller.name}</h3>
            {seller.verified ? <ShieldCheck className="size-4 text-cyan-300" /> : null}
          </div>
          <p className="text-sm text-slate-400">{seller.tagline}</p>
        </div>
      </div>
      <p className="text-sm leading-6 text-slate-300">{seller.description}</p>
      <div className="flex flex-wrap gap-2">
        <Badge>{seller.responseTime}</Badge>
        <Badge className="border-white/6 bg-white/6">
          <MapPin className="mr-1 size-3" />
          {seller.location}
        </Badge>
        <Badge className="border-white/6 bg-white/6">
          <Star className="mr-1 size-3 fill-orange-300 text-orange-300" />
          {seller.rating} / {seller.reviewsCount}
        </Badge>
      </div>
      <Link
        href="/messages"
        className="inline-flex items-center gap-2 text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
      >
        Open seller channel
        <ChevronRight className="size-4" />
      </Link>
    </Card>
  );
}
