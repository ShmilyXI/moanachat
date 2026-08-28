import { NextResponse } from "next/server";
import { getPublicCharacters } from "@/lib/db/queries";

export async function GET() {
  return NextResponse.json(await getPublicCharacters());
}
