"use client";

import { create } from "zustand";
import { defaultVaultData } from "@/lib/vault/default-vault";
import { vaultRepository } from "@/lib/vault/repository";
import { materializeVaultData } from "@/lib/vault/persistence";
import type { VaultData, VaultLink, VaultNote } from "@/types";

type NoteMutationFields = Pick<VaultNote, "title" | "content" | "colorGroup" | "folder" | "tags" | "isPinned" | "status" | "schedule" | "graphPosition" | "clusterMode" | "snapshots">;

type VaultState = {
  notes: VaultNote[];
  links: VaultLink[];
  selectedNoteId: string;
  isLoaded: boolean;
  isSaving: boolean;
  loadError: string | null;
  hasHydratedInitialData: boolean;
  initializeVault: (data: VaultData) => void;
  loadVault: () => Promise<void>;
  createNote: (input?: Partial<NoteMutationFields>) => Promise<void>;
  updateNote: (noteId: string, updates: Partial<NoteMutationFields>) => Promise<void>;
  selectNote: (noteId: string) => void;
  deleteNote: (noteId: string) => Promise<void>;
};

function syncVault(set: (partial: Partial<VaultState>) => void, data: VaultData, selectedNoteId?: string) {
  set({
    notes: data.notes,
    links: data.links,
    selectedNoteId: selectedNoteId && data.notes.some((note) => note.id === selectedNoteId) ? selectedNoteId : data.notes[0]?.id ?? "",
    isLoaded: true,
    isSaving: false,
    loadError: null
  });
}

export const useVaultStore = create<VaultState>((set, get) => ({
  notes: [],
  links: [],
  selectedNoteId: "",
  isLoaded: false,
  isSaving: false,
  loadError: null,
  hasHydratedInitialData: false,
  initializeVault: (data) => {
    syncVault(set, data, data.notes[0]?.id);
    set({ hasHydratedInitialData: true });
  },
  loadVault: async () => {
    try {
      const data = await vaultRepository.read();
      syncVault(set, data, get().selectedNoteId);
    } catch (error) {
      set({
        isLoaded: true,
        isSaving: false,
        loadError: error instanceof Error ? error.message : "Could not load vault data"
      });
      throw error;
    }
  },
  createNote: async (input) => {
    const currentVault = { notes: get().notes.length ? get().notes : defaultVaultData.notes, links: get().links.length ? get().links : defaultVaultData.links };
    const timestamp = new Date().toISOString();
    const note: VaultNote = {
      id: crypto.randomUUID(),
      title: input?.title?.trim() || "Untitled note",
      content: input?.content ?? "",
      colorGroup: input?.colorGroup ?? input?.folder ?? "Vault",
      folder: input?.folder ?? "Vault",
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
    const optimisticVault = materializeVaultData({ notes: [note, ...currentVault.notes], links: currentVault.links });
    syncVault(set, optimisticVault, note.id);
    set({ isSaving: true });

    try {
      const nextVault = await vaultRepository.write(optimisticVault);
      syncVault(set, nextVault, note.id);
    } catch (error) {
      syncVault(set, currentVault, currentVault.notes[0]?.id);
      throw error;
    }
  },
  updateNote: async (noteId, updates) => {
    const previousNotes = get().notes;
    const previousLinks = get().links;
    const mergedNotes = previousNotes.map((note) =>
      note.id === noteId
        ? (() => {
            const nextUpdatedAt = new Date().toISOString();
            const nextTitle = updates.title ?? note.title;
            const nextContent = updates.content ?? note.content;
            const latestSnapshot = note.snapshots?.[0];
            const timeSinceLastSnapshot = latestSnapshot ? new Date(note.updatedAt).getTime() - new Date(latestSnapshot.createdAt).getTime() : Number.POSITIVE_INFINITY;
            const contentDelta = Math.abs((nextContent ?? "").length - (note.content ?? "").length);
            const shouldSnapshot =
              typeof updates.title === "string" || typeof updates.content === "string"
                ? (nextTitle !== note.title && nextTitle.trim().length > 0) ||
                  (nextContent !== note.content && (contentDelta > 180 || timeSinceLastSnapshot > 1000 * 60 * 8))
                : false;

            const nextSnapshots = shouldSnapshot
              ? [
                  {
                    id: crypto.randomUUID(),
                    title: note.title,
                    content: note.content,
                    createdAt: note.updatedAt
                  },
                  ...(updates.snapshots ?? note.snapshots ?? [])
                ]
                  .filter((snapshot, index, array) => array.findIndex((entry) => entry.id === snapshot.id) === index)
                  .slice(0, 12)
              : (updates.snapshots ?? note.snapshots);

            return {
              ...note,
              ...updates,
              snapshots: nextSnapshots,
              updatedAt: nextUpdatedAt
            };
          })()
        : note
    );
    const optimisticVault = materializeVaultData({ notes: mergedNotes, links: previousLinks });

    set({ notes: optimisticVault.notes, links: optimisticVault.links, isSaving: true });

    try {
      const data = await vaultRepository.write(optimisticVault);
      syncVault(set, data, noteId);
    } catch (error) {
      set({ notes: previousNotes, links: previousLinks, isSaving: false });
      throw error;
    }
  },
  selectNote: (noteId) => set({ selectedNoteId: noteId }),
  deleteNote: async (noteId) => {
    const previousNotes = get().notes;
    const previousLinks = get().links;
    const currentNotes = previousNotes.filter((note) => note.id !== noteId);
    const optimisticVault = materializeVaultData({ notes: currentNotes, links: previousLinks.filter((link) => link.sourceNoteId !== noteId && link.targetNoteId !== noteId) });
    syncVault(set, optimisticVault);
    set({ isSaving: true });

    try {
      const data = await vaultRepository.write(optimisticVault);
      syncVault(set, data);
    } catch (error) {
      syncVault(set, { notes: previousNotes, links: previousLinks });
      throw error;
    }
  }
}));

export function getSelectedNote(notes: VaultNote[], selectedNoteId: string) {
  return notes.find((note) => note.id === selectedNoteId) ?? notes[0] ?? null;
}
