"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient() {
  if (!supabaseEnv.url || !supabaseEnv.anonKey) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseEnv.url, supabaseEnv.anonKey);
  }
  return browserClient;
}
