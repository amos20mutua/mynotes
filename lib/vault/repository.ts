"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { readBrowserVault, writeBrowserVault } from "@/lib/vault/browser-storage";
import { defaultVaultData } from "@/lib/vault/default-vault";
import {
  deriveLinksFromNotes,
  linkToSupabaseRow,
  materializeVaultData,
  noteToSupabaseRow,
  supabaseRowToLink,
  supabaseRowToNote,
  type SupabaseLinkRow,
  type SupabaseNoteRow
} from "@/lib/vault/persistence";
import type { VaultData } from "@/types";

export type VaultRepository = {
  read: () => Promise<VaultData>;
  write: (data: VaultData) => Promise<VaultData>;
};

async function readSupabaseVault(): Promise<VaultData | null> {
  if (!isSupabaseEnabled) {
    return null;
  }

  const client = getSupabaseBrowserClient();
  if (!client) {
    return null;
  }

  const [{ data: notesData, error: notesError }, { data: linksData, error: linksError }] = await Promise.all([
    client.from("notes").select("*").order("updated_at", { ascending: false }),
    client.from("links").select("*").order("created_at", { ascending: true })
  ]);

  if (notesError) {
    throw notesError;
  }

  if (linksError) {
    throw linksError;
  }

  if (!notesData || notesData.length === 0) {
    return writeSupabaseVault(defaultVaultData);
  }

  return materializeVaultData({
    notes: (notesData as SupabaseNoteRow[]).map(supabaseRowToNote),
    links: (linksData as SupabaseLinkRow[]).map(supabaseRowToLink)
  });
}

async function writeSupabaseVault(data: VaultData): Promise<VaultData> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return materializeVaultData(data);
  }

  const materializedVault = materializeVaultData({
    notes: data.notes,
    links: data.links.length ? data.links : deriveLinksFromNotes(data.notes)
  });
  const noteRows = materializedVault.notes.map(noteToSupabaseRow);
  const linkRows = (materializedVault.links.length ? materializedVault.links : deriveLinksFromNotes(materializedVault.notes)).map(linkToSupabaseRow);
  const noteIds = new Set(noteRows.map((row) => row.id));
  const linkIds = new Set(linkRows.map((row) => row.id));

  const [{ data: existingNotes, error: existingNotesError }, { data: existingLinks, error: existingLinksError }] = await Promise.all([
    client.from("notes").select("id"),
    client.from("links").select("id")
  ]);

  if (existingNotesError) {
    throw existingNotesError;
  }

  if (existingLinksError) {
    throw existingLinksError;
  }

  const removableNoteIds = ((existingNotes ?? []) as { id: string }[]).map((row) => row.id).filter((id) => !noteIds.has(id));
  const removableLinkIds = ((existingLinks ?? []) as { id: string }[]).map((row) => row.id).filter((id) => !linkIds.has(id));

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

  if (linkRows.length > 0) {
    const { error } = await client.from("links").upsert(linkRows, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }

  if (removableLinkIds.length > 0) {
    const { error } = await client.from("links").delete().in("id", removableLinkIds);
    if (error) {
      throw error;
    }
  }

  return materializedVault;
}

export const vaultRepository: VaultRepository = {
  async read() {
    if (!isSupabaseEnabled) {
      return readBrowserVault();
    }

    try {
      const supabaseVault = await readSupabaseVault();
      if (supabaseVault) {
        await writeBrowserVault(supabaseVault);
        return supabaseVault;
      }
    } catch {
      return readBrowserVault();
    }

    return readBrowserVault();
  },
  async write(data) {
    const materializedVault = materializeVaultData(data);
    const localVault = await writeBrowserVault(materializedVault);

    if (!isSupabaseEnabled) {
      return localVault;
    }

    try {
      const storedVault = await writeSupabaseVault(localVault);
      await writeBrowserVault(storedVault);
      return storedVault;
    } catch {
      return localVault;
    }
  }
};
