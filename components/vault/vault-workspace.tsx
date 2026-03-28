"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import { Markdown } from "@tiptap/markdown";
import { ArrowLeft, Bold, BriefcaseBusiness, CalendarDays, Camera, Check, Clock3, Heading1, Heading2, Highlighter, History, Italic, Lightbulb, Link2, List, ListOrdered, ListTodo, LoaderCircle, Minus, Microscope, Plus, Quote, Redo2, Sparkles, Strikethrough, Trash2, Underline as UnderlineIcon, Undo2, Users, Zap } from "lucide-react";
import { startTransition, useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
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
import type { VaultData, VaultNote, VaultNoteClusterMode, VaultNoteSchedule, VaultNoteSnapshot } from "@/types";

type VaultWorkspaceProps = {
  initialVault: VaultData;
};

const PRIVATE_WORKSPACE_KEY = "vault-private-workspace";

type DetectedTextBlock = {
  rawValue: string;
};

type SemanticRelatedNote = {
  note: VaultNote;
  score: number;
  reasons: string[];
};

type OcrCandidate = {
  source: "native" | "tesseract";
  variant: string;
  text: string;
  confidence: number;
  quality: number;
};

type ExtractedAction = {
  kind: "task" | "schedule" | "followup";
  label: string;
  detail: string;
  line: string;
  date?: string;
};

type WritingPrompt = {
  id: string;
  label: string;
  detail: string;
  action: "link" | "cluster" | "schedule";
  target?: string;
  clusterMode?: VaultNoteClusterMode;
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "into", "your", "have", "will", "about", "there", "their",
  "them", "they", "then", "than", "when", "where", "what", "which", "while", "were", "been", "being", "also",
  "just", "some", "more", "most", "very", "much", "such", "only", "even", "over", "under", "back", "through",
  "note", "notes", "vault", "using", "used", "like", "into", "onto", "across", "inside", "after", "before",
  "because", "should", "could", "would", "start", "write", "writing", "make", "made", "make", "keep", "keeps",
  "than", "then", "still", "same", "many", "each", "every", "other", "those", "these"
]);

const CLUSTER_MODES: Array<{ id: VaultNoteClusterMode; label: string; icon: typeof Lightbulb }> = [
  { id: "ideas", label: "Ideas", icon: Lightbulb },
  { id: "projects", label: "Projects", icon: BriefcaseBusiness },
  { id: "people", label: "People", icon: Users },
  { id: "research", label: "Research", icon: Microscope }
];

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
      !/^[-*#>\d]/.test(line) &&
      !/^[A-Z\s]{4,}$/.test(line)
    ) {
      merged[merged.length - 1] = `${previous} ${line}`;
      continue;
    }

    merged.push(line);
  }

  return merged.join("\n");
}

