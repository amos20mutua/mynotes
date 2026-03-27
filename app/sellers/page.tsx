import { sellers } from "@/mock/data";
import { SellerCard } from "@/components/market/seller-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function SellersPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-5">
        <Badge>Seller directory</Badge>
        <h1 className="text-4xl font-semibold text-white">Featured Nairobi sellers</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Shops are represented with trust cues, response speed, and local context so buyers feel like they are dealing with real businesses.
        </p>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {sellers.map((seller) => (
          <SellerCard key={seller.id} seller={seller} />
        ))}
      </div>
      <Card className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Verification system", "Structured seller badges for trust and moderation"],
          ["Seller analytics", "Compact KPIs for views, chats, and conversions"],
          ["Inventory visibility", "Low-stock clarity so buyers act with confidence"]
        ].map(([title, detail]) => (
          <div key={title} className="rounded-3xl bg-white/5 p-5">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm text-slate-400">{detail}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
