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
    isPinned?: boolean;
    status?: "draft" | "active" | "archived";
    graphPosition?: { x: number; y: number };
  };

  const vault = await createVaultNote(body);
  return NextResponse.json(vault, { status: 201 });
}
