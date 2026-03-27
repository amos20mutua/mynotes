import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseEnv } from "@/lib/supabase/env";

export async function getSupabaseServerClient() {
  if (!supabaseEnv.url || !supabaseEnv.anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient(supabaseEnv.url, supabaseEnv.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      }
    }
  });
}
