"use client";

import type { Route } from "next";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const allowedRedirects = ["/discover", "/seller", "/operator"] satisfies Route[];

function getInitialAuthState() {
  if (typeof window === "undefined") {
    return { redirect: "/discover" as Route, denied: false };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const requestedRedirect = searchParams.get("redirect");

  return {
    redirect: allowedRedirects.find((route) => route === requestedRedirect) ?? "/discover",
    denied: searchParams.get("denied") === "1"
  };
}

export default function AuthPage() {
  const [{ redirect, denied }] = useState(getInitialAuthState);

  function continueAs(role: "buyer" | "seller" | "operator") {
    document.cookie = `npm-role=${role}; path=/; max-age=2592000; samesite=lax`;
    toast.success(`Continuing as ${role}`, {
      description: "This cookie-based access model keeps local demo routes protected without blocking development."
    });
    window.location.href = redirect;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-5">
          <Badge>Auth and roles</Badge>
          <h1 className="text-4xl font-semibold text-white">Buyer, seller, and operator access</h1>
          <p className="text-base leading-7 text-slate-300">
            The UI is role-aware and the Supabase schema includes role-based access policies. Until credentials are added, auth actions fall back to demo guidance instead of breaking.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Buyer", "Seller", "Operator"].map((role) => (
              <div key={role} className="rounded-3xl bg-white/5 p-4 text-center text-sm font-medium text-slate-200">
                {role}
              </div>
            ))}
          </div>
          {denied ? (
            <div className="rounded-3xl border border-orange-300/20 bg-orange-300/10 p-4 text-sm text-orange-100">
              Your current role does not have access to that route. Switch roles below or sign in with the correct account.
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="secondary" type="button" onClick={() => continueAs("buyer")}>
              Demo buyer
            </Button>
            <Button variant="secondary" type="button" onClick={() => continueAs("seller")}>
              Demo seller
            </Button>
            <Button variant="secondary" type="button" onClick={() => continueAs("operator")}>
              Demo operator
            </Button>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Sign in or create account</h2>
          <Input placeholder="Email address" />
          <Input placeholder="Password" type="password" />
          <select className="h-11 rounded-2xl border border-white/12 bg-slate-950/40 px-4 text-sm text-white outline-none">
            <option>Buyer account</option>
            <option>Seller account</option>
            <option>Operator account</option>
          </select>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="accent"
              type="button"
              onClick={() =>
                toast.info("Demo mode active", {
                  description: "Connect Supabase auth keys to enable password and OTP authentication."
                })
              }
            >
              Sign in
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() =>
                toast.info("Account creation handoff", {
                  description: "Wire this button to Supabase signUp once keys are configured."
                })
              }
            >
              Create account
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
