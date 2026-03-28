"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseEnabled } from "@/lib/supabase/env";
import { getOrCreateVaultDeviceId, readBrowserVault, writeBrowserVault } from "@/lib/vault/browser-storage";
import {
  materializeVaultData,
  noteToSupabaseRow,
  supabaseRowToNote,
  type SupabaseNoteRow
} from "@/lib/vault/persistence";
import type { VaultData } from "@/types";

export type VaultRepository = {
  read: () => Promise<VaultData>;
  write: (data: VaultData) => Promise<VaultData>;
};

type PrivateSupabaseNoteRow = SupabaseNoteRow & {
  device_id: string;
};

async function readPrivateBackup(): Promise<VaultData | null> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return null;
  }

  const deviceId = getOrCreateVaultDeviceId();
  const { data, error } = await client.from("private_notes").select("*").eq("device_id", deviceId).order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return materializeVaultData({
    notes: (data as PrivateSupabaseNoteRow[]).map((row) => supabaseRowToNote(row)),
    links: []
  });
}

async function mirrorPrivateBackup(data: VaultData): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return;
  }

  const deviceId = getOrCreateVaultDeviceId();
  const privateVault = materializeVaultData(data);
  const noteRows = privateVault.notes.map((note) => ({
    ...noteToSupabaseRow(note),
    device_id: deviceId
  }));
  const noteIds = new Set(noteRows.map((row) => row.id));
  const { data: existingNotes, error: existingNotesError } = await client.from("private_notes").select("id").eq("device_id", deviceId);

  if (existingNotesError) {
    throw existingNotesError;
  }

  const removableNoteIds = ((existingNotes ?? []) as { id: string }[]).map((row) => row.id).filter((id) => !noteIds.has(id));

  if (noteRows.length > 0) {
    const { error } = await client.from("private_notes").upsert(noteRows, { onConflict: "id" });
    if (error) {
      throw error;
    }
  }

  if (removableNoteIds.length > 0) {
    const { error } = await client.from("private_notes").delete().eq("device_id", deviceId).in("id", removableNoteIds);
    if (error) {
      throw error;
    }
  }
}

export const vaultRepository: VaultRepository = {
  async read() {
    const localVault = await readBrowserVault();

    if (localVault.notes.length > 0 || !isSupabaseEnabled) {
      return localVault;
    }

    try {
      const backupVault = await readPrivateBackup();
      if (backupVault) {
        await writeBrowserVault(backupVault);
        return backupVault;
      }
    } catch {
      return localVault;
    }

    return localVault;
  },
  async write(data) {
    const materializedVault = materializeVaultData(data);
    const localVault = await writeBrowserVault(materializedVault);

    if (!isSupabaseEnabled) {
      return localVault;
    }

    try {
      await mirrorPrivateBackup(localVault);
      return localVault;
    } catch {
      return localVault;
    }
  }
};
