"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deliveryRequests, products, sellers } from "@/mock/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow } from "@/components/ui/table";

export default function OperatorPage() {
  const [query, setQuery] = useState("");
  const visibleRequests = deliveryRequests.filter((request) =>
    `${request.id} ${request.dropoffArea} ${request.status}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge>Admin and operator panel</Badge>
            <h1 className="mt-4 text-4xl font-semibold text-white">Marketplace control room</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
              Monitor users, sellers, product moderation, delivery statuses, and chat metadata with clean operational clarity.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={() => toast.success("Summary export queued")}>
              Export summary
            </Button>
            <Button variant="accent" type="button" onClick={() => toast.info("Flagged listing review queue opened")}>
              Review flagged listings
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Users", value: "1,248" },
            { label: "Sellers", value: String(sellers.length) },
            { label: "Products", value: String(products.length) },
            { label: "Live deliveries", value: String(deliveryRequests.length) }
          ].map((metric) => (
            <Card key={metric.label} className="space-y-2">
              <p className="text-3xl font-semibold text-white">{metric.value}</p>
              <p className="text-sm text-slate-400">{metric.label}</p>
            </Card>
          ))}
        </div>

        <Card className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search deliveries by status, area, or request ID"
          />
          <Badge className="border-cyan-300/20 bg-cyan-300/10 text-cyan-50">{visibleRequests.length} results</Badge>
        </Card>

        <Table>
          <TableHeader>
            <span>Seller</span>
            <span>Listing status</span>
            <span>Delivery</span>
            <span>Action</span>
          </TableHeader>
          {visibleRequests.map((request, index) => (
            <TableRow key={request.id}>
              <span className="text-white">{sellers[index % sellers.length]?.name}</span>
              <span className="text-slate-300">{products[index % products.length]?.name}</span>
              <span className="text-slate-300">{request.status}</span>
              <span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" type="button">
                      Update
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update delivery status</DialogTitle>
                      <DialogDescription>
                        Confirm the next operational state for {request.id}. In demo mode this action shows a confirmation toast.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {["Confirmed", "Picked", "In Transit", "Delivered"].map((status) => (
                        <Button
                          key={status}
                          variant="secondary"
                          type="button"
                          onClick={() => toast.success(`${request.id} marked as ${status}`)}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </span>
            </TableRow>
          ))}
        </Table>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Moderation priorities</h2>
            {[
              "2 listings flagged for price mismatch review",
              "1 new seller awaiting verification document review",
              "4 deliveries pending rider assignment"
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/8 bg-white/5 p-4 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </Card>
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Chat visibility summary</h2>
            <p className="text-sm leading-6 text-slate-400">
              Metadata-only summary is shown here for operator context. Full message visibility should remain role-restricted unless policy explicitly allows it.
            </p>
            <div className="grid gap-3">
              {[
                "8 active buyer-to-seller conversations",
                "Median reply time: 6 minutes",
                "2 chats mention delivery urgency"
              ].map((item) => (
                <div key={item} className="rounded-3xl bg-white/5 p-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </Card>
          <Card className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Seller roster snapshot</h2>
            {sellers.map((seller) => (
              <div key={seller.id} className="flex items-center justify-between rounded-3xl bg-white/5 p-4">
                <div>
                  <p className="font-medium text-white">{seller.name}</p>
                  <p className="text-sm text-slate-400">{seller.location}</p>
                </div>
                <Badge className="border-white/10 bg-white/8 text-slate-200">{seller.verified ? "Verified" : "Pending review"}</Badge>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
