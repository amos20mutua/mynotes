"use client";

import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";
import { ArrowLeft, Bold, CalendarDays, Camera, Check, Clock3, Heading1, Heading2, Italic, Link2, List, ListTodo, LoaderCircle, Plus, Quote, ScanText, Trash2, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { RecognizeResult } from "tesseract.js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraphErrorBoundary } from "@/components/vault/graph-error-boundary";
import { GraphView } from "@/components/vault/graph-view";
import { Input } from "@/components/ui/input";
import { defaultVaultData } from "@/lib/vault/default-vault";
import { getBacklinks, normalizeTitle } from "@/lib/vault/graph";
import { getSelectedNote, useVaultStore } from "@/lib/state/use-vault-store";
import type { VaultData, VaultNote, VaultNoteSchedule } from "@/types";

type VaultWorkspaceProps = {
  initialVault: VaultData;
};

type DetectedTextBlock = {
  rawValue: string;
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function stripLeadingTitleHeading(title: string, content: string) {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return content;
  }

  const lines = content.split("\n");
  const firstLine = lines[0]?.trim() ?? "";
  const normalizedFirstLine = firstLine.replace(/^#{1,2}\s+/, "").trim();

  if (!firstLine.match(/^#{1,2}\s+/) || normalizeTitle(normalizedFirstLine) !== normalizeTitle(trimmedTitle)) {
    return content;
  }

  return lines.slice(1).join("\n").replace(/^\n+/, "");
}

function scheduleToTimestamp(schedule?: VaultNoteSchedule) {
  if (!schedule?.date) {
    return null;
  }

  const value = `${schedule.date}T${schedule.time?.trim() || "09:00"}:00`;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function formatScheduleLabel(schedule?: VaultNoteSchedule) {
  const timestamp = scheduleToTimestamp(schedule);
  if (!timestamp) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...(schedule?.time ? { hour: "numeric", minute: "2-digit" } : {})
  }).format(new Date(timestamp));
}

function cleanRecognizedNoteText(raw: string) {
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const merged: string[] = [];

  for (const line of lines) {
    const previous = merged.at(-1);

    if (
      previous &&
      previous.length > 0 &&
      previous.length < 72 &&
      !/[.!?:)]$/.test(previous) &&
      !/^[-*•#>\d]/.test(line) &&
      !/^[A-Z\s]{4,}$/.test(line)
    ) {
      merged[merged.length - 1] = `${previous} ${line}`;
      continue;
    }

    merged.push(line);
  }

  return merged.join("\n");
}

function buildImportedTextBlock(text: string) {
  const cleaned = cleanRecognizedNoteText(text);
  const timestamp = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());

  return cleaned ? `## Imported from camera\n\n_Captured ${timestamp}_\n\n${cleaned}\n\n` : "";
}

async function preprocessImageForOcr(file: File) {
  const bitmap = await createImageBitmap(file);
  const targetWidth = Math.min(1800, Math.max(1200, bitmap.width));
  const scale = targetWidth / bitmap.width;
  const targetHeight = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const grayscale = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const normalized = grayscale > 172 ? 255 : grayscale < 84 ? 0 : Math.min(255, Math.max(0, (grayscale - 84) * 2.6));
    data[index] = normalized;
    data[index + 1] = normalized;
    data[index + 2] = normalized;
  }

  context.putImageData(imageData, 0, 0);

  return new Promise<File>((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob ? new File([blob], file.name || "scan.jpg", { type: "image/png" }) : file);
      },
      "image/png",
      1
    );
  });
}

type MarkdownSelection = {
  start: number;
  end: number;
};

type MarkdownEditResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

type MarkdownTool = {
  id: string;
  label: string;
  icon: LucideIcon;
  run: (value: string, selection: MarkdownSelection) => MarkdownEditResult;
};

function wrapSelection(value: string, selection: MarkdownSelection, before: string, after: string, placeholder: string) {
  const selectedText = value.slice(selection.start, selection.end);
  const inner = selectedText || placeholder;
  const nextValue = `${value.slice(0, selection.start)}${before}${inner}${after}${value.slice(selection.end)}`;
  const selectionStart = selection.start + before.length;
  const selectionEnd = selectionStart + inner.length;

  return {
    value: nextValue,
    selectionStart,
    selectionEnd
  };
}

