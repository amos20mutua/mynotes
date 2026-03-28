"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { readBrowserVault, writeBrowserVault } from "@/lib/vault/browser-storage";
import {
  materializeVaultData,
  noteToSupabaseRow
} from "@/lib/vault/persistence";
import type { VaultData } from "@/types";

export type VaultRepository = {
  read: () => Promise<VaultData>;
  write: (data: VaultData) => Promise<VaultData>;
};

function extractPublishedVault(data: VaultData) {
  const notes = data.notes.filter((note) => note.visibility === "public");
  return materializeVaultData({ notes, links: [] });
}

async function mirrorPublishedNotes(data: VaultData): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return;
  }

  const publishedVault = extractPublishedVault(data);
  const noteRows = publishedVault.notes.map(noteToSupabaseRow);
  const noteIds = new Set(noteRows.map((row) => row.id));
  const { data: existingNotes, error: existingNotesError } = await client.from("notes").select("id").eq("visibility", "public");

  if (existingNotesError) {
    throw existingNotesError;
  }

  const removableNoteIds = ((existingNotes ?? []) as { id: string }[]).map((row) => row.id).filter((id) => !noteIds.has(id));

  if (noteRows.length > 0) {
    const { error } = await client.from("notes").upsert(noteRows, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }

  if (removableNoteIds.length > 0) {
    const { error } = await client.from("notes").delete().in("id", removableNoteIds);
    if (error) {
      throw error;
    }
  }
}

export const vaultRepository: VaultRepository = {
  async read() {
    return readBrowserVault();
  },
  async write(data) {
    const materializedVault = materializeVaultData(data);
    const localVault = await writeBrowserVault(materializedVault);

    if (!isSupabaseEnabled) {
      return localVault;
    }

    try {
      await mirrorPublishedNotes(localVault);
      return localVault;
    } catch {
      return localVault;
    }
  }
};
