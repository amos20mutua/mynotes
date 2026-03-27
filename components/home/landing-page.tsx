"use client";

import Link from "next/link";
import { ArrowRight, Bike, ChartNoAxesCombined, Clock3, MessageCircle, Search, ShieldCheck, Sparkles, Store, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { categories, metrics, sellers, testimonials } from "@/mock/data";
import { getFeaturedProducts, getTrendingProducts } from "@/lib/services/marketplace";
import { ProductCard } from "@/components/market/product-card";
import { SellerCard } from "@/components/market/seller-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeading } from "@/components/shared/section-heading";

const tickerItems = [
  "Rush Mini up 14% in Westlands",
  "Kilimani deliveries peaking after 6PM",
  "Beauty category conversion strongest in CBD",
  "Median seller reply time now 6 mins",
  "South B and Kasarani showing fastest repeat demand"
];

export function LandingPage() {
  const featuredProducts = getFeaturedProducts();
  const trendingProducts = getTrendingProducts();

  return (
    <div className="relative overflow-hidden">
      <div className="city-orb left-[-8rem] top-20 h-72 w-72 bg-cyan-400/12" />
      <div className="city-orb right-[-10rem] top-32 h-96 w-96 bg-orange-400/12" />
      <div className="city-orb bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 bg-sky-400/10" />

      <section className="relative city-grid">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(2,6,23,0.2)_0%,rgba(2,6,23,0)_18%,rgba(2,6,23,0)_70%,rgba(2,6,23,0.28)_100%)]" />
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="ticker-shell rounded-full border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-xl">
            <div className="ticker-track text-xs uppercase tracking-[0.26em] text-slate-300">
              {[...tickerItems, ...tickerItems].map((item, index) => (
                <span key={`${item}-${index}`} className="inline-flex items-center gap-4">
                  <span className="text-cyan-300">Pulse</span>
                  <span>{item}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="space-y-8"
          >
            <div className="space-y-5">
              <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-50">Nairobi commerce, reimagined with product discipline</Badge>
              <div className="max-w-4xl space-y-5">
                <p className="text-sm uppercase tracking-[0.36em] text-slate-500">Search. Compare. Chat. Deliver.</p>
                <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold leading-[0.95] sm:text-6xl xl:text-7xl">
                  <span className="text-white">A living marketplace for the city that never shops in a straight line.</span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Nairobi Pulse Market brings the speed of city trade, the confidence of trusted sellers, and the clarity of serious product design into one premium buying flow.
                </p>
              </div>
            </div>

            <div className="city-panel pulse-line rounded-[34px] border border-white/10 bg-white/7 p-4 shadow-[0_24px_90px_rgba(2,8,23,0.42)] backdrop-blur-2xl">
              <form action="/discover" className="grid gap-4 xl:grid-cols-[1.2fr_0.7fr_0.7fr_auto]">
                <div className="flex items-center gap-3 rounded-[26px] bg-slate-950/60 px-4 py-4">
                  <Search className="size-5 text-cyan-300" />
                  <input
                    name="q"
                    placeholder="Search headphones, sneakers, serum, home upgrades..."
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>
                <div className="rounded-[26px] bg-slate-950/55 px-4 py-4 text-sm text-slate-300">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Zone</p>
                  <p className="mt-2">Westlands to South B</p>
                </div>
                <div className="rounded-[26px] bg-slate-950/55 px-4 py-4 text-sm text-slate-300">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Signal</p>
                  <p className="mt-2">Best price + fast reply</p>
                </div>
                <Button type="submit" variant="accent" className="h-auto rounded-[26px] px-6 py-4">
                  Start discovery
                  <ArrowRight className="size-4" />
                </Button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                <span className="text-slate-500">Moving now:</span>
                <span className="rounded-full bg-white/6 px-3 py-1">Night runner sneakers</span>
                <span className="rounded-full bg-white/6 px-3 py-1">Portable speakers</span>
                <span className="rounded-full bg-white/6 px-3 py-1">Glow serums</span>
                <span className="rounded-full bg-white/6 px-3 py-1">Gift-ready homeware</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
              <Card className="city-panel grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[24px] border border-white/8 bg-white/4 p-5">
                    <p className="text-3xl font-semibold text-white">{metric.value}</p>
                    <p className="mt-2 text-sm font-medium text-slate-200">{metric.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{metric.detail}</p>
                  </div>
                ))}
              </Card>
              <Card className="city-panel space-y-4 bg-gradient-to-br from-orange-300/18 via-white/5 to-cyan-300/14">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Tonight&apos;s buying mood</p>
                <h3 className="text-2xl font-semibold text-white">Fast, style-aware, and delivery-sensitive.</h3>
                <p className="text-sm leading-6 text-slate-300">
                  After-work traffic is spiking in footwear, compact audio, and quick-turn beauty. The interface reflects that with urgency and clarity.
                </p>
              </Card>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="grid gap-4"
          >
            <Card className="city-panel overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))]">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">Pulse board</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Market energy with operator depth</h3>
                  </div>
                  <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-200">
                    Live buyer intent
                  </div>
                </div>
                <div className="grid gap-3">
                  {[
                    { label: "Seen today", value: "Rush Mini speaker is climbing in saves and chat starts", accent: "from-cyan-300/20 to-cyan-300/5" },
                    { label: "Fastest reply", value: "Westlands Wave is converting because answers land in under 4 minutes", accent: "from-white/8 to-white/2" },
                    { label: "Delivery pressure", value: "South B and Kilimani evening drops need fast dispatch clarity", accent: "from-orange-300/18 to-orange-300/4" }
                  ].map((item) => (
                    <div key={item.label} className={`rounded-3xl border border-white/8 bg-gradient-to-r ${item.accent} p-4`}>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="city-panel bg-gradient-to-br from-cyan-300/16 to-cyan-300/4">
                <MessageCircle className="mb-5 size-6 text-cyan-200" />
                <h4 className="text-lg font-semibold text-white">Chat with context</h4>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Buyers move from card to conversation without losing trust signals, price context, or delivery intent.
                </p>
              </Card>
              <Card className="city-panel bg-gradient-to-br from-orange-300/16 to-orange-300/4">
                <Bike className="mb-5 size-6 text-orange-200" />
                <h4 className="text-lg font-semibold text-white">Delivery confidence</h4>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Request city-wide dropoff with clean operator visibility, timeline updates, and realistic fee placeholders.
                </p>
              </Card>
            </div>

            <Card className="city-panel">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Conversion architecture</p>
                  <h4 className="mt-2 text-xl font-semibold text-white">What makes this feel like a real product</h4>
                </div>
                <Sparkles className="size-5 text-orange-200" />
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  ["Comparison first", "Cards expose enough signal to encourage decisions before the detail page."],
                  ["Seller humanity", "Profiles and response speed make commerce feel person-to-person, not anonymous."],
                  ["Operational realism", "Delivery and operator views are treated like product surfaces, not afterthoughts."]
                ].map(([title, text]) => (
                  <div key={title} className="rounded-3xl bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            eyebrow="Featured categories"
            title="Built around Nairobi&apos;s fast-moving demand clusters"
            description="These are not decorative categories. They are buying corridors shaped by city behavior, delivery urgency, and price awareness."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {categories.map((category, index) => (
              <motion.div key={category.id} whileHover={{ y: -6 }} transition={{ duration: 0.22 }}>
                <Card className={`city-panel bg-gradient-to-br ${category.accent}`}>
                  <div className="rounded-[24px] border border-white/10 bg-slate-950/62 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">0{index + 1}</p>
                    <p className="mt-3 text-xl font-semibold text-white">{category.name}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{category.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Trending now"
            title="A catalogue designed for comparison, not scrolling fatigue"
            description="Each card carries just enough pricing, trust, and utility signal to feel like a buying tool instead of a poster."
          />
          <Button asChild variant="secondary" className="hidden sm:inline-flex">
            <Link href="/discover">Browse all</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} seller={sellers.find((seller) => seller.id === product.sellerId)} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="city-panel overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="border-white/10 bg-white/8 text-white">How the city moves through the app</Badge>
                <h2 className="mt-4 text-4xl font-semibold text-white">Search, compare, chat, deliver. No dead space.</h2>
              </div>
              <ChartNoAxesCombined className="hidden size-10 text-cyan-200 md:block" />
            </div>
            <div className="mt-8 grid gap-4">
              {[
                { icon: Search, title: "Search with commercial intent", text: "Results emphasize signal density, location clarity, and fast category-to-product movement." },
                { icon: MessageCircle, title: "Chat that feels personal", text: "Seller conversation is treated as part of the shopping journey, not a support sidebar." },
                { icon: Bike, title: "Delivery with narrative", text: "Status changes feel tangible because the timeline is presented like live logistics, not admin debris." },
                { icon: Store, title: "Seller tools that respect hustle", text: "Dashboards focus on inventory, leads, and buyer momentum instead of empty analytics theatre." }
              ].map((step) => (
                <motion.div
                  key={step.title}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.18 }}
                  className="grid gap-4 rounded-[28px] border border-white/8 bg-white/4 p-5 md:grid-cols-[auto_1fr_auto] md:items-center"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-white/8">
                    <step.icon className="size-5 text-cyan-200" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{step.text}</p>
                  </div>
                  <ArrowRight className="hidden size-5 text-slate-500 md:block" />
                </motion.div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4">
            <Card className="city-panel bg-gradient-to-br from-white/7 via-white/4 to-cyan-300/10">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Dispatch pressure</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Peak window", value: "5:30PM - 8:30PM", icon: Clock3 },
                  { label: "Top route", value: "Westlands -> South B", icon: Zap },
                  { label: "Most requested", value: "Same-day dropoff", icon: Bike }
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl bg-slate-950/45 p-4">
                    <item.icon className="size-5 text-orange-200" />
                    <p className="mt-4 text-sm font-semibold text-white">{item.value}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="city-panel">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Trust infrastructure</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Believability built into the core loop</h3>
                </div>
                <ShieldCheck className="size-6 text-cyan-300" />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  "Seller verification structure",
                  "Ratings and reviews",
                  "Report listing flow",
                  "Favorites and recent views",
                  "Operator moderation visibility",
                  "Graceful demo mode"
                ].map((item) => (
                  <div key={item} className="rounded-3xl border border-white/8 bg-white/4 px-4 py-4 text-sm text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Featured sellers"
            title="Shops with identity, local intelligence, and response discipline"
            description="The marketplace feels more premium because sellers look like actual businesses with taste, speed, and accountability."
          />
          <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
            <ShieldCheck className="mr-2 size-3.5" />
            Verification ready
          </Badge>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {sellers.map((seller) => (
            <SellerCard key={seller.id} seller={seller} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <Card className="city-panel space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Buyer voice</p>
              <h2 className="mt-3 text-4xl font-semibold text-white">The product should feel like it already has a loyal base.</h2>
            </div>
            <div className="grid gap-4">
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="rounded-[28px] border border-white/8 bg-white/4 p-5">
                  <p className="text-base leading-7 text-slate-200">&ldquo;{testimonial.quote}&rdquo;</p>
                  <p className="mt-4 text-sm font-medium text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-400">{testimonial.role}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="city-panel overflow-hidden bg-gradient-to-br from-orange-300/14 via-white/4 to-cyan-300/12">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Launch rationale</p>
            <h3 className="mt-3 text-3xl font-semibold text-white">This is built to look funded before it looks finished.</h3>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Strong product companies earn trust through sharp decisions: what to show, what to animate, what to simplify, and what to make feel live. Nairobi Pulse Market leans into that.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Dense but readable information hierarchy",
                "Localized language and realistic commercial cues",
                "Operational tools treated as premium product surfaces"
              ].map((item) => (
                <div key={item} className="rounded-3xl bg-slate-950/45 px-4 py-4 text-sm text-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 pb-24 sm:px-6 lg:px-8">
        <Card className="city-panel overflow-hidden bg-gradient-to-r from-white/8 via-cyan-300/10 to-orange-300/10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <Badge className="border-white/10 bg-white/10 text-white">Ready to move with the city?</Badge>
              <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold text-white sm:text-5xl">
                Start comparing smarter. Start selling sharper.
              </h2>
              <p className="max-w-xl text-base leading-7 text-slate-200">
                Buyers get clarity. Sellers get intent-rich traffic. Operators get structured fulfilment visibility. The whole experience feels alive from day one.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="accent">
                  <Link href="/discover">Explore products</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/seller">Open seller workspace</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              {trendingProducts.slice(0, 3).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between rounded-3xl border border-white/8 bg-slate-950/45 px-4 py-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">0{index + 1} trending</p>
                    <p className="mt-1 text-sm font-medium text-white">{product.name}</p>
                    <p className="text-sm text-slate-400">{product.location}</p>
                  </div>
                  <p className="text-sm text-cyan-200">{product.seenToday} views today</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <div className="fixed inset-x-4 bottom-4 z-40 sm:hidden">
          <Button asChild variant="accent" className="w-full">
            <Link href="/discover">Search Nairobi deals</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
