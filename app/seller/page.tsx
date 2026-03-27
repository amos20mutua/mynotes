"use client";

import { BarChart3, Inbox, PackagePlus, Store } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { products, sellers } from "@/mock/data";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function SellerPage() {
  const seller = sellers[0];
  const sellerProducts = products.filter((product) => product.sellerId === seller.id);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "electronics",
    description: ""
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <Card className="space-y-5">
            <Badge>Seller workspace</Badge>
            <div>
              <h1 className="text-4xl font-semibold text-white">{seller.name}</h1>
              <p className="mt-3 text-base leading-7 text-slate-300">{seller.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Live products", value: String(sellerProducts.length), icon: Store },
                { label: "New leads today", value: "18", icon: Inbox },
                { label: "Potential revenue", value: "KES 74K", icon: BarChart3 },
                { label: "Inventory health", value: "2 low stock", icon: PackagePlus }
              ].map((item) => (
                <div key={item.label} className="rounded-3xl bg-white/5 p-5">
                  <item.icon className="size-5 text-cyan-200" />
                  <p className="mt-4 text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Inbox preview</h2>
              <Button variant="secondary" size="sm" type="button" onClick={() => toast.info("Opening the dedicated chat workspace")}>
                Open messages
              </Button>
            </div>
            {[
              "Buyer asking for evening South B delivery",
              "Buyer requesting extra sneaker photos",
              "Operator confirming rider pickup window"
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Create product</h2>
              <Badge className="border-orange-300/20 bg-orange-300/10 text-orange-100">Optimistic demo form</Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input placeholder="Product name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              <Input placeholder="Price in KES" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} />
              <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="h-11 rounded-2xl border border-white/12 bg-slate-950/40 px-4 text-sm text-white outline-none">
                <option value="electronics">Electronics</option>
                <option value="fashion">Style</option>
                <option value="home">Home</option>
                <option value="beauty">Beauty</option>
              </select>
              <Input placeholder="Pickup location" defaultValue={seller.location} />
            </div>
            <Textarea placeholder="Describe the product in a premium, buyer-helpful way..." value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            <div className="flex flex-wrap gap-3">
              <Button
                variant="accent"
                type="button"
                onClick={() => {
                  if (!form.name || !form.price || !form.description) {
                    toast.error("Complete the required product fields");
                    return;
                  }
                  toast.success("Product staged successfully", {
                    description: "In demo mode, this stays client-side until Supabase is connected."
                  });
                  setForm({ name: "", price: "", category: "electronics", description: "" });
                }}
              >
                Publish product
              </Button>
              <Button variant="secondary" type="button" onClick={() => toast.success("Draft saved locally")}>
                Save draft
              </Button>
            </div>
          </Card>

          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Active inventory</h2>
            {sellerProducts.map((product) => (
              <div key={product.id} className="flex flex-col gap-4 rounded-3xl border border-white/8 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{product.name}</p>
                  <p className="mt-2 text-sm text-slate-400">{product.availability}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-300">{formatCurrency(product.price)}</p>
                  <Button variant="secondary" size="sm" type="button" onClick={() => toast.info(`Editing ${product.name}`)}>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" type="button" onClick={() => toast.success(`${product.name} archived from the demo shelf`)}>
                    Archive
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