function prefixSelectedLines(value: string, selection: MarkdownSelection, prefix: string) {
  const lineStart = value.lastIndexOf("\n", Math.max(0, selection.start - 1)) + 1;
  const nextBreak = value.indexOf("\n", selection.end);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  const block = value.slice(lineStart, lineEnd);
  const lines = block.split("\n");
  const nextBlock = lines.map((line) => `${prefix}${line}`).join("\n");

  return {
    value: `${value.slice(0, lineStart)}${nextBlock}${value.slice(lineEnd)}`,
    selectionStart: lineStart,
    selectionEnd: lineStart + nextBlock.length
  };
}

const markdownTools: MarkdownTool[] = [
  { id: "h1", label: "Heading 1", icon: Heading1, run: (value, selection) => prefixSelectedLines(value, selection, "# ") },
  { id: "h2", label: "Heading 2", icon: Heading2, run: (value, selection) => prefixSelectedLines(value, selection, "## ") },
  { id: "bold", label: "Bold", icon: Bold, run: (value, selection) => wrapSelection(value, selection, "**", "**", "Bold text") },
  { id: "italic", label: "Italic", icon: Italic, run: (value, selection) => wrapSelection(value, selection, "_", "_", "Italic text") },
  { id: "bullet", label: "Bullet list", icon: List, run: (value, selection) => prefixSelectedLines(value, selection, "- ") },
  { id: "todo", label: "Checklist", icon: ListTodo, run: (value, selection) => prefixSelectedLines(value, selection, "- [ ] ") },
  { id: "quote", label: "Quote", icon: Quote, run: (value, selection) => prefixSelectedLines(value, selection, "> ") },
  {
    id: "link",
    label: "Link",
    icon: Link2,
    run: (value, selection) => {
      const selectedText = value.slice(selection.start, selection.end);
      const text = selectedText || "Link text";
      const url = "https://example.com";
      const insertion = `[${text}](${url})`;
      const valueWithLink = `${value.slice(0, selection.start)}${insertion}${value.slice(selection.end)}`;
      const urlStart = selection.start + text.length + 3;

      return {
        value: valueWithLink,
        selectionStart: urlStart,
        selectionEnd: urlStart + url.length
      };
    }
  }
];

