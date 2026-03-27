"use client";

import { ArrowLeft, Check, LoaderCircle, Plus, Trash2 } from "lucide-react";
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
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(max-width: 768px)").matches;
  });
  const [keyboardInset, setKeyboardInset] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateCompactMode = () => setIsCompact(mediaQuery.matches);
    updateCompactMode();
    mediaQuery.addEventListener("change", updateCompactMode);

    return () => mediaQuery.removeEventListener("change", updateCompactMode);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || activeView !== "note") {
      return;
    }

    const viewport = window.visualViewport;

    if (!viewport) {
      return;
    }

    const updateViewportInset = () => {
      const fullHeight = window.innerHeight;
      const visibleHeight = viewport.height + viewport.offsetTop;
      const nextInset = Math.max(0, fullHeight - visibleHeight);
      setKeyboardInset(nextInset > 120 ? nextInset : 0);
    };

    updateViewportInset();
    viewport.addEventListener("resize", updateViewportInset);
    viewport.addEventListener("scroll", updateViewportInset);

    return () => {
      viewport.removeEventListener("resize", updateViewportInset);
      viewport.removeEventListener("scroll", updateViewportInset);
    };
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

  const noteDateLabel = selectedNote
    ? new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(selectedNote.updatedAt))
    : "";

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
    <div className={isCompact ? "min-h-dvh bg-black" : "mx-auto max-w-6xl px-4 py-5 transition-all duration-300 ease-out sm:px-6 lg:px-8"}>
      <div
        className={
          isCompact
            ? "min-h-dvh bg-black text-white"
            : "rounded-[36px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-all duration-300 ease-out sm:p-7"
        }
      >
        {selectedNote ? (
          <>
            <div
              className={
                isCompact
                  ? "sticky top-0 z-20 -mx-4 flex items-center justify-between gap-3 bg-black/92 px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+14px)] backdrop-blur-xl"
                  : "flex flex-wrap items-center justify-between gap-3"
              }
            >
              <button
                type="button"
                onClick={() => setActiveView("vault")}
                className={
                  isCompact
                    ? "inline-flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_20px_56px_rgba(0,0,0,0.28)] transition hover:bg-white/16"
                    : "inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12"
                }
              >
                <ArrowLeft className="size-5" />
                {!isCompact ? <span>Back to vault</span> : null}
              </button>

              <div className={isCompact ? "flex items-center gap-3" : "flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500"}>
                {!isCompact ? <span>{isSaving ? "Saving..." : `Saved ${formatUpdatedAt(selectedNote.updatedAt)}`}</span> : null}
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
                  className={
                    isCompact
                      ? "inline-flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_20px_56px_rgba(0,0,0,0.28)] transition hover:bg-white/16"
                      : "rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-red-100 transition hover:bg-red-400/20"
                  }
                  disabled={effectiveNotes.length === 1}
                  aria-label="Delete note"
                >
                  <Trash2 className="size-4" />
                  {!isCompact ? (
                    <span className="ml-1 inline-flex items-center gap-1.5">
                      Delete
                    </span>
                  ) : null}
                </button>
                {isCompact ? (
                  <div className="inline-flex size-12 items-center justify-center rounded-full bg-[#f5c400] text-black shadow-[0_20px_56px_rgba(245,196,0,0.28)]">
                    <Check className="size-6" />
                  </div>
                ) : null}
              </div>
            </div>

            <div
              className={isCompact ? "px-4 pb-6" : "mt-6 space-y-4"}
              style={
                isCompact
                  ? {
                      paddingBottom: `max(calc(env(safe-area-inset-bottom, 0px) + 136px), ${keyboardInset + 112}px)`
                    }
                  : undefined
              }
            >
              {isCompact ? <p className="pt-3 text-center text-[15px] text-white/45">{noteDateLabel}</p> : null}

              <Input
                key={`${selectedNote.id}-title`}
                defaultValue={selectedNote.title}
                onChange={(event) => {
                  void queueSave({ title: event.target.value });
                }}
                placeholder="Untitled note"
                className={
                  isCompact
                    ? "mt-3 h-auto border-0 bg-transparent px-0 py-0 text-[34px] font-semibold leading-[1.05] text-white shadow-none focus:border-0"
                    : "h-16 rounded-[28px] border-white/10 bg-white/[0.04] text-3xl font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                }
              />

              <Textarea
                ref={textareaRef}
                key={`${selectedNote.id}-content`}
                defaultValue={selectedNote.content}
                onChange={(event) => {
                  void queueSave({ content: event.target.value });
                }}
                placeholder="Write your note in Markdown..."
                className={
                  isCompact
                    ? "mt-8 min-h-[56vh] resize-none border-0 bg-transparent px-0 py-0 text-[18px] leading-[1.72] text-white/92 shadow-none focus:border-0"
                    : "min-h-[60vh] resize-none rounded-[32px] border-white/10 bg-black/20 px-6 py-5 text-[17px] leading-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                }
                style={
                  isCompact
                    ? {
                        minHeight: keyboardInset > 0 ? `max(46vh, calc(100dvh - ${keyboardInset + 290}px))` : "62vh"
                      }
                    : undefined
                }
              />

              <div className={isCompact ? "mt-8 space-y-3" : "mt-6 rounded-[28px] border border-white/10 bg-black/20 p-4"}>
                <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Backlinks</p>
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
                        className={
                          isCompact
                            ? "rounded-full border border-white/10 bg-white/8 px-4 py-2.5 text-[15px] text-white/88 transition hover:bg-white/14"
                            : "rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/8"
                        }
                      >
                        {note.title}
                      </button>
                    ))
                  ) : (
                    <p className={isCompact ? "text-[15px] text-white/42" : "text-sm text-slate-400"}>No backlinks yet.</p>
                  )}
                </div>
              </div>
            </div>

            {isCompact ? (
              <div
                className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)]"
                style={{ bottom: keyboardInset > 0 ? `${keyboardInset}px` : "0px" }}
              >
                <div className="pointer-events-auto mx-auto flex max-w-[360px] items-center justify-between rounded-[30px] border border-white/10 bg-white/10 px-3 py-2 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
                  <button
                    type="button"
                    onClick={() => setActiveView("vault")}
                    className="rounded-full px-3 py-2 text-sm font-medium text-white/82 transition hover:bg-white/10"
                  >
                    Graph
                  </button>
                  <button
                    type="button"
                    onClick={() => textareaRef.current?.focus()}
                    className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/12"
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
                    className="rounded-full px-3 py-2 text-sm font-medium text-white/82 transition hover:bg-white/10"
                  >
                    Bottom
                  </button>
                </div>
              </div>
            ) : null}
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
