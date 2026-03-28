import { NextResponse } from "next/server";
import { createVaultNote, readVault } from "@/lib/vault/storage";

export async function GET() {
  const vault = await readVault();
  return NextResponse.json(vault);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    title?: string;
    content?: string;
    folder?: string;
    tags?: string[];
    clusterMode?: "ideas" | "projects" | "people" | "research";
    visibility?: "private" | "public";
    publicTopics?: string[];
    isPinned?: boolean;
    status?: "draft" | "active" | "archived";
    schedule?: { date: string; time?: string; done?: boolean; reminderMinutes?: number };
    snapshots?: Array<{ id: string; title: string; content: string; createdAt: string }>;
    graphPosition?: { x: number; y: number; z?: number };
  };

  const vault = await createVaultNote(body);
  return NextResponse.json(vault, { status: 201 });
}
