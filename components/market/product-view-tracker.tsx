"use client";

import { useEffect } from "react";
import { useMarketStore } from "@/lib/state/use-market-store";

export function ProductViewTracker({ slug }: { slug: string }) {
  const pushRecentView = useMarketStore((state) => state.pushRecentView);

  useEffect(() => {
    pushRecentView(slug);
  }, [pushRecentView, slug]);

  return null;
}
