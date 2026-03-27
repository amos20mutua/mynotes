"use client";

import { ArrowLeft, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraphErrorBoundary } from "@/components/vault/graph-error-boundary";
import { GraphView } from "@/components/vault/graph-view";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { defaultVaultData } from "@/lib/vault/default-vault";
import { getBacklinks, normalizeTitle } from "@/lib/vault/graph";
import { getSelectedNote, useVaultStore } from "@/lib/state/use-vault-store";
import type { VaultData, VaultNote } from "@/types";

type VaultWorkspaceProps = {
  initialVault: VaultData;
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function openExistingOrCreateLinkedNote(
  title: string,
  notes: VaultNote[],
  selectedNote: VaultNote | null,
  selectNote: (noteId: string) => void,
  createNote: (input?: Partial<Pick<VaultNote, "title" | "content" | "colorGroup" | "folder" | "tags" | "isPinned" | "status" | "graphPosition">>) => Promise<void>,
  updateNote: (noteId: string, updates: Partial<Pick<VaultNote, "title" | "content" | "colorGroup" | "folder" | "tags" | "isPinned" | "status" | "graphPosition">>) => Promise<void>
) {
  const existing = notes.find((note) => normalizeTitle(note.title) === normalizeTitle(title));

  if (existing) {
    selectNote(existing.id);
    return Promise.resolve("existing" as const);
  }

  return createNote({
    title,
    colorGroup: selectedNote?.colorGroup ?? selectedNote?.folder ?? "Vault",
    folder: selectedNote?.folder ?? "Vault",
    status: "draft",
    content: `# ${title}\n\nLinked from [[${selectedNote?.title ?? "Welcome to Obsidian Vault"}]]`
  }).then(async () => {
    const latest = useVaultStore.getState().notes[0];

    if (latest) {
      await updateNote(latest.id, {
        title,
        colorGroup: selectedNote?.colorGroup ?? selectedNote?.folder ?? "Vault",
        folder: selectedNote?.folder ?? "Vault",
        content: `# ${title}\n\nLinked from [[${selectedNote?.title ?? "Welcome to Obsidian Vault"}]]`
      });
      selectNote(latest.id);
    }

    return "created" as const;
  });
}

export function VaultWorkspace({ initialVault }: VaultWorkspaceProps) {
  const notes = useVaultStore((state) => state.notes);
  const links = useVaultStore((state) => state.links);
  const selectedNoteId = useVaultStore((state) => state.selectedNoteId);
  const isLoaded = useVaultStore((state) => state.isLoaded);
  const isSaving = useVaultStore((state) => state.isSaving);
  const loadError = useVaultStore((state) => state.loadError);
  const hasHydratedInitialData = useVaultStore((state) => state.hasHydratedInitialData);
  const initializeVault = useVaultStore((state) => state.initializeVault);
  const loadVault = useVaultStore((state) => state.loadVault);
  const createNote = useVaultStore((state) => state.createNote);
  const updateNote = useVaultStore((state) => state.updateNote);
  const selectNote = useVaultStore((state) => state.selectNote);
  const deleteNote = useVaultStore((state) => state.deleteNote);
  const [activeView, setActiveView] = useState<"vault" | "note">("vault");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const seedNotes = initialVault.notes.length > 0 ? initialVault.notes : defaultVaultData.notes;
  const seedLinks = initialVault.links.length > 0 ? initialVault.links : defaultVaultData.links;
  const effectiveNotes = isLoaded ? notes : seedNotes;
  const effectiveLinks = isLoaded ? links : seedLinks;
  const effectiveSelectedNoteId = isLoaded ? selectedNoteId : seedNotes[0]?.id ?? "";
  const selectedNote = getSelectedNote(effectiveNotes, effectiveSelectedNoteId);
  const backlinks = getBacklinks(effectiveNotes, selectedNote, effectiveLinks);

  useEffect(() => {
    if (!hasHydratedInitialData) {
      initializeVault(initialVault);
    }
  }, [hasHydratedInitialData, initializeVault, initialVault]);

  useEffect(() => {
    loadVault().catch(() => {
      toast.error("Could not refresh vault data");
    });
  }, [loadVault]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;

      if (event.key === "Escape" && activeView === "note" && !isTyping) {
        event.preventDefault();
        setActiveView("vault");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeView]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  async function queueSave(updates: Partial<Pick<VaultNote, "title" | "content">>) {
    if (!selectedNote) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateNote(selectedNote.id, updates);
      } catch {
        toast.error("Could not save note");
      }
    }, 420);
  }

  async function openLinkedNote(title: string) {
    try {
      const result = await openExistingOrCreateLinkedNote(title, effectiveNotes, selectedNote, selectNote, createNote, updateNote);
      setActiveView("note");

      if (result === "created") {
        toast.success(`Created linked note: ${title}`);
      }
    } catch {
      toast.error("Could not open linked note");
    }
  }

  if (loadError && effectiveNotes.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-xl p-8 text-center">
          <p className="text-lg font-semibold text-white">Could not load the vault</p>
          <p className="mt-2 text-sm text-slate-400">{loadError}</p>
          <div className="mt-5">
            <Button variant="accent" type="button" onClick={() => void loadVault()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!isLoaded && seedNotes.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
          <LoaderCircle className="size-4 animate-spin" />
          Loading your vault...
        </div>
      </div>
    );
  }

  if (isLoaded && effectiveNotes.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-xl p-8 text-center">
          <p className="text-lg font-semibold text-white">Your vault is empty</p>
          <p className="mt-2 text-sm text-slate-400">Create your first note and the sphere will begin to grow.</p>
          <div className="mt-5">
            <Button
              variant="accent"
              type="button"
              onClick={async () => {
                await createNote({ colorGroup: "Vault", folder: "Vault", status: "draft" });
                setActiveView("vault");
              }}
            >
              <Plus className="size-4" />
              Create first note
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (activeView === "vault") {
    return (
      <div className="mx-auto max-w-[1800px] px-2 py-3 sm:px-3 lg:px-4">
        <GraphErrorBoundary
          fallback={
            <Card className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-lg font-semibold text-white">The graph hit a rendering error.</p>
              <Button variant="secondary" type="button" onClick={() => setActiveView("note")}>
                Open note view
              </Button>
            </Card>
          }
        >
          <GraphView
            notes={effectiveNotes}
            links={effectiveLinks}
            selectedNote={selectedNote}
            onSelectNote={selectNote}
            onOpenLinkedNote={(title) => {
              void openLinkedNote(title);
            }}
            onOpenEditor={() => setActiveView("note")}
            onCreateNoteAtPoint={async (title, graphPosition, connectToTitle) => {
              const anchorTitle = connectToTitle ?? selectedNote?.title ?? "Welcome to Obsidian Vault";
              await createNote({
                title,
                colorGroup: selectedNote?.colorGroup ?? selectedNote?.folder ?? "Vault",
                folder: "Vault",
                status: "draft",
                graphPosition,
                content: `# ${title}\n\nLinked from [[${anchorTitle}]]\n\n`
              });
            }}
            onDeleteNote={async (noteId) => {
              try {
                await deleteNote(noteId);
                toast.success("Note deleted");
              } catch {
                toast.error("Could not delete note");
              }
            }}
          />
        </GraphErrorBoundary>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-5 transition-all duration-300 ease-out sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-950/55 p-5 backdrop-blur-2xl transition-all duration-300 ease-out sm:p-7">
        {selectedNote ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="secondary" size="sm" type="button" onClick={() => setActiveView("vault")}>
                <ArrowLeft className="size-4" />
                Back to vault
              </Button>
              <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                <span>{isSaving ? "Saving..." : `Saved ${formatUpdatedAt(selectedNote.updatedAt)}`}</span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteNote(selectedNote.id);
                      setActiveView("vault");
                      toast.success("Note deleted");
                    } catch {
                      toast.error("Could not delete note");
                    }
                  }}
                  className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-red-100 transition hover:bg-red-400/20"
                  disabled={effectiveNotes.length === 1}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Trash2 className="size-3.5" />
                    Delete
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Input
                key={`${selectedNote.id}-title`}
                defaultValue={selectedNote.title}
                onChange={(event) => {
                  void queueSave({ title: event.target.value });
                }}
                placeholder="Untitled note"
                className="h-14 rounded-[24px] text-2xl font-semibold"
              />

              <Textarea
                key={`${selectedNote.id}-content`}
                defaultValue={selectedNote.content}
                onChange={(event) => {
                  void queueSave({ content: event.target.value });
                }}
                placeholder="Write your note in Markdown..."
                className="min-h-[58vh] resize-none rounded-[28px] px-5 py-4 text-base leading-7"
              />
            </div>

            <div className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Backlinks</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {backlinks.length ? (
                  backlinks.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => {
                        selectNote(note.id);
                        setActiveView("note");
                      }}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/8"
                    >
                      {note.title}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No backlinks yet.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-semibold text-white">No note selected</p>
            <Button
              variant="accent"
              type="button"
              onClick={async () => {
                await createNote({ folder: "Vault", status: "draft" });
                setActiveView("vault");
              }}
            >
              <Plus className="size-4" />
              Create note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