function openExistingOrCreateLinkedNote(
  title: string,
  notes: VaultNote[],
  selectedNote: VaultNote | null,
  selectNote: (noteId: string) => void,
  createNote: (input?: Partial<Pick<VaultNote, "title" | "content" | "colorGroup" | "folder" | "tags" | "isPinned" | "status" | "schedule" | "graphPosition">>) => Promise<void>,
  updateNote: (noteId: string, updates: Partial<Pick<VaultNote, "title" | "content" | "colorGroup" | "folder" | "tags" | "isPinned" | "status" | "schedule" | "graphPosition">>) => Promise<void>
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
    content: `Linked from [[${selectedNote?.title ?? "Welcome to Vault"}]]\n\n`
  }).then(async () => {
    const latest = useVaultStore.getState().notes[0];

    if (latest) {
      await updateNote(latest.id, {
        title,
        colorGroup: selectedNote?.colorGroup ?? selectedNote?.folder ?? "Vault",
        folder: selectedNote?.folder ?? "Vault",
        content: `Linked from [[${selectedNote?.title ?? "Welcome to Vault"}]]\n\n`
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
  const [draftNoteId, setDraftNoteId] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [isRecognizingText, setIsRecognizingText] = useState(false);
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusFreshNoteRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const seedNotes = initialVault.notes.length > 0 ? initialVault.notes : defaultVaultData.notes;
  const seedLinks = initialVault.links.length > 0 ? initialVault.links : defaultVaultData.links;
  const effectiveNotes = isLoaded ? notes : seedNotes;
  const effectiveLinks = isLoaded ? links : seedLinks;
  const effectiveSelectedNoteId = isLoaded ? selectedNoteId : seedNotes[0]?.id ?? "";
  const selectedNote = getSelectedNote(effectiveNotes, effectiveSelectedNoteId);
  const backlinks = getBacklinks(effectiveNotes, selectedNote, effectiveLinks);
  const upcomingScheduledNotes = [...effectiveNotes]
    .filter((note) => note.schedule?.date && !note.schedule.done)
    .map((note) => ({ note, timestamp: scheduleToTimestamp(note.schedule) }))
    .filter((item): item is { note: VaultNote; timestamp: number } => item.timestamp !== null)
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(0, isCompact ? 4 : 6);

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
    if (typeof document === "undefined") {
      return;
    }

    const shouldLockScroll = activeView === "vault";
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = shouldLockScroll ? "hidden" : "";
    document.documentElement.style.overflow = shouldLockScroll ? "hidden" : "";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [activeView]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeView !== "note" || !focusFreshNoteRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
      focusFreshNoteRef.current = false;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeView, selectedNote?.id]);

  const queueSave = useCallback(async (noteId: string, updates: Partial<Pick<VaultNote, "title" | "content" | "schedule">>) => {
    if (!noteId) {
      return;
    }

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        await updateNote(noteId, updates);
      } catch {
        toast.error("Could not save note");
      }
    }, 420);
  }, [updateNote]);

  async function createFreshNote(graphPosition?: VaultNote["graphPosition"], connectToTitle?: string) {
    const anchorTitle = connectToTitle?.trim() || selectedNote?.title?.trim() || "";
    const initialContent = anchorTitle ? `Linked from [[${anchorTitle}]]\n\n` : "";

    try {
      await createNote({
        title: "Untitled note",
        content: initialContent,
        colorGroup: selectedNote?.colorGroup ?? selectedNote?.folder ?? "Vault",
        folder: selectedNote?.folder ?? "Vault",
        status: "draft",
        graphPosition
      });
      focusFreshNoteRef.current = true;
      setActiveView("note");
    } catch {
      toast.error("Could not create note");
    }
  }

  async function updateSchedule(updates: Partial<VaultNoteSchedule>) {
    if (!selectedNote) {
      return;
    }

    const currentSchedule = selectedNote.schedule ?? { date: "" };
    const nextSchedule = {
      ...currentSchedule,
      ...updates
    };

    const normalizedSchedule = nextSchedule.date.trim()
      ? {
          date: nextSchedule.date,
          ...(nextSchedule.time?.trim() ? { time: nextSchedule.time.trim() } : {}),
          ...(typeof nextSchedule.done === "boolean" ? { done: nextSchedule.done } : {}),
          ...(typeof nextSchedule.reminderMinutes === "number" ? { reminderMinutes: nextSchedule.reminderMinutes } : {})
        }
      : undefined;

    try {
      await updateNote(selectedNote.id, { schedule: normalizedSchedule });
    } catch {
      toast.error("Could not save schedule");
    }
  }

  const absorbCapturedNote = useCallback(async (file: File) => {
    if (!selectedNote) {
      return;
    }

    try {
      setIsRecognizingText(true);
      setRecognitionProgress(0.06);
      const preparedFile = await preprocessImageForOcr(file);
      let extractedText = "";

      if ("TextDetector" in window) {
        try {
          const detector = new (window as Window & { TextDetector: new () => { detect: (source: ImageBitmapSource) => Promise<DetectedTextBlock[]> } }).TextDetector();
          const bitmap = await createImageBitmap(preparedFile);
          const blocks = await detector.detect(bitmap);
          bitmap.close();
          extractedText = blocks.map((block) => block.rawValue?.trim()).filter(Boolean).join("\n");
          setRecognitionProgress(0.72);
        } catch {
          extractedText = "";
        }
      }

      if (!extractedText) {
        const { recognize } = await import("tesseract.js");
        const result = (await recognize(preparedFile, "eng", {
          logger: (message) => {
            if (message.status === "recognizing text" && typeof message.progress === "number") {
              setRecognitionProgress(0.16 + message.progress * 0.78);
            }
          }
        })) as RecognizeResult;
        extractedText = result.data.text;
      }

      const importedBlock = buildImportedTextBlock(extractedText);

      if (!importedBlock) {
        toast.error("No readable text was found in that photo");
        return;
      }

      const currentContent = draftNoteId === selectedNote.id ? draftContent : stripLeadingTitleHeading(selectedNote.title, selectedNote.content);
      const selection = editorViewRef.current?.state.selection.main;
      const selectionStart = selection?.from ?? currentContent.length;
      const selectionEnd = selection?.to ?? currentContent.length;
      const prefixNeedsSpacing = selectionStart > 0 && !currentContent.slice(0, selectionStart).endsWith("\n\n");
      const insertValue = `${prefixNeedsSpacing ? "\n\n" : ""}${importedBlock}`;
      const nextContent = `${currentContent.slice(0, selectionStart)}${insertValue}${currentContent.slice(selectionEnd)}`;
      const caretPosition = selectionStart + insertValue.length;

      setDraftNoteId(selectedNote.id);
      setDraftContent(nextContent);
      await queueSave(selectedNote.id, { content: nextContent });

      window.requestAnimationFrame(() => {
        editorViewRef.current?.dispatch({
          selection: EditorSelection.cursor(caretPosition)
        });
        editorViewRef.current?.focus();
      });

      toast.success("Photo converted into note text");
    } catch {
      toast.error("Could not extract text from that photo");
    } finally {
      setIsRecognizingText(false);
      setRecognitionProgress(0);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
    }
  }, [draftContent, draftNoteId, queueSave, selectedNote]);

  function applyMarkdownTool(tool: MarkdownTool) {
    if (!selectedNote || !editorViewRef.current) {
      return;
    }

    const view = editorViewRef.current;
    const currentContent = draftNoteId === selectedNote.id ? draftContent : stripLeadingTitleHeading(selectedNote.title, selectedNote.content);
    const result = tool.run(currentContent, {
      start: view.state.selection.main.from,
      end: view.state.selection.main.to
    });

    setDraftNoteId(selectedNote.id);
    setDraftContent(result.value);
    void queueSave(selectedNote.id, { content: result.value });

    window.requestAnimationFrame(() => {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: result.value
        },
        selection: EditorSelection.range(result.selectionStart, result.selectionEnd)
      });
      view.focus();
    });
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
  const isKeyboardOpen = isCompact && keyboardInset > 0;
  const editorTitle = selectedNote && draftNoteId === selectedNote.id ? draftTitle : selectedNote?.title ?? "";
  const editorContent =
    selectedNote && draftNoteId === selectedNote.id ? draftContent : selectedNote ? stripLeadingTitleHeading(selectedNote.title, selectedNote.content) : "";
  const selectedSchedule = selectedNote?.schedule;
  const editorExtensions = useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      EditorView.lineWrapping,
      EditorView.domEventHandlers({
        paste: (event) => {
          const file = Array.from(event.clipboardData?.files ?? []).find((entry): entry is File => entry instanceof File && entry.type.startsWith("image/"));
          if (!file) {
            return false;
          }

          event.preventDefault();
          void absorbCapturedNote(file);
          return true;
        }
      }),
      EditorView.theme({
        "&": {
          backgroundColor: "transparent",
          fontSize: isCompact ? "18px" : "17px",
          height: "100%"
        },
        ".cm-scroller": {
          fontFamily: "inherit",
          lineHeight: isCompact ? "1.72" : "1.85",
          padding: isCompact ? "0" : "20px 24px"
        },
        ".cm-content": {
          minHeight: isCompact ? "56vh" : "60vh",
          padding: isCompact ? "0" : "0"
        },
        ".cm-line": {
          padding: "0"
        },
        ".cm-gutters": {
          display: "none"
        },
        ".cm-activeLine": {
          backgroundColor: "transparent"
        },
        ".cm-selectionBackground, .cm-content ::selection": {
          backgroundColor: "rgba(239,191,114,0.22) !important"
        },
        ".cm-cursor, .cm-dropCursor": {
          borderLeftColor: "#efbf6f"
        },
        ".cm-placeholder": {
          color: "rgba(255,255,255,0.36)"
        }
      })
    ],
    [absorbCapturedNote, isCompact]
  );

  const editorToolbar = (
    <div
      className={
        isCompact
          ? "pointer-events-auto mx-auto flex w-full max-w-[420px] items-center gap-2 overflow-x-auto rounded-[26px] border border-white/10 bg-[rgba(12,16,24,0.92)] px-2.5 py-2 shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
          : "flex flex-wrap items-center gap-2 rounded-[24px] border border-white/10 bg-black/20 p-3"
      }
    >
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        className={
          isCompact
            ? "inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(239,191,114,0.2)] bg-[rgba(239,191,114,0.12)] text-[#fff4de] transition hover:bg-[rgba(239,191,114,0.18)]"
            : "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[rgba(239,191,114,0.18)] bg-[rgba(239,191,114,0.1)] text-[#fff4de] transition hover:bg-[rgba(239,191,114,0.16)]"
        }
        aria-label="Scan handwritten or printed notes"
        title="Scan note photo"
        disabled={isRecognizingText}
      >
        {isRecognizingText ? <LoaderCircle className="size-4 animate-spin" /> : <ScanText className={isCompact ? "size-4.5" : "size-4"} />}
      </button>
      {markdownTools.map((tool) => {
        const Icon = tool.icon;

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => applyMarkdownTool(tool)}
            className={
              isCompact
                ? "inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/88 transition hover:bg-white/12"
                : "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/84 transition hover:bg-white/12"
            }
            aria-label={tool.label}
            title={tool.label}
          >
            <Icon className={isCompact ? "size-4.5" : "size-4"} />
          </button>
        );
      })}
      {!isCompact ? (
        <p className="ml-auto text-xs uppercase tracking-[0.22em] text-slate-500">
          {isRecognizingText ? `Scanning ${(recognitionProgress * 100).toFixed(0)}%` : "Markdown tools"}
        </p>
      ) : null}
    </div>
  );

  const schedulePanel = selectedNote ? (
    <div className={isCompact ? "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4" : "rounded-[28px] border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Schedule</p>
          <p className={isCompact ? "mt-1 text-sm text-white/72" : "mt-1 text-sm text-slate-300"}>{formatScheduleLabel(selectedSchedule)}</p>
        </div>
        {selectedSchedule?.date ? (
          <button
            type="button"
            onClick={() => {
              void updateSchedule({ date: "", time: "", done: false });
            }}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/74 transition hover:bg-white/8"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-xs text-slate-400">
            <CalendarDays className="size-3.5" />
            Date
          </span>
          <Input
            type="date"
            value={selectedSchedule?.date ?? ""}
            onChange={(event) => {
              void updateSchedule({ date: event.target.value, done: false });
            }}
            className={isCompact ? "h-11 rounded-2xl" : undefined}
          />
        </label>
        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-xs text-slate-400">
            <Clock3 className="size-3.5" />
            Time
          </span>
          <Input
            type="time"
            value={selectedSchedule?.time ?? ""}
            onChange={(event) => {
              void updateSchedule({ time: event.target.value });
            }}
            className={isCompact ? "h-11 rounded-2xl" : undefined}
          />
        </label>
      </div>
      {selectedSchedule?.date ? (
        <button
          type="button"
          onClick={() => {
            void updateSchedule({ done: !selectedSchedule.done });
          }}
          className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
            selectedSchedule.done
              ? "border-[rgba(239,191,114,0.24)] bg-[rgba(239,191,114,0.14)] text-[#fff4de]"
              : "border-white/10 bg-white/6 text-white/84 hover:bg-white/10"
          }`}
        >
          <Check className="size-4" />
          {selectedSchedule.done ? "Marked complete" : "Mark complete"}
        </button>
      ) : null}
    </div>
  ) : null;

  const capturePanel = selectedNote ? (
    <div className={isCompact ? "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4" : "rounded-[28px] border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2">
            <Camera className="size-4 text-[color:var(--accent-amber)]" />
            <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Scan into note</p>
          </div>
          <p className={isCompact ? "mt-2 text-sm leading-6 text-white/72" : "mt-2 text-sm text-slate-300"}>
            Take a photo of handwritten or printed notes and convert them straight into editable text.
          </p>
          {isRecognizingText ? (
            <p className="mt-2 text-xs text-[color:var(--accent-amber)]">Extracting text... {(recognitionProgress * 100).toFixed(0)}%</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[rgba(239,191,114,0.2)] bg-[rgba(239,191,114,0.12)] px-3.5 py-2 text-sm font-medium text-[#fff4de] transition hover:bg-[rgba(239,191,114,0.18)]"
          disabled={isRecognizingText}
        >
          {isRecognizingText ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {isRecognizingText ? "Scanning" : "Capture"}
        </button>
      </div>
    </div>
  ) : null;

  const upcomingPanel = upcomingScheduledNotes.length ? (
    <div className={isCompact ? `${isKeyboardOpen ? "hidden" : "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4"}` : "mt-6 rounded-[28px] border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-center gap-2">
        <CalendarDays className="size-4 text-[color:var(--accent-amber)]" />
        <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Upcoming</p>
      </div>
      <div className="mt-3 space-y-2">
        {upcomingScheduledNotes.map(({ note }) => (
          <button
            key={note.id}
            type="button"
            onClick={() => {
              selectNote(note.id);
              setActiveView("note");
            }}
            className="flex w-full items-center justify-between rounded-[18px] border border-white/8 bg-white/5 px-3.5 py-3 text-left transition hover:bg-white/8"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{note.title}</span>
              <span className="mt-1 block text-xs text-slate-400">{formatScheduleLabel(note.schedule)}</span>
            </span>
            <span className="ml-3 rounded-full border border-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
              {note.schedule?.done ? "Done" : "Next"}
            </span>
          </button>
        ))}
      </div>
    </div>
  ) : null;

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
              onClick={() => {
                void createFreshNote();
              }}
            >
              <Plus className="size-4" />
              New
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (activeView === "vault") {
    return (
      <div className="mx-auto h-[100svh] min-h-[100svh] max-w-[1800px] overflow-hidden px-0 py-0 sm:h-dvh sm:min-h-0 sm:px-3 sm:py-3 lg:px-4">
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
            onCreateNoteAtPoint={async (graphPosition, connectToTitle) => {
              await createFreshNote(graphPosition, connectToTitle);
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
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void absorbCapturedNote(file);
                }
              }}
            />
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
                      paddingBottom: `max(calc(env(safe-area-inset-bottom, 0px) + 108px), ${keyboardInset + 86}px)`
                    }
                  : undefined
              }
            >
              {isCompact ? <p className="pt-3 text-center text-[15px] text-white/45">{noteDateLabel}</p> : null}

              <Input
                ref={titleInputRef}
                value={editorTitle}
                onChange={(event) => {
                  const nextTitle = event.target.value;
                  setDraftNoteId(selectedNote.id);
                  setDraftTitle(nextTitle);
                  void queueSave(selectedNote.id, { title: nextTitle });
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") {
                    return;
                  }

                  event.preventDefault();
                  editorViewRef.current?.focus();
                }}
                placeholder="Untitled note"
                className={
                  isCompact
                    ? "mt-2 h-auto border-0 bg-transparent px-0 py-0 text-[34px] font-semibold leading-[1.05] text-white shadow-none focus:border-0"
                    : "h-16 rounded-[28px] border-white/10 bg-white/[0.04] text-3xl font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                }
              />

              {!isCompact ? editorToolbar : null}

              <div
                className={
                  isCompact
                    ? "-mx-4 mt-3 rounded-none border border-white/0 bg-transparent"
                    : "min-h-[60vh] rounded-[32px] border border-white/10 bg-black/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                }
                style={
                  isCompact
                    ? {
                        minHeight: keyboardInset > 0 ? `max(46vh, calc(100dvh - ${keyboardInset + 290}px))` : "62vh"
                      }
                    : undefined
                }
              >
                <CodeMirror
                  value={editorContent}
                  height="100%"
                  theme={oneDark}
                  basicSetup={{
                    foldGutter: false,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: true,
                    lineNumbers: false,
                    highlightActiveLine: false,
                    highlightActiveLineGutter: false
                  }}
                  extensions={editorExtensions}
                  placeholder="Write your note in Markdown..."
                  onCreateEditor={(view) => {
                    editorViewRef.current = view;
                  }}
                  onChange={(value) => {
                    setDraftNoteId(selectedNote.id);
                    setDraftContent(value);
                    void queueSave(selectedNote.id, { content: value });
                  }}
                  className={isCompact ? "mobile-note-editor" : undefined}
                />
              </div>

              {capturePanel}

              {schedulePanel}

              <div className={isCompact ? `${isKeyboardOpen ? "mt-5 opacity-0 pointer-events-none h-0 overflow-hidden" : "mt-8 space-y-3"}` : "mt-6 rounded-[28px] border border-white/10 bg-black/20 p-4"}>
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

              {upcomingPanel}
            </div>

            {isCompact ? (
              <div
                className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)]"
                style={{ bottom: keyboardInset > 0 ? `${Math.max(12, keyboardInset - 8)}px` : "0px" }}
              >
                {editorToolbar}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-semibold text-white">No note selected</p>
            <Button
              variant="accent"
              type="button"
              onClick={() => {
                void createFreshNote();
              }}
            >
              <Plus className="size-4" />
              New
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
