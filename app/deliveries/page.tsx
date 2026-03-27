"use client";

import { MapPin, Truck } from "lucide-react";
import { toast } from "sonner";
import { demoDeliveryRequests } from "@/lib/state/use-market-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

export default function DeliveriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5">
          <Badge>Delivery request flow</Badge>
          <h1 className="text-4xl font-semibold text-white">Request city-wide delivery</h1>
          <p className="text-base leading-7 text-slate-300">
            The MVP includes placeholder fee logic and operator status updates, with room for map routing and rider assignment later.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input placeholder="Product or order reference" defaultValue="Anker Soundcore Rush Mini" />
            <Input placeholder="Seller pickup location" defaultValue="Westlands" />
            <Input placeholder="Dropoff area" defaultValue="South B" />
            <Input placeholder="Customer name" defaultValue="Amani K." />
          </div>
          <Textarea placeholder="Notes for rider or operator" defaultValue="Call on arrival. Office gate opposite the mini mart." />
          <div className="rounded-3xl border border-orange-300/15 bg-orange-300/8 p-4 text-sm text-orange-100">
            Estimated delivery fee: {formatCurrency(450)}. Replace this with maps-based logic when routing keys are added.
          </div>
          <Button
            variant="accent"
            type="button"
            onClick={() =>
              toast.success("Delivery request captured", {
                description: "Operator and seller visibility is ready. Live persistence starts once Supabase is connected."
              })
            }
          >
            <Truck className="size-4" />
            Submit request
          </Button>
        </Card>

        <div className="space-y-4">
          {demoDeliveryRequests.map((request) => (
            <Card key={request.id} className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{request.id}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{request.productSlug.replaceAll("-", " ")}</h2>
                </div>
                <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-50">{request.status}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dropoff</p>
                  <p className="mt-2 text-sm text-white">{request.dropoffArea}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">ETA</p>
                  <p className="mt-2 text-sm text-white">{request.eta}</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Fee</p>
                  <p className="mt-2 text-sm text-white">{formatCurrency(request.fee)}</p>
                </div>
              </div>
              <div className="space-y-3">
                {request.timeline.map((step) => (
                  <div key={step.label} className="flex items-start gap-3">
                    <div className={`mt-1 size-3 rounded-full ${step.complete ? "bg-cyan-300" : "bg-white/20"}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{step.label}</p>
                      <p className="text-sm text-slate-400">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-3xl border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <MapPin className="size-4 text-cyan-300" />
                {request.notes}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
