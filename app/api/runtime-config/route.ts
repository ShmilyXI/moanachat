import { NextResponse } from "next/server";
import {
  encodeRuntimeConfig,
  parseEmbeddedRuntimeConfig,
  RUNTIME_CONFIG_COOKIE,
  RUNTIME_CONFIG_MAX_AGE,
} from "@/lib/ai/runtime-config";
import { isProductionEnvironment } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const config = parseEmbeddedRuntimeConfig(payload);
    const response = NextResponse.json({ mode: "embedded", success: true });

    response.cookies.set(RUNTIME_CONFIG_COOKIE, encodeRuntimeConfig(config), {
      httpOnly: true,
      maxAge: RUNTIME_CONFIG_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: isProductionEnvironment,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid runtime configuration" },
      { status: 400 }
    );
  }
}

export function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(RUNTIME_CONFIG_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: isProductionEnvironment,
  });
  return response;
}
