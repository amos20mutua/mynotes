import { isSupabaseEnabled } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { materializeVaultData, supabaseRowToNote, type SupabaseNoteRow } from "@/lib/vault/persistence";
import { publicVaultData } from "@/lib/vault/public-vault";
import type { VaultData } from "@/types";

export async function readInitialVault(): Promise<VaultData> {
  if (!isSupabaseEnabled) {
    return publicVaultData;
  }

  try {
    const client = await getSupabaseServerClient();

    if (!client) {
      return publicVaultData;
    }

    const { data: notesData, error: notesError } = await client.from("public_notes").select("*").order("updated_at", { ascending: false });

    if (notesError || !notesData) {
      return publicVaultData;
    }

    if (notesData.length === 0) {
      return publicVaultData;
    }

    return materializeVaultData({
      notes: (notesData as SupabaseNoteRow[]).map(supabaseRowToNote),
      links: []
    });
  } catch {
    return { notes: [], links: [] };
  }
}
