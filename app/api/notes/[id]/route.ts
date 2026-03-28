import { NextResponse } from "next/server";
import { deleteVaultNote, readVault, updateVaultNote } from "@/lib/vault/storage";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    content?: string;
    folder?: string;
    tags?: string[];
    clusterMode?: "ideas" | "projects" | "people" | "research";
    isPinned?: boolean;
    status?: "draft" | "active" | "archived";
    schedule?: { date: string; time?: string; done?: boolean; reminderMinutes?: number };
    snapshots?: Array<{ id: string; title: string; content: string; createdAt: string }>;
    graphPosition?: { x: number; y: number; z?: number };
  };

  const vault = await updateVaultNote(id, body);
  return NextResponse.json(vault);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const vault = await deleteVaultNote(id);
  return NextResponse.json(vault);
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const vault = await readVault();
  const note = vault.notes.find((entry) => entry.id === id);

  if (!note) {
    return NextResponse.json({ message: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(note);
}
