import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import {
  createCharacter,
  deleteCharacter,
  getCharacterById,
  getCharactersByUserId,
  updateCharacter,
} from "@/lib/db/queries";

const characterSchema = z.object({
  description: z.string().max(500).optional(),
  name: z.string().trim().min(1).max(80),
  prompt: z.string().trim().min(1).max(10_000),
  visibility: z.enum(["private", "public"]).optional(),
});

async function sessionId() {
  return (await auth())?.user?.id ?? null;
}

export async function GET() {
  const userId = await sessionId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getCharactersByUserId({ userId }));
}

export async function POST(request: Request) {
  const userId = await sessionId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = characterSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid character" }, { status: 400 });
  }
  const character = await createCharacter({ ...parsed.data, userId });
  return NextResponse.json(character, { status: 201 });
}

export async function PATCH(request: Request) {
  const userId = await sessionId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const parsed = characterSchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid character" }, { status: 400 });
  }
  const character = await updateCharacter({ ...parsed.data, id, userId });
  return character
    ? NextResponse.json(character)
    : NextResponse.json({ error: "Character not found" }, { status: 404 });
}

export async function DELETE(request: Request) {
  const userId = await sessionId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const character = await getCharacterById({ id });
  if (!character || character.userId !== userId) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }
  await deleteCharacter({ id, userId });
  return NextResponse.json({ success: true });
}
