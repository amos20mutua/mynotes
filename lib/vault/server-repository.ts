import { defaultVaultData } from "@/lib/vault/default-vault";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { materializeVaultData, supabaseRowToLink, supabaseRowToNote, type SupabaseLinkRow, type SupabaseNoteRow } from "@/lib/vault/persistence";
import type { VaultData } from "@/types";

export async function readInitialVault(): Promise<VaultData> {
  if (!isSupabaseEnabled) {
    return defaultVaultData;
  }

  try {
    const client = await getSupabaseServerClient();

    if (!client) {
      return defaultVaultData;
    }

    const [{ data: notesData, error: notesError }, { data: linksData, error: linksError }] = await Promise.all([
      client.from("notes").select("*").order("updated_at", { ascending: false }),
      client.from("links").select("*").order("created_at", { ascending: true })
    ]);

    if (notesError || linksError || !notesData) {
      return defaultVaultData;
    }

    if (notesData.length === 0) {
      return defaultVaultData;
    }

    return materializeVaultData({
      notes: (notesData as SupabaseNoteRow[]).map(supabaseRowToNote),
      links: (linksData as SupabaseLinkRow[] | null | undefined)?.map(supabaseRowToLink) ?? []
    });
  } catch {
    return defaultVaultData;
  }
}
