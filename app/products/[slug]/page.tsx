import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heart, MessageCircle, ShieldCheck, Star, Truck } from "lucide-react";
import { products, sellers } from "@/mock/data";
import { getProductBySlug, getRelatedProducts, getReviewsForProduct, getSellerById } from "@/lib/services/marketplace";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/market/product-card";
import { ProductViewTracker } from "@/components/market/product-view-tracker";
import { formatCurrency } from "@/lib/utils";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolvedParams = await params;
  const product = getProductBySlug(resolvedParams.slug);
  return {
    title: product ? product.name : "Product not found"
  };
}

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = await params;
  const product = getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const seller = getSellerById(product.sellerId);
  const related = getRelatedProducts(product.category, product.slug);
  const productReviews = getReviewsForProduct(product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <ProductViewTracker slug={product.slug} />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="relative h-[440px] overflow-hidden rounded-[36px] border border-white/10">
            <Image src={product.image} alt={product.name} fill className="object-cover" />
            <div className="absolute left-5 top-5 flex gap-2">
              {product.badges.map((badge) => (
                <Badge key={badge} className="border-white/14 bg-slate-950/50 text-white">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {product.gallery.map((image) => (
              <div key={image} className="relative h-32 overflow-hidden rounded-[24px] border border-white/10">
                <Image src={image} alt={product.name} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="space-y-5">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.22em] text-slate-400">{product.location}</p>
              <h1 className="text-4xl font-semibold text-white">{product.name}</h1>
              <p className="text-base leading-7 text-slate-300">{product.description}</p>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <Star className="size-4 fill-orange-300 text-orange-300" />
                {product.rating} ({product.reviewsCount})
              </div>
              <div>{product.seenToday} seen today</div>
              <div>{product.availability}</div>
            </div>

            <div className="flex items-end justify-between rounded-[28px] bg-white/5 p-5">
              <div>
                <p className="text-3xl font-semibold text-white">{formatCurrency(product.price)}</p>
                {product.compareAtPrice ? <p className="text-sm text-slate-400 line-through">{formatCurrency(product.compareAtPrice)}</p> : null}
              </div>
              <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-50">{product.stock} units ready</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="accent">
                <Link href="/messages">
                  <MessageCircle className="size-4" />
                  Chat seller
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/deliveries">
                  <Truck className="size-4" />
                  Request delivery
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/auth">
                  <Heart className="size-4" />
                  Save item
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/operator">Report listing</Link>
              </Button>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{seller?.name}</h2>
              {seller?.verified ? <ShieldCheck className="size-5 text-cyan-300" /> : null}
            </div>
            <p className="text-sm leading-6 text-slate-300">{seller?.description}</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Location", value: seller?.location ?? "Nairobi" },
                { label: "Reply speed", value: seller?.responseTime ?? "Fast replies" },
                { label: "Rating", value: `${seller?.rating ?? 4.8} / 5` }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/6 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-sm text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Product details</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {product.specs.map((spec) => (
                <div key={spec.label} className="rounded-2xl bg-white/6 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{spec.label}</p>
                  <p className="mt-2 text-sm text-white">{spec.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1fr]">
        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Buyer reviews</h2>
          {productReviews.map((review) => (
            <div key={review.id} className="rounded-3xl border border-white/8 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium text-white">{review.author}</p>
                <p className="text-sm text-slate-400">{review.createdAt}</p>
              </div>
              <p className="mt-2 text-sm text-orange-200">Rating {review.rating}/5</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{review.comment}</p>
            </div>
          ))}
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Similar products</h2>
          <div className="grid gap-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} seller={sellers.find((seller) => seller.id === item.sellerId)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
