import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultVaultData } from "@/lib/vault/default-vault";
import { materializeVaultData } from "@/lib/vault/persistence";
import type { VaultData, VaultNote, VaultNoteStatus } from "@/types";

type NoteMutationFields = Pick<VaultNote, "title" | "content" | "colorGroup" | "folder" | "tags" | "isPinned" | "status" | "schedule" | "graphPosition" | "clusterMode" | "snapshots">;

const vaultDirectory = path.join(process.cwd(), "data");
const vaultFilePath = path.join(vaultDirectory, "vault.json");

function normalizeNote(note: VaultNote): VaultNote {
  return {
    ...note,
    colorGroup: note.colorGroup?.trim() || note.folder?.trim() || "Vault",
    folder: note.folder?.trim() || note.colorGroup?.trim() || "Vault",
    tags: Array.from(new Set((note.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    title: note.title.trim() || "Untitled note",
    clusterMode: note.clusterMode,
    snapshots: note.snapshots?.slice(0, 12),
    graphPosition: note.graphPosition
      ? {
          x: note.graphPosition.x,
          y: note.graphPosition.y,
          ...(note.graphPosition.z !== undefined ? { z: note.graphPosition.z } : {})
        }
      : undefined
  };
}

async function ensureVaultFile() {
  await mkdir(vaultDirectory, { recursive: true });

  try {
    await readFile(vaultFilePath, "utf8");
  } catch {
    await writeFile(vaultFilePath, JSON.stringify(defaultVaultData, null, 2), "utf8");
  }
}

export async function readVault(): Promise<VaultData> {
  await ensureVaultFile();
  const raw = await readFile(vaultFilePath, "utf8");
  const parsed = JSON.parse(raw) as Partial<VaultData>;
  return materializeVaultData({
    notes: Array.isArray(parsed.notes) ? parsed.notes.map((note) => normalizeNote(note as VaultNote)) : [],
    links: Array.isArray(parsed.links) ? parsed.links : []
  });
}

export async function writeVault(data: VaultData) {
  await ensureVaultFile();
  const normalized = materializeVaultData({
    notes: data.notes.map((note) => normalizeNote(note)),
    links: data.links
  });

  await writeFile(vaultFilePath, JSON.stringify(normalized, null, 2), "utf8");
  return normalized;
}

export async function createVaultNote(input?: Partial<NoteMutationFields>) {
  const vault = await readVault();
  const timestamp = new Date().toISOString();
  const note: VaultNote = {
    id: crypto.randomUUID(),
    title: input?.title?.trim() || "Untitled note",
    content: input?.content || "",
    colorGroup: input?.colorGroup?.trim() || input?.folder?.trim() || "Vault",
    folder: input?.folder?.trim() || input?.colorGroup?.trim() || "Vault",
    tags: input?.tags ?? [],
    clusterMode: input?.clusterMode,
    isPinned: input?.isPinned ?? false,
    status: input?.status ?? "draft",
    schedule: input?.schedule,
    snapshots: input?.snapshots,
    graphPosition: input?.graphPosition,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return writeVault({ notes: [note, ...vault.notes], links: vault.links });
}

export async function updateVaultNote(
  noteId: string,
  updates: Partial<NoteMutationFields>
) {
  const vault = await readVault();
  const notes = vault.notes.map((note) =>
    note.id === noteId
      ? normalizeNote({
          ...note,
          ...updates,
          status: (updates.status as VaultNoteStatus | undefined) ?? note.status,
          updatedAt: new Date().toISOString()
        })
      : note
  );

  return writeVault({ notes, links: vault.links });
}

export async function deleteVaultNote(noteId: string) {
  const vault = await readVault();
  return writeVault({
    notes: vault.notes.filter((note) => note.id !== noteId),
    links: vault.links.filter((link) => link.sourceNoteId !== noteId && link.targetNoteId !== noteId)
  });
}