function scoreRecognizedTextQuality(text: string, confidence = 0) {
  const trimmed = text.trim();

  if (!trimmed) {
    return 0;
  }

  const letters = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  const digits = (trimmed.match(/\d/g) ?? []).length;
  const symbols = (trimmed.match(/[^A-Za-z0-9\s.,:;!?()[\]'"/-]/g) ?? []).length;
  const words = trimmed.split(/\s+/).filter(Boolean);
  const meaningfulWords = words.filter((word) => /[A-Za-z]{2,}/.test(word));
  const longWords = meaningfulWords.filter((word) => word.length >= 4);
  const gibberishWords = words.filter((word) => {
    const cleaned = word.replace(/[^A-Za-z]/g, "");
    return cleaned.length >= 4 && !/[aeiou]/i.test(cleaned) && !/[lrstn]/i.test(cleaned);
  });
  const lineCount = trimmed.split("\n").filter(Boolean).length;
  const alphaRatio = letters / Math.max(trimmed.length, 1);
  const meaningfulRatio = meaningfulWords.length / Math.max(words.length, 1);
  const longWordRatio = longWords.length / Math.max(words.length, 1);
  const symbolPenalty = symbols / Math.max(trimmed.length, 1);
  const gibberishPenalty = gibberishWords.length / Math.max(words.length, 1);
  const digitPenalty = digits / Math.max(trimmed.length, 1);

  return confidence * 0.42 + alphaRatio * 100 + meaningfulRatio * 80 + longWordRatio * 36 + lineCount * 2 - symbolPenalty * 160 - gibberishPenalty * 120 - digitPenalty * 35;
}

function extractConfidentOcrText(result: RecognizeResult) {
  const rawLines = ((result.data as RecognizeResult["data"] & { lines?: Array<{ text: string; confidence?: number }> }).lines ?? []);
  const lines = rawLines
    .map((line) => {
      const text = line.text.replace(/\s+/g, " ").trim();
      return {
        text,
        confidence: line.confidence ?? 0
      };
    })
    .filter((line) => {
      if (!line.text) {
        return false;
      }

      const alphaRatio = (line.text.match(/[A-Za-z]/g) ?? []).length / Math.max(line.text.length, 1);
      const symbolRatio = (line.text.match(/[^A-Za-z0-9\s.,:;!?()[\]'"/-]/g) ?? []).length / Math.max(line.text.length, 1);
      return line.confidence >= 38 && alphaRatio >= 0.28 && symbolRatio <= 0.18;
    });

  if (lines.length > 0) {
    return lines.map((line) => line.text).join("\n");
  }

  return result.data.text;
}

function tokenizeMeaningfulText(value: string) {
  return value
    .toLowerCase()
    .replace(/\[\[([^\]]+)\]\]/g, " $1 ")
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function pickTopTokens(value: string, limit = 8) {
  const frequency = new Map<string, number>();

  for (const token of tokenizeMeaningfulText(value)) {
    frequency.set(token, (frequency.get(token) ?? 0) + 1);
  }

  return [...frequency.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

function formatReasonLabel(token: string) {
  return token
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildSemanticRelatedNotes(notes: VaultNote[], selectedNote: VaultNote | null, backlinks: VaultNote[]) {
  if (!selectedNote) {
    return [];
  }

  const backlinkIds = new Set(backlinks.map((note) => note.id));
  const selectedTitleTokens = tokenizeMeaningfulText(selectedNote.title);
  const selectedContentTokens = tokenizeMeaningfulText(selectedNote.content);
  const selectedTokenSet = new Set([...selectedTitleTokens, ...selectedContentTokens]);
  const selectedTopTokens = new Set(pickTopTokens(`${selectedNote.title} ${selectedNote.content}`, 10));

  return notes
    .filter((note) => note.id !== selectedNote.id)
    .map<SemanticRelatedNote | null>((note) => {
      const noteTitleTokens = tokenizeMeaningfulText(note.title);
      const noteContentTokens = tokenizeMeaningfulText(note.content);
      const noteTokenSet = new Set([...noteTitleTokens, ...noteContentTokens]);
      const sharedTitleTokens = noteTitleTokens.filter((token) => selectedTokenSet.has(token));
      const sharedPriorityTokens = [...selectedTopTokens].filter((token) => noteTokenSet.has(token));
      const sharedContentTokens = noteContentTokens.filter((token) => selectedTokenSet.has(token));
      const sharedWikiLinks = Array.from(note.content.matchAll(/\[\[([^\]]+)\]\]/g))
        .map((match) => match[1]?.trim())
        .filter((value): value is string => Boolean(value))
        .filter((title) => normalizeTitle(title) === normalizeTitle(selectedNote.title));

      let score = 0;
      const reasons: string[] = [];

      if (sharedTitleTokens.length > 0) {
        score += sharedTitleTokens.length * 18;
        reasons.push(`Shared theme: ${formatReasonLabel(sharedTitleTokens[0])}`);
      }

      if (sharedPriorityTokens.length > 0) {
        score += sharedPriorityTokens.length * 12;
        reasons.push(`Concept overlap: ${formatReasonLabel(sharedPriorityTokens[0])}`);
      }

      if (sharedContentTokens.length > 0) {
        score += Math.min(30, sharedContentTokens.length * 4);
      }

      if (note.folder && selectedNote.folder && note.folder === selectedNote.folder) {
        score += 10;
        reasons.push(`Same area: ${note.folder}`);
      }

      if (backlinkIds.has(note.id) || sharedWikiLinks.length > 0) {
        score += 24;
        reasons.push("Directly linked");
      }

      if ((note.tags ?? []).some((tag) => (selectedNote.tags ?? []).includes(tag))) {
        score += 8;
        reasons.push(`Shared tag: ${(note.tags ?? []).find((tag) => (selectedNote.tags ?? []).includes(tag))}`);
      }

      if (score <= 0) {
        return null;
      }

      return {
        note,
        score,
        reasons: Array.from(new Set(reasons)).slice(0, 2)
      };
    })
    .filter((item): item is SemanticRelatedNote => item !== null)
    .sort((left, right) => right.score - left.score || new Date(right.note.updatedAt).getTime() - new Date(left.note.updatedAt).getTime())
    .slice(0, 6);
}

function buildRecentTrail(notes: VaultNote[], selectedNote: VaultNote | null) {
  return [...notes]
    .filter((note) => note.id !== selectedNote?.id)
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 6);
}

function structureRecognizedNoteText(raw: string) {
  const cleaned = cleanRecognizedNoteText(raw);
  const lines = cleaned.split("\n").map((line) => line.trim()).filter(Boolean);
  const structured: string[] = [];
  let hasInsertedHeading = false;

  for (const line of lines) {
    const normalized = line.replace(/\s+/g, " ").trim();
    const isLikelyHeading = /^[A-Z][A-Za-z0-9 ,:'"()/-]{3,48}$/.test(normalized) && !/[.!?]$/.test(normalized);
    const isLikelyBullet = /^[-*]/.test(normalized) || /^\d+[.)]/.test(normalized);

    if (!hasInsertedHeading && isLikelyHeading) {
      structured.push(`### ${normalized.replace(/^[-*]\s*/, "")}`);
      hasInsertedHeading = true;
      continue;
    }

    if (isLikelyBullet) {
      structured.push(`- ${normalized.replace(/^([-*]|\d+[.)])\s*/, "")}`);
      continue;
    }

    if (normalized.length < 42 && isLikelyHeading) {
      structured.push(`#### ${normalized}`);
      continue;
    }

    structured.push(normalized);
  }

  return structured.join("\n\n").replace(/\n{3,}/g, "\n\n");
}

function buildImportedTextBlock(text: string) {
  const cleaned = structureRecognizedNoteText(text);
  const timestamp = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date());

  return cleaned ? `## Imported from camera\n\n_Captured ${timestamp}_\n\n${cleaned}\n\n` : "";
}

function shortNoteExcerpt(content: string) {
  const compact = content.replace(/^#.*$/gm, "").replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/\s+/g, " ").trim();
  return compact ? compact.slice(0, 120) : "Empty note.";
}

function inferClusterModeFromNote(note: VaultNote): VaultNoteClusterMode {
  if (note.clusterMode) {
    return note.clusterMode;
  }

  const combined = `${note.folder ?? ""} ${note.colorGroup ?? ""} ${(note.tags ?? []).join(" ")} ${note.title}`.toLowerCase();

  if (/(project|launch|roadmap|ops|workflow|sprint|quarter)/.test(combined)) {
    return "projects";
  }

  if (/(relationship|people|person|meeting|personal|life|health|home|finance|fitness)/.test(combined)) {
    return "people";
  }

  if (/(research|learning|reference|question|graph|knowledge|system|reading|prompt|design)/.test(combined)) {
    return "research";
  }

  return "ideas";
}

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function parseActionDate(value: string) {
  const normalized = value.toLowerCase();
  const today = startOfToday();

  if (normalized.includes("today")) {
    return today.toISOString().slice(0, 10);
  }

  if (normalized.includes("tomorrow")) {
    today.setDate(today.getDate() + 1);
    return today.toISOString().slice(0, 10);
  }

  if (normalized.includes("next week")) {
    today.setDate(today.getDate() + 7);
    return today.toISOString().slice(0, 10);
  }

  const weekdayMatch = normalized.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);

  if (weekdayMatch) {
    const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = names.indexOf(weekdayMatch[1]);
    const currentDay = today.getDay();
    const delta = ((targetDay - currentDay + 7) % 7) || 7;
    today.setDate(today.getDate() + delta);
    return today.toISOString().slice(0, 10);
  }

  const isoDateMatch = normalized.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  return isoDateMatch?.[1];
}

function extractActionSuggestions(note: VaultNote | null) {
  if (!note) {
    return [];
  }

  const lines = note.content.split("\n").map((line) => line.trim()).filter(Boolean);
  const actions: ExtractedAction[] = [];

  for (const line of lines) {
    const plainLine = line.replace(/^[-*]\s*/, "").trim();

    if (/^(todo|task|follow up|follow-up|remember|send|call|email|finish|review|schedule|plan|build|connect|capture|draft)\b/i.test(plainLine)) {
      actions.push({
        kind: "task",
        label: "Turn into checklist item",
        detail: plainLine,
        line: plainLine
      });
    }

    const detectedDate = parseActionDate(plainLine);
    if (detectedDate) {
      actions.push({
        kind: "schedule",
        label: "Schedule this note",
        detail: detectedDate,
        line: plainLine,
        date: detectedDate
      });
    }

    if (/\b(expand|explore|follow up|question|idea|investigate)\b/i.test(plainLine) && plainLine.length > 18) {
      actions.push({
        kind: "followup",
        label: "Create follow-up note",
        detail: plainLine,
        line: plainLine
      });
    }
  }

  return actions.slice(0, 6);
}

function buildWritingPrompts(note: VaultNote | null, notes: VaultNote[]) {
  if (!note) {
    return [];
  }

  const prompts: WritingPrompt[] = [];
  const combined = `${note.title}\n${note.content}`.toLowerCase();

  const linkCandidate = notes.find((entry) => {
    if (entry.id === note.id) {
      return false;
    }

    const normalizedTitle = entry.title.toLowerCase();
    return combined.includes(normalizedTitle) && !note.content.includes(`[[${entry.title}]]`);
  });

  if (linkCandidate) {
    prompts.push({
      id: `link:${linkCandidate.id}`,
      label: `Link this to ${linkCandidate.title}`,
      detail: "You mention this note already. Turn it into a living connection.",
      action: "link",
      target: linkCandidate.title
    });
  }

  if (/\b(ship|launch|roadmap|deliver|milestone|build|project)\b/i.test(combined)) {
    prompts.push({
      id: "cluster:projects",
      label: "This looks like a project",
      detail: "Shift this note into the Projects mode for stronger structure.",
      action: "cluster",
      clusterMode: "projects"
    });
  }

  if (/\b(question|research|investigate|compare|study|explore|why)\b/i.test(combined)) {
    prompts.push({
      id: "cluster:research",
      label: "This reads like research",
      detail: "Mark it as Research so related notes gather around it.",
      action: "cluster",
      clusterMode: "research"
    });
  }

  if (/\b(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week)\b/i.test(combined)) {
    prompts.push({
      id: "schedule:detected",
      label: "This note mentions a time",
      detail: "Pull the timing into the schedule section so it stays actionable.",
      action: "schedule"
    });
  }

  return prompts.slice(0, 4);
}

function buildDailyMemory(notes: VaultNote[], selectedNote: VaultNote | null) {
  if (!selectedNote) {
    return [];
  }

  const selectedTokens = new Set(pickTopTokens(`${selectedNote.title} ${selectedNote.content}`, 8));

  return notes
    .filter((note) => note.id !== selectedNote.id)
    .map((note) => {
      const overlap = pickTopTokens(`${note.title} ${note.content}`, 8).filter((token) => selectedTokens.has(token));
      return {
        note,
        overlap
      };
    })
    .filter((entry) => entry.overlap.length > 0 && new Date(entry.note.updatedAt).getTime() < new Date(selectedNote.updatedAt).getTime())
    .sort((left, right) => new Date(right.note.updatedAt).getTime() - new Date(left.note.updatedAt).getTime())
    .slice(0, 4);
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

async function createHighContrastOcrVariant(file: File) {
  const bitmap = await createImageBitmap(file);
  const targetWidth = Math.min(2200, Math.max(1600, bitmap.width));
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

  context.filter = "grayscale(1) contrast(1.38) brightness(1.06)";
  context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  context.filter = "none";
  bitmap.close();

  const imageData = context.getImageData(0, 0, targetWidth, targetHeight);
  const { data } = imageData;

  for (let index = 0; index < data.length; index += 4) {
    const grayscale = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const boosted = grayscale > 188 ? 255 : grayscale < 92 ? 0 : Math.round((grayscale - 92) * 2.65);
    data[index] = boosted;
    data[index + 1] = boosted;
    data[index + 2] = boosted;
  }

  context.putImageData(imageData, 0, 0);

  return new Promise<File>((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob ? new File([blob], file.name || "scan-contrast.png", { type: "image/png" }) : file);
      },
      "image/png",
      1
    );
  });
}

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
  const [publicSelectedNoteId, setPublicSelectedNoteId] = useState(initialVault.notes[0]?.id ?? "");
  const [phaseShift, setPhaseShift] = useState<"idle" | "enter-note" | "return-vault">("idle");
  const [preferPrivateWorkspace, setPreferPrivateWorkspace] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(PRIVATE_WORKSPACE_KEY) === "1";
  });
  const [isStandaloneWorkspace, setIsStandaloneWorkspace] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  });
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
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<{
    noteId: string;
    updates: Partial<Pick<VaultNote, "title" | "content" | "schedule">>;
  } | null>(null);
  const focusFreshNoteRef = useRef(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const selectedNoteRef = useRef<VaultNote | null>(null);
  const absorbCapturedNoteRef = useRef<((file: File) => Promise<void>) | null>(null);
  const schedulePanelRef = useRef<HTMLDivElement | null>(null);
  const semanticPanelRef = useRef<HTMLDivElement | null>(null);
  const actionsPanelRef = useRef<HTMLDivElement | null>(null);
  const memoryPanelRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number; allowGesture: boolean } | null>(null);
  const previousViewRef = useRef<"vault" | "note">("vault");
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const privateSeedNotes = isLoaded ? notes : defaultVaultData.notes;
  const privateSeedLinks = isLoaded ? links : defaultVaultData.links;
  const publicSeedNotes = initialVault.notes;
  const publicSeedLinks = initialVault.links;
  const workspaceMode: "public" | "private" = isStandaloneWorkspace || preferPrivateWorkspace ? "private" : "public";
  const workingNotes = workspaceMode === "public" ? publicSeedNotes : privateSeedNotes;
  const workingLinks = workspaceMode === "public" ? publicSeedLinks : privateSeedLinks;
  const effectiveNotes = useDeferredValue(workingNotes);
  const effectiveLinks = useDeferredValue(workingLinks);
  const effectiveSelectedNoteId = workspaceMode === "public" ? publicSelectedNoteId : (isLoaded ? selectedNoteId : defaultVaultData.notes[0]?.id ?? "");
  const selectedNote = getSelectedNote(effectiveNotes, effectiveSelectedNoteId);
  const isReadOnly = workspaceMode === "public";
  const backlinks = getBacklinks(effectiveNotes, selectedNote, effectiveLinks);
  const upcomingScheduledNotes = [...effectiveNotes]
    .filter((note) => note.schedule?.date && !note.schedule.done)
    .map((note) => ({ note, timestamp: scheduleToTimestamp(note.schedule) }))
    .filter((item): item is { note: VaultNote; timestamp: number } => item.timestamp !== null)
    .sort((left, right) => left.timestamp - right.timestamp)
    .slice(0, isCompact ? 4 : 6);
  const selectedSchedule = selectedNote?.schedule;
  const editorTitle = selectedNote && draftNoteId === selectedNote.id ? draftTitle : selectedNote?.title ?? "";
  const editorContent =
    selectedNote && draftNoteId === selectedNote.id ? draftContent : selectedNote ? stripLeadingTitleHeading(selectedNote.title, selectedNote.content) : "";
  const semanticRelatedNotes = buildSemanticRelatedNotes(effectiveNotes, selectedNote, backlinks);
  const recentTrailNotes = buildRecentTrail(effectiveNotes, selectedNote);
  const extractedActions = extractActionSuggestions(selectedNote);
  const writingPrompts = buildWritingPrompts(selectedNote, effectiveNotes);
  const dailyMemoryNotes = buildDailyMemory(effectiveNotes, selectedNote);
  const selectedSnapshots = selectedNote?.snapshots ?? [];

  const openNoteInCurrentMode = useCallback((noteId: string) => {
    setActiveView("note");
    startTransition(() => {
      if (workspaceMode === "public") {
        setPublicSelectedNoteId(noteId);
      } else {
        selectNote(noteId);
      }
    });
  }, [selectNote, workspaceMode]);

  useEffect(() => {
    selectedNoteRef.current = selectedNote;
  }, [selectedNote]);

  useEffect(() => {
    if (!hasHydratedInitialData) {
      initializeVault(defaultVaultData);
    }
  }, [hasHydratedInitialData, initializeVault]);

  useEffect(() => {
    const previousView = previousViewRef.current;

    if (previousView === activeView) {
      return;
    }

    if (previousView === "vault" && activeView === "note") {
      setPhaseShift("enter-note");
      const timeout = window.setTimeout(() => setPhaseShift("idle"), 420);
      previousViewRef.current = activeView;
      return () => window.clearTimeout(timeout);
    }

    if (previousView === "note" && activeView === "vault") {
      setPhaseShift("return-vault");
      const timeout = window.setTimeout(() => setPhaseShift("idle"), 320);
      previousViewRef.current = activeView;
      return () => window.clearTimeout(timeout);
    }

    previousViewRef.current = activeView;
  }, [activeView]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateMode = () => {
      setIsStandaloneWorkspace(mediaQuery.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
    };

    updateMode();
    mediaQuery.addEventListener("change", updateMode);

    return () => mediaQuery.removeEventListener("change", updateMode);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (preferPrivateWorkspace) {
      window.localStorage.setItem(PRIVATE_WORKSPACE_KEY, "1");
    } else {
      window.localStorage.removeItem(PRIVATE_WORKSPACE_KEY);
    }
  }, [preferPrivateWorkspace]);

  useEffect(() => {
    loadVault().catch(() => {
      // Keep startup quiet. The local vault remains the primary experience.
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
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (activeView !== "note") {
      return;
    }

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      setActiveView("vault");
    }, 45_000);
  }, [activeView]);

  useEffect(() => {
    if (activeView !== "note") {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    resetInactivityTimer();

    const markActivity = () => resetInactivityTimer();
    window.addEventListener("pointerdown", markActivity, { passive: true });
    window.addEventListener("keydown", markActivity);
    window.addEventListener("touchstart", markActivity, { passive: true });
    window.addEventListener("wheel", markActivity, { passive: true });
    window.addEventListener("focusin", markActivity);

    return () => {
      window.removeEventListener("pointerdown", markActivity);
      window.removeEventListener("keydown", markActivity);
      window.removeEventListener("touchstart", markActivity);
      window.removeEventListener("wheel", markActivity);
      window.removeEventListener("focusin", markActivity);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [activeView, resetInactivityTimer]);

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

    const pending = pendingSaveRef.current;
    pendingSaveRef.current =
      pending && pending.noteId === noteId
        ? {
            noteId,
            updates: {
              ...pending.updates,
              ...updates
            }
          }
        : {
            noteId,
            updates
          };

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        const nextPending = pendingSaveRef.current;

        if (!nextPending || nextPending.noteId !== noteId) {
          return;
        }

        pendingSaveRef.current = null;
        await updateNote(noteId, nextPending.updates);
      } catch {
        toast.message("Your note will keep updating here");
      }
    }, 420);
  }, [updateNote]);

  const editor = useEditor({
    immediatelyRender: false,
    content: editorContent,
    contentType: "markdown",
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Underline,
      Link.configure({
        autolink: true,
        openOnClick: false,
        protocols: ["mailto", "tel"]
      }),
      Placeholder.configure({
        placeholder: "Start writing..."
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Highlight,
      Markdown.configure({
        indentation: {
          style: "space",
          size: 2
        }
      })
    ],
    editorProps: {
      attributes: {
        class: isCompact
          ? "note-rich-editor prose prose-invert max-w-none min-h-[56vh] px-4 pb-4 pt-1 text-[18px] leading-[1.72] text-white outline-none"
          : "note-rich-editor prose prose-invert max-w-none min-h-[60vh] px-6 py-5 text-[17px] leading-[1.85] text-white outline-none"
      },
      handlePaste: (_view, event) => {
        const file = Array.from(event.clipboardData?.files ?? []).find((entry): entry is File => entry instanceof File && entry.type.startsWith("image/"));

        if (!file) {
          return false;
        }

        event.preventDefault();
        void absorbCapturedNoteRef.current?.(file);
        return true;
      }
    },
    onUpdate({ editor: activeEditor }) {
      const currentNote = selectedNoteRef.current;

      if (!currentNote || isReadOnly) {
        return;
      }

      resetInactivityTimer();
      const markdown = activeEditor.getMarkdown().replace(/\u00a0/g, " ");
      setDraftNoteId(currentNote.id);
      setDraftContent(markdown);
      void queueSave(currentNote.id, { content: markdown });
    }
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!isReadOnly);
  }, [editor, isReadOnly]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (!selectedNote) {
      setDraftNoteId("");
      setDraftTitle("");
      setDraftContent("");
      editor.commands.setContent("", { contentType: "markdown", emitUpdate: false });
      return;
    }

    if (draftNoteId === selectedNote.id) {
      return;
    }

    const nextContent = stripLeadingTitleHeading(selectedNote.title, selectedNote.content);
    const nextTitle = focusFreshNoteRef.current && selectedNote.title === "Untitled note" ? "" : selectedNote.title;

    setDraftNoteId(selectedNote.id);
    setDraftTitle(nextTitle);
    setDraftContent(nextContent);

    if (editor.getMarkdown() !== nextContent) {
      editor.commands.setContent(nextContent, { contentType: "markdown", emitUpdate: false });
    }
  }, [draftNoteId, editor, selectedNote]);

  async function createFreshNote(graphPosition?: VaultNote["graphPosition"], connectToTitle?: string) {
    if (isReadOnly) {
      setPreferPrivateWorkspace(true);
    }

    const anchorTitle = connectToTitle?.trim() || selectedNote?.title?.trim() || "";
    const initialContent = anchorTitle ? `Linked from [[${anchorTitle}]]\n\n` : "";

    focusFreshNoteRef.current = true;

    try {
      const creation = createNote({
        title: "Untitled note",
        content: initialContent,
        colorGroup: selectedNote?.colorGroup ?? selectedNote?.folder ?? "Vault",
        folder: selectedNote?.folder ?? "Vault",
        status: "draft",
        graphPosition
      });
      setActiveView("note");
      await creation;
    } catch {
      focusFreshNoteRef.current = false;
      setActiveView("vault");
      toast.error("Could not create note");
    }
  }

  async function startEditingPublicCopy() {
    if (!selectedNote || !isReadOnly) {
      return;
    }

    const existingPrivateNote = privateSeedNotes.find((note) => normalizeTitle(note.title) === normalizeTitle(selectedNote.title));

    setPreferPrivateWorkspace(true);
    setActiveView("note");

    if (existingPrivateNote) {
      selectNote(existingPrivateNote.id);
      return;
    }

    focusFreshNoteRef.current = true;

    try {
      const creation = createNote({
        title: selectedNote.title,
        content: stripLeadingTitleHeading(selectedNote.title, selectedNote.content),
        colorGroup: selectedNote.colorGroup ?? selectedNote.folder ?? "Vault",
        folder: selectedNote.folder ?? selectedNote.colorGroup ?? "Vault",
        tags: Array.from(new Set([...(selectedNote.tags ?? []), "personal-copy"])),
        status: "draft"
      });

      await creation;
      const latest = useVaultStore.getState().notes[0];

      if (latest) {
        selectNote(latest.id);
      }

      toast.success("Opened your editable copy");
    } catch {
      toast.error("Could not open your personal copy");
    }
  }

  async function updateSchedule(updates: Partial<VaultNoteSchedule>) {
    if (!selectedNote || isReadOnly) {
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
      const currentNote = selectedNoteRef.current;

    if (!currentNote || isReadOnly) {
      return;
    }

    try {
      setIsRecognizingText(true);
      setRecognitionProgress(0.06);
      const preparedFile = await preprocessImageForOcr(file);
      const contrastFile = await createHighContrastOcrVariant(file);
      const candidates: OcrCandidate[] = [];

      if ("TextDetector" in window) {
        try {
          const detector = new (window as Window & { TextDetector: new () => { detect: (source: ImageBitmapSource) => Promise<DetectedTextBlock[]> } }).TextDetector();
          const bitmap = await createImageBitmap(preparedFile);
          const blocks = await detector.detect(bitmap);
          bitmap.close();
          const nativeText = blocks.map((block) => block.rawValue?.trim()).filter(Boolean).join("\n");

          if (nativeText) {
            candidates.push({
              source: "native",
              variant: "detector",
              text: nativeText,
              confidence: 64,
              quality: scoreRecognizedTextQuality(nativeText, 64)
            });
          }

          setRecognitionProgress(0.24);
        } catch {
          // Ignore native detection failures and continue with OCR passes.
        }
      }

      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text" && typeof message.progress === "number") {
            setRecognitionProgress((current) => Math.max(current, 0.28 + message.progress * 0.64));
          }
        }
      });

      try {
        await worker.setParameters({
          preserve_interword_spaces: "1",
          user_defined_dpi: "300",
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK
        });

        const singleBlock = (await worker.recognize(preparedFile, { rotateAuto: true })) as RecognizeResult;
        const singleBlockText = extractConfidentOcrText(singleBlock);
        candidates.push({
          source: "tesseract",
          variant: "single-block",
          text: singleBlockText,
          confidence: singleBlock.data.confidence ?? 0,
          quality: scoreRecognizedTextQuality(singleBlockText, singleBlock.data.confidence ?? 0)
        });

        await worker.setParameters({
          preserve_interword_spaces: "1",
          user_defined_dpi: "300",
          tessedit_pageseg_mode: PSM.SPARSE_TEXT
        });

        const sparseText = (await worker.recognize(contrastFile, { rotateAuto: true })) as RecognizeResult;
        const sparseTextValue = extractConfidentOcrText(sparseText);
        candidates.push({
          source: "tesseract",
          variant: "sparse-text",
          text: sparseTextValue,
          confidence: sparseText.data.confidence ?? 0,
          quality: scoreRecognizedTextQuality(sparseTextValue, sparseText.data.confidence ?? 0)
        });
      } finally {
        await worker.terminate();
      }

      const bestCandidate = [...candidates]
        .filter((candidate) => candidate.text.trim().length > 0)
        .sort((left, right) => right.quality - left.quality)[0];

      if (!bestCandidate || bestCandidate.quality < 48) {
        toast.error("That photo was too unclear. Try a straighter shot with brighter light and tighter framing.");
        return;
      }

      const importedBlock = buildImportedTextBlock(bestCandidate.text);

      if (!importedBlock) {
        toast.error("No readable text was found in that photo");
        return;
      }

      if (editor) {
        const existingMarkdown = editor.getMarkdown().trim();
        const insertValue = `${existingMarkdown ? "\n\n" : ""}${importedBlock}`;
        editor.chain().focus().insertContent(insertValue, { contentType: "markdown" }).run();
      } else {
        const currentContent = draftNoteId === currentNote.id ? draftContent : stripLeadingTitleHeading(currentNote.title, currentNote.content);
        const insertValue = `${currentContent.trim() ? "\n\n" : ""}${importedBlock}`;
        const nextContent = `${currentContent}${insertValue}`;
        setDraftNoteId(currentNote.id);
        setDraftContent(nextContent);
        await queueSave(currentNote.id, { content: nextContent });
      }

      toast.success(bestCandidate.source === "tesseract" ? "Camera capture converted into note text" : "Camera text captured");
    } catch {
      toast.error("Could not extract text from that photo");
    } finally {
      setIsRecognizingText(false);
      setRecognitionProgress(0);
      if (cameraInputRef.current) {
        cameraInputRef.current.value = "";
      }
    }
  }, [draftContent, draftNoteId, editor, isReadOnly, queueSave]);

  useEffect(() => {
    absorbCapturedNoteRef.current = absorbCapturedNote;
  }, [absorbCapturedNote]);

  useEffect(() => {
    setSelectedSnapshotIndex(0);
  }, [selectedNote?.id, selectedSnapshots.length]);

  async function openLinkedNote(title: string) {
    if (isReadOnly) {
      const existing = effectiveNotes.find((note) => normalizeTitle(note.title) === normalizeTitle(title));
      if (existing) {
        setPublicSelectedNoteId(existing.id);
        setActiveView("note");
      }
      return;
    }

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

  async function updateClusterMode(clusterMode: VaultNoteClusterMode) {
    if (!selectedNote || isReadOnly) {
      return;
    }

    try {
      await updateNote(selectedNote.id, { clusterMode });
    } catch {
      toast.error("Could not update note mode");
    }
  }


  async function applyExtractedAction(action: ExtractedAction) {
    if (!selectedNote || !editor) {
      return;
    }

    if (action.kind === "task") {
      editor.chain().focus().insertContent(`\n- [ ] ${action.line}\n`, { contentType: "markdown" }).run();
      toast.success("Added to checklist");
      return;
    }

    if (action.kind === "schedule" && action.date) {
      await updateSchedule({ date: action.date, done: false });
      toast.success("Schedule pulled from note");
      return;
    }

    if (action.kind === "followup") {
      try {
        await createFreshNote(undefined, selectedNote.title);
        const latest = useVaultStore.getState().notes[0];
        if (latest) {
          await updateNote(latest.id, {
            title: action.line.slice(0, 72),
            content: `Linked from [[${selectedNote.title}]]\n\n${action.line}\n\n`
          });
        }
        toast.success("Follow-up note created");
      } catch {
        toast.error("Could not create follow-up note");
      }
    }
  }

  function applyWritingPrompt(prompt: WritingPrompt) {
    if (!selectedNote || !editor) {
      return;
    }

    if (prompt.action === "link" && prompt.target) {
      editor.chain().focus().insertContent(`[[${prompt.target}]]`, { contentType: "markdown" }).run();
      toast.success(`Linked to ${prompt.target}`);
      return;
    }

    if (prompt.action === "cluster" && prompt.clusterMode) {
      void updateClusterMode(prompt.clusterMode);
      return;
    }

    if (prompt.action === "schedule") {
      schedulePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function restoreSnapshot(snapshot: VaultNoteSnapshot) {
    if (!selectedNote || !editor) {
      return;
    }

    setDraftNoteId(selectedNote.id);
    setDraftTitle(snapshot.title);
    setDraftContent(snapshot.content);
    editor.commands.setContent(snapshot.content, { contentType: "markdown", emitUpdate: false });
    await queueSave(selectedNote.id, { title: snapshot.title, content: snapshot.content });
    toast.success("Snapshot restored");
  }

  function handleMobileGesture(eventType: "capture" | "schedule" | "related" | "memory") {
    if (eventType === "capture") {
      cameraInputRef.current?.click();
      return;
    }

    if (eventType === "schedule") {
      schedulePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (eventType === "related") {
      semanticPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    memoryPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  function promptForLink(activeEditor: Editor) {
    const currentHref = (activeEditor.getAttributes("link").href as string | undefined) ?? "";
    const provided = window.prompt("Enter a link", currentHref || "https://");

    if (provided === null) {
      return;
    }

    const nextHref = provided.trim();

    if (!nextHref) {
      activeEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const normalizedHref = /^(https?:|mailto:|tel:)/i.test(nextHref) ? nextHref : `https://${nextHref}`;
    activeEditor.chain().focus().extendMarkRange("link").setLink({ href: normalizedHref }).run();
  }

  const editorTools = editor
    ? [
        {
          id: "capture",
          label: "Capture with camera",
          icon: Camera,
          active: false,
          tone: "accent" as const,
          run: () => cameraInputRef.current?.click()
        },
        {
          id: "h1",
          label: "Heading 1",
          icon: Heading1,
          active: editor.isActive("heading", { level: 1 }),
          run: () => editor.chain().focus().toggleHeading({ level: 1 }).run()
        },
        {
          id: "h2",
          label: "Heading 2",
          icon: Heading2,
          active: editor.isActive("heading", { level: 2 }),
          run: () => editor.chain().focus().toggleHeading({ level: 2 }).run()
        },
        {
          id: "bold",
          label: "Bold",
          icon: Bold,
          active: editor.isActive("bold"),
          run: () => editor.chain().focus().toggleBold().run()
        },
        {
          id: "italic",
          label: "Italic",
          icon: Italic,
          active: editor.isActive("italic"),
          run: () => editor.chain().focus().toggleItalic().run()
        },
        {
          id: "underline",
          label: "Underline",
          icon: UnderlineIcon,
          active: editor.isActive("underline"),
          run: () => editor.chain().focus().toggleUnderline().run()
        },
        {
          id: "strike",
          label: "Strikethrough",
          icon: Strikethrough,
          active: editor.isActive("strike"),
          run: () => editor.chain().focus().toggleStrike().run()
        },
        {
          id: "highlight",
          label: "Highlight",
          icon: Highlighter,
          active: editor.isActive("highlight"),
          run: () => editor.chain().focus().toggleHighlight().run()
        },
        {
          id: "bullet",
          label: "Bullet list",
          icon: List,
          active: editor.isActive("bulletList"),
          run: () => editor.chain().focus().toggleBulletList().run()
        },
        {
          id: "ordered",
          label: "Numbered list",
          icon: ListOrdered,
          active: editor.isActive("orderedList"),
          run: () => editor.chain().focus().toggleOrderedList().run()
        },
        {
          id: "todo",
          label: "Checklist",
          icon: ListTodo,
          active: editor.isActive("taskList"),
          run: () => editor.chain().focus().toggleTaskList().run()
        },
        {
          id: "quote",
          label: "Quote",
          icon: Quote,
          active: editor.isActive("blockquote"),
          run: () => editor.chain().focus().toggleBlockquote().run()
        },
        {
          id: "divider",
          label: "Divider",
          icon: Minus,
          active: false,
          run: () => editor.chain().focus().setHorizontalRule().run()
        },
        {
          id: "link",
          label: "Link",
          icon: Link2,
          active: editor.isActive("link"),
          run: () => promptForLink(editor)
        },
        {
          id: "undo",
          label: "Undo",
          icon: Undo2,
          active: false,
          disabled: !editor.can().chain().focus().undo().run(),
          run: () => editor.chain().focus().undo().run()
        },
        {
          id: "redo",
          label: "Redo",
          icon: Redo2,
          active: false,
          disabled: !editor.can().chain().focus().redo().run(),
          run: () => editor.chain().focus().redo().run()
        }
      ]
    : [];

  const editorToolbar = (
    <div
      className={
        isCompact
          ? "pointer-events-auto mx-auto flex w-full max-w-[420px] items-center gap-2 overflow-x-auto rounded-[26px] border border-white/10 bg-[rgba(12,16,24,0.92)] px-2.5 py-2 shadow-[0_22px_70px_rgba(0,0,0,0.34)] backdrop-blur-2xl"
          : "flex flex-wrap items-center gap-2 rounded-[24px] border border-white/10 bg-black/20 p-3"
      }
    >
      {editorTools.map((tool) => {
        const Icon = tool.icon;
        const isActive = tool.active;
        const isDisabled = Boolean(tool.disabled) || (tool.id === "capture" && isRecognizingText);
        const isAccent = tool.tone === "accent";

        return (
          <button
            key={tool.id}
            type="button"
            onClick={tool.run}
            disabled={isDisabled}
            className={
              isAccent
                ? isCompact
                  ? "inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(239,191,114,0.2)] bg-[rgba(239,191,114,0.12)] text-[#fff4de] transition hover:bg-[rgba(239,191,114,0.18)] disabled:opacity-60"
                  : "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[rgba(239,191,114,0.18)] bg-[rgba(239,191,114,0.1)] text-[#fff4de] transition hover:bg-[rgba(239,191,114,0.16)] disabled:opacity-60"
                : isActive
                  ? "inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--accent-blue)] bg-[color:var(--accent-blue-soft)] text-white transition hover:bg-[rgba(154,169,187,0.22)] disabled:opacity-50"
                  : isCompact
                    ? "inline-flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/88 transition hover:bg-white/12 disabled:opacity-50"
                    : "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/84 transition hover:bg-white/12 disabled:opacity-50"
            }
            aria-label={tool.label}
            title={tool.label}
          >
            {tool.id === "capture" && isRecognizingText ? <LoaderCircle className={`${isCompact ? "size-4.5" : "size-4"} animate-spin`} /> : <Icon className={isCompact ? "size-4.5" : "size-4"} />}
          </button>
        );
      })}
      {!isCompact ? (
        <p className="ml-auto text-xs uppercase tracking-[0.22em] text-slate-500">
          {isRecognizingText ? `Scanning ${(recognitionProgress * 100).toFixed(0)}%` : "Rich text tools"}
        </p>
      ) : null}
    </div>
  );

  const schedulePanel = selectedNote ? (
    <div ref={schedulePanelRef} className={isCompact ? "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4" : "rounded-[28px] border border-white/10 bg-black/20 p-4"}>
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
            <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Camera capture</p>
          </div>
          <p className={isCompact ? "mt-2 text-sm leading-6 text-white/72" : "mt-2 text-sm text-slate-300"}>
            Take a cleaner photo of handwritten or printed notes and turn it into precise editable text.
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

  const clusterPanel = selectedNote ? (
    <div className={isCompact ? "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4" : "rounded-[28px] border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-[color:var(--accent-amber)]" />
        <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Note mode</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {CLUSTER_MODES.map((mode) => {
          const Icon = mode.icon;
          const active = inferClusterModeFromNote(selectedNote) === mode.id;

          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                void updateClusterMode(mode.id);
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition ${
                active
                  ? "border-[rgba(239,191,114,0.24)] bg-[rgba(239,191,114,0.14)] text-[#fff4de]"
                  : "border-white/10 bg-white/6 text-white/84 hover:bg-white/10"
              }`}
            >
              <Icon className="size-4" />
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  const promptsPanel = writingPrompts.length ? (
    <div className={isCompact ? "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4" : "rounded-[28px] border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-center gap-2">
        <Lightbulb className="size-4 text-[color:var(--accent-amber)]" />
        <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Writing prompts</p>
      </div>
      <div className="mt-3 space-y-2">
        {writingPrompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => applyWritingPrompt(prompt)}
            className="flex w-full items-start justify-between rounded-[18px] border border-white/8 bg-white/5 px-3.5 py-3 text-left transition hover:bg-white/8"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-white">{prompt.label}</span>
              <span className="mt-1 block text-xs text-slate-400">{prompt.detail}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  const actionsPanel = extractedActions.length ? (
    <div ref={actionsPanelRef} className={isCompact ? "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4" : "rounded-[28px] border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-center gap-2">
        <Check className="size-4 text-[color:var(--accent-amber)]" />
        <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Smart actions</p>
      </div>
      <div className="mt-3 space-y-2">
        {extractedActions.map((action, index) => (
          <button
            key={`${action.kind}-${index}`}
            type="button"
            onClick={() => {
              void applyExtractedAction(action);
            }}
            className="flex w-full items-center justify-between rounded-[18px] border border-white/8 bg-white/5 px-3.5 py-3 text-left transition hover:bg-white/8"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-white">{action.label}</span>
              <span className="mt-1 block truncate text-xs text-slate-400">{action.detail}</span>
            </span>
            <span className="ml-3 rounded-full border border-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
              {action.kind}
            </span>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  const semanticPanel = semanticRelatedNotes.length ? (
    <div ref={semanticPanelRef} className={isCompact ? "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4" : "rounded-[28px] border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-[color:var(--accent-amber)]" />
        <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Related threads</p>
      </div>
      <div className="mt-3 space-y-2">
        {semanticRelatedNotes.map(({ note, reasons, score }) => (
          <button
            key={note.id}
            type="button"
            onClick={() => {
              openNoteInCurrentMode(note.id);
            }}
            className="flex w-full items-start justify-between rounded-[18px] border border-white/8 bg-white/5 px-3.5 py-3 text-left transition hover:bg-white/8"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{note.title}</span>
              <span className="mt-1 block text-xs text-slate-400">{reasons.join(" | ")}</span>
            </span>
            <span className="ml-3 shrink-0 rounded-full border border-[rgba(239,191,114,0.18)] bg-[rgba(239,191,114,0.08)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[#fff4de]">
              {Math.round(score)}
            </span>
          </button>
        ))}
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
              openNoteInCurrentMode(note.id);
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

  const recentTrailPanel = recentTrailNotes.length ? (
    <div className={isCompact ? `${isKeyboardOpen ? "hidden" : "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4"}` : "mt-6 rounded-[28px] border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-center gap-2">
        <History className="size-4 text-[color:var(--accent-amber)]" />
        <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Resume trail</p>
      </div>
      <p className={isCompact ? "mt-2 text-sm leading-6 text-white/68" : "mt-2 text-sm text-slate-300"}>Pick up where your recent thinking left off.</p>
      <div className="mt-3 space-y-2">
        {recentTrailNotes.map((note, index) => (
          <button
            key={note.id}
            type="button"
            onClick={() => {
              openNoteInCurrentMode(note.id);
            }}
            className="flex w-full items-center justify-between rounded-[18px] border border-white/8 bg-white/5 px-3.5 py-3 text-left transition hover:bg-white/8"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{note.title}</span>
              <span className="mt-1 block text-xs text-slate-400">Updated {formatUpdatedAt(note.updatedAt)}</span>
            </span>
            <span className="ml-3 rounded-full border border-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
              {index === 0 ? "Now" : "Recent"}
            </span>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  const memoryPanel = dailyMemoryNotes.length ? (
    <div ref={memoryPanelRef} className={isCompact ? `${isKeyboardOpen ? "hidden" : "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4"}` : "mt-6 rounded-[28px] border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-center gap-2">
        <History className="size-4 text-[color:var(--accent-amber)]" />
        <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Daily memory</p>
      </div>
      <p className={isCompact ? "mt-2 text-sm leading-6 text-white/68" : "mt-2 text-sm text-slate-300"}>You wrote this before, and it connects here.</p>
      <div className="mt-3 space-y-2">
        {dailyMemoryNotes.map(({ note, overlap }) => (
          <button
            key={note.id}
            type="button"
            onClick={() => {
              openNoteInCurrentMode(note.id);
            }}
            className="flex w-full items-center justify-between rounded-[18px] border border-white/8 bg-white/5 px-3.5 py-3 text-left transition hover:bg-white/8"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{note.title}</span>
              <span className="mt-1 block text-xs text-slate-400">Connected through {overlap.slice(0, 2).join(" / ")}</span>
            </span>
            <span className="ml-3 rounded-full border border-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300">
              Recall
            </span>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  const historyPanel = selectedSnapshots.length ? (
    <div className={isCompact ? "mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4" : "rounded-[28px] border border-white/10 bg-black/20 p-4"}>
      <div className="flex items-center gap-2">
        <History className="size-4 text-[color:var(--accent-amber)]" />
        <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Thought history</p>
      </div>
      <p className={isCompact ? "mt-2 text-sm leading-6 text-white/68" : "mt-2 text-sm text-slate-300"}>Scrub back through earlier versions of this note.</p>
      <input
        type="range"
        min={0}
        max={Math.max(0, selectedSnapshots.length - 1)}
        value={Math.min(selectedSnapshotIndex, Math.max(0, selectedSnapshots.length - 1))}
        onChange={(event) => setSelectedSnapshotIndex(Number(event.target.value))}
        className="mt-4 w-full accent-[color:var(--accent-amber)]"
      />
      {selectedSnapshots[Math.min(selectedSnapshotIndex, selectedSnapshots.length - 1)] ? (
        <div className="mt-3 rounded-[18px] border border-white/8 bg-white/5 p-3">
          <p className="text-sm font-medium text-white">{selectedSnapshots[Math.min(selectedSnapshotIndex, selectedSnapshots.length - 1)]?.title || "Untitled snapshot"}</p>
          <p className="mt-1 text-xs text-slate-400">Saved {formatUpdatedAt(selectedSnapshots[Math.min(selectedSnapshotIndex, selectedSnapshots.length - 1)]!.createdAt)}</p>
          <p className="mt-2 text-sm text-slate-300">{shortNoteExcerpt(selectedSnapshots[Math.min(selectedSnapshotIndex, selectedSnapshots.length - 1)]!.content)}</p>
          <button
            type="button"
            onClick={() => {
              const snapshot = selectedSnapshots[Math.min(selectedSnapshotIndex, selectedSnapshots.length - 1)];
              if (snapshot) {
                void restoreSnapshot(snapshot);
              }
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-[rgba(239,191,114,0.2)] bg-[rgba(239,191,114,0.12)] px-3.5 py-2 text-sm text-[#fff4de] transition hover:bg-[rgba(239,191,114,0.18)]"
          >
            <History className="size-4" />
            Restore snapshot
          </button>
        </div>
      ) : null}
    </div>
  ) : null;

  if (loadError && effectiveNotes.length === 0) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-xl p-8 text-center">
          <p className="text-lg font-semibold text-white">Your notes need a moment</p>
          <p className="mt-2 text-sm text-slate-400">{loadError || "Try opening the vault again in a moment."}</p>
          <div className="mt-5">
            <Button variant="accent" type="button" onClick={() => void loadVault()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!isLoaded && privateSeedNotes.length === 0) {
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
      <div className={`mx-auto h-[100svh] min-h-[100svh] max-w-[1800px] overflow-hidden px-0 py-0 sm:h-dvh sm:min-h-0 sm:px-3 sm:py-3 lg:px-4 ${phaseShift === "return-vault" ? "vault-phase-return" : ""}`}>
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
            mode={workspaceMode}
            selectedNote={selectedNote}
            selectedClusterMode="all"
            onSelectNote={(noteId) => {
              if (workspaceMode === "public") {
                setPublicSelectedNoteId(noteId);
                return;
              }

              selectNote(noteId);
            }}
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
    <div className={`${isCompact ? "min-h-dvh bg-black" : "mx-auto max-w-6xl px-4 py-5 transition-all duration-300 ease-out sm:px-6 lg:px-8"} ${phaseShift === "enter-note" ? "vault-phase-enter" : ""}`}>
      <div
        className={
          isCompact
            ? "min-h-dvh bg-black text-white"
            : "rounded-[36px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition-all duration-300 ease-out sm:p-7"
        }
      >
        {selectedNote ? (
          <>
            {!isReadOnly ? (
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
            ) : null}
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
                {!isCompact ? <span>{isReadOnly ? "Topic note" : isSaving ? "Updating..." : "Up to date"}</span> : null}
                {isReadOnly ? (
                  <button
                    type="button"
                    onClick={() => {
                      void startEditingPublicCopy();
                    }}
                    className={
                      isCompact
                        ? "inline-flex h-12 items-center justify-center rounded-full border border-[rgba(239,191,114,0.22)] bg-[rgba(239,191,114,0.14)] px-4 text-sm font-medium text-[#fff4de] shadow-[0_20px_56px_rgba(0,0,0,0.28)] transition hover:bg-[rgba(239,191,114,0.2)]"
                        : "rounded-full border border-[rgba(239,191,114,0.22)] bg-[rgba(239,191,114,0.12)] px-3.5 py-2 text-[#fff4de] transition hover:bg-[rgba(239,191,114,0.18)]"
                    }
                  >
                    Edit
                  </button>
                ) : null}
                {!isReadOnly ? (
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
                ) : null}
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
              onTouchStart={
                isCompact
                  ? (event) => {
                      const touch = event.touches[0];
                      if (!touch) {
                        return;
                      }

                      touchStartRef.current = {
                        x: touch.clientX,
                        y: touch.clientY,
                        time: performance.now(),
                        allowGesture: touch.clientY > window.innerHeight - 180
                      };
                    }
                  : undefined
              }
              onTouchEnd={
                isCompact
                  ? (event) => {
                      const start = touchStartRef.current;
                      const touch = event.changedTouches[0];
                      touchStartRef.current = null;

                      if (!start || !touch || !start.allowGesture) {
                        return;
                      }

                      const deltaX = touch.clientX - start.x;
                      const deltaY = touch.clientY - start.y;
                      const elapsed = performance.now() - start.time;

                      if (elapsed > 320) {
                        return;
                      }

                      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 72 && Math.abs(deltaY) < 42) {
                        handleMobileGesture(deltaX > 0 ? "related" : "schedule");
                        return;
                      }

                      if (Math.abs(deltaY) > 88 && Math.abs(deltaX) < 42) {
                        handleMobileGesture(deltaY < 0 ? "capture" : "memory");
                      }
                    }
                  : undefined
              }
            >
              {isCompact ? <p className="pt-3 text-center text-[15px] text-white/45">{noteDateLabel}</p> : null}

              <Input
                ref={titleInputRef}
                value={editorTitle}
                readOnly={isReadOnly}
                onChange={(event) => {
                  if (isReadOnly) {
                    return;
                  }
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
                  if (!isReadOnly) {
                    editor?.commands.focus("end");
                  }
                }}
                placeholder={isReadOnly ? "Public note" : "Untitled note"}
                className={
                  isCompact
                    ? `mt-2 h-auto border-0 bg-transparent px-0 py-0 text-[34px] font-semibold leading-[1.05] text-white shadow-none focus:border-0 ${isReadOnly ? "pointer-events-none" : ""}`
                    : `h-16 rounded-[28px] border-white/10 bg-white/[0.04] text-3xl font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] ${isReadOnly ? "pointer-events-none" : ""}`
                }
              />

              {!isCompact && !isReadOnly ? editorToolbar : null}

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
                <EditorContent editor={editor} />
              </div>

              {!isReadOnly ? capturePanel : null}

              {!isReadOnly ? clusterPanel : null}

              {!isReadOnly ? promptsPanel : null}

              {semanticPanel}

              {!isReadOnly ? actionsPanel : null}

              {!isReadOnly ? schedulePanel : null}

              <div className={isCompact ? `${isKeyboardOpen ? "mt-5 opacity-0 pointer-events-none h-0 overflow-hidden" : "mt-8 space-y-3"}` : "mt-6 rounded-[28px] border border-white/10 bg-black/20 p-4"}>
                <p className={isCompact ? "text-[11px] uppercase tracking-[0.28em] text-white/38" : "text-xs uppercase tracking-[0.22em] text-slate-500"}>Backlinks</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {backlinks.length ? (
                    backlinks.map((note) => (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => {
                          openNoteInCurrentMode(note.id);
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

              {!isReadOnly ? upcomingPanel : null}

              {memoryPanel}

              {!isReadOnly ? historyPanel : null}

              {recentTrailPanel}
            </div>

            {isCompact && !isReadOnly ? (
              <div
                className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+18px)]"
                style={{ bottom: keyboardInset > 0 ? `${Math.max(12, keyboardInset - 8)}px` : "0px" }}
              >
                <div className="space-y-2">
                  <div className="pointer-events-auto mx-auto flex w-full max-w-[420px] items-center justify-between rounded-[22px] border border-white/10 bg-[rgba(12,16,24,0.92)] px-3.5 py-2 text-[11px] uppercase tracking-[0.22em] text-white/55 shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
                    <button type="button" onClick={() => handleMobileGesture("capture")} className="rounded-full px-2 py-1 text-left transition hover:text-white">Up: Capture</button>
                    <button type="button" onClick={() => handleMobileGesture("schedule")} className="rounded-full px-2 py-1 text-left transition hover:text-white">Left: Schedule</button>
                    <button type="button" onClick={() => handleMobileGesture("related")} className="rounded-full px-2 py-1 text-left transition hover:text-white">Right: Related</button>
                    <button type="button" onClick={() => handleMobileGesture("memory")} className="rounded-full px-2 py-1 text-left transition hover:text-white">Down: Memory</button>
                  </div>
                  {editorToolbar}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
            <p className="text-lg font-semibold text-white">{workspaceMode === "public" ? "No public note selected" : "No note selected"}</p>
            {workspaceMode === "private" ? (
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
            ) : (
              <p className="max-w-sm text-sm text-slate-400">Explore the public topic vault here. Your personal notes stay in your app.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
