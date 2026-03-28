import { isSupabaseEnabled } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { materializeVaultData, supabaseRowToNote, type SupabaseNoteRow } from "@/lib/vault/persistence";
import type { VaultData } from "@/types";

export async function readInitialVault(): Promise<VaultData> {
  if (!isSupabaseEnabled) {
    return { notes: [], links: [] };
  }

  try {
    const client = await getSupabaseServerClient();

    if (!client) {
      return { notes: [], links: [] };
    }

    const { data: notesData, error: notesError } = await client.from("notes").select("*").eq("visibility", "public").order("updated_at", { ascending: false });

    if (notesError || !notesData) {
      return { notes: [], links: [] };
    }

    if (notesData.length === 0) {
      return { notes: [], links: [] };
    }

    return materializeVaultData({
      notes: (notesData as SupabaseNoteRow[]).map(supabaseRowToNote),
      links: []
    });
  } catch {
    return { notes: [], links: [] };
  }
}
