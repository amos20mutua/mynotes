import { defaultVaultData } from "@/lib/vault/default-vault";
import { normalizeTitle, parseWikiLinks } from "@/lib/vault/graph";
import type { VaultData, VaultLink, VaultNote } from "@/types";

export type SupabaseNoteRow = {
  id: string;
  title: string;
  content: string;
  color_group: string | null;
  x: number | null;
  y: number | null;
  z: number | null;
  created_at: string;
  updated_at: string;
};

export type SupabaseLinkRow = {
  id: string;
  source_note_id: string;
  target_note_id: string;
  created_at: string;
};

function sortNotes(notes: VaultNote[]) {
  return [...notes].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function sortLinks(links: VaultLink[]) {
  return [...links].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

export function normalizeVaultNote(note: VaultNote): VaultNote {
  return {
    ...note,
    title: note.title.trim() || "Untitled note",
    content: note.content ?? "",
    colorGroup: note.colorGroup?.trim() || note.folder?.trim() || "Vault",
    folder: note.folder?.trim() || note.colorGroup?.trim() || "Vault",
    tags: Array.from(new Set((note.tags ?? []).map((tag) => tag.trim()).filter(Boolean))),
    isPinned: note.isPinned ?? false,
    status: note.status ?? "active",
    graphPosition:
      note.graphPosition &&
      Number.isFinite(note.graphPosition.x) &&
      Number.isFinite(note.graphPosition.y) &&
      (note.graphPosition.z === undefined || Number.isFinite(note.graphPosition.z))
        ? {
            x: note.graphPosition.x,
            y: note.graphPosition.y,
            ...(note.graphPosition.z !== undefined ? { z: note.graphPosition.z } : {})
          }
        : undefined
  };
}

export function normalizeVaultLink(link: VaultLink): VaultLink {
  return {
    id: link.id,
    sourceNoteId: link.sourceNoteId,
    targetNoteId: link.targetNoteId,
    createdAt: link.createdAt
  };
}

export function deriveLinksFromNotes(notes: VaultNote[]): VaultLink[] {
  const normalizedNotes = notes.map(normalizeVaultNote);
  const noteByTitle = new Map(normalizedNotes.map((note) => [normalizeTitle(note.title), note] as const));
  const links: VaultLink[] = [];
  const seen = new Set<string>();

  for (const note of normalizedNotes) {
    for (const linkedTitle of parseWikiLinks(note.content)) {
      const target = noteByTitle.get(normalizeTitle(linkedTitle));

      if (!target) {
        continue;
      }

      const key = `${note.id}:${target.id}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      links.push({
        id: `${note.id}:${target.id}`,
        sourceNoteId: note.id,
        targetNoteId: target.id,
        createdAt: note.updatedAt
      });
    }
  }

  return sortLinks(links);
}

export function materializeVaultData(data?: Partial<VaultData> | null): VaultData {
  const workingNotes = Array.isArray(data?.notes) ? data.notes.map((note) => normalizeVaultNote(note as VaultNote)) : [];
  const notes = workingNotes.length > 0 ? workingNotes : defaultVaultData.notes.map(normalizeVaultNote);
  const byNormalizedTitle = new Map(notes.map((note) => [normalizeTitle(note.title), note] as const));

  for (const note of [...notes]) {
    for (const linkedTitle of parseWikiLinks(note.content)) {
      const normalizedLinkedTitle = normalizeTitle(linkedTitle);

      if (byNormalizedTitle.has(normalizedLinkedTitle)) {
        continue;
      }

      const timestamp = new Date().toISOString();
      const createdNote = normalizeVaultNote({
        id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `note-${normalizedLinkedTitle.replace(/\s+/g, "-")}`,
        title: linkedTitle,
        content: `# ${linkedTitle}\n\n`,
        colorGroup: note.colorGroup || note.folder || "Vault",
        folder: note.folder || note.colorGroup || "Vault",
        tags: [],
        isPinned: false,
        status: "draft",
        createdAt: timestamp,
        updatedAt: timestamp
      });

      notes.push(createdNote);
      byNormalizedTitle.set(normalizedLinkedTitle, createdNote);
    }
  }

  const providedLinks = Array.isArray(data?.links) ? data.links.map((link) => normalizeVaultLink(link as VaultLink)) : [];
  const links = providedLinks.length > 0 ? providedLinks : deriveLinksFromNotes(notes);

  return {
    notes: sortNotes(notes),
    links
  };
}

export function noteToSupabaseRow(note: VaultNote): SupabaseNoteRow {
  const normalized = normalizeVaultNote(note);

  return {
    id: normalized.id,
    title: normalized.title,
    content: normalized.content,
    color_group: normalized.colorGroup,
    x: normalized.graphPosition?.x ?? null,
    y: normalized.graphPosition?.y ?? null,
    z: normalized.graphPosition?.z ?? null,
    created_at: normalized.createdAt,
    updated_at: normalized.updatedAt
  };
}

export function supabaseRowToNote(row: SupabaseNoteRow): VaultNote {
  return normalizeVaultNote({
    id: row.id,
    title: row.title,
    content: row.content,
    colorGroup: row.color_group ?? "Vault",
    folder: row.color_group ?? "Vault",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    graphPosition:
      row.x !== null && row.y !== null
        ? {
            x: row.x,
            y: row.y,
            ...(row.z !== null ? { z: row.z } : {})
          }
        : undefined
  });
}

export function linkToSupabaseRow(link: VaultLink): SupabaseLinkRow {
  return {
    id: link.id,
    source_note_id: link.sourceNoteId,
    target_note_id: link.targetNoteId,
    created_at: link.createdAt
  };
}

export function supabaseRowToLink(row: SupabaseLinkRow): VaultLink {
  return {
    id: row.id,
    sourceNoteId: row.source_note_id,
    targetNoteId: row.target_note_id,
    createdAt: row.created_at
  };
}
