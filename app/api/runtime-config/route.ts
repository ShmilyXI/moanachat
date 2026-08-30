import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import {
  encodeRuntimeConfig,
  parseEmbeddedRuntimeConfig,
  RUNTIME_CONFIG_COOKIE,
  RUNTIME_CONFIG_MAX_AGE,
  serializeRuntimeConfigStatus,
} from "@/lib/ai/runtime-config";
import { encryptRuntimeApiKey } from "@/lib/ai/runtime-config-crypto";
import { isProductionEnvironment } from "@/lib/constants";
import {
  deleteUserRuntimeConfig,
  getUserRuntimeConfigByUserId,
  upsertUserRuntimeConfig,
} from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const config = parseEmbeddedRuntimeConfig(payload);
    if (!config.apiKey || !config.baseUrl) {
      throw new Error("Runtime configuration is incomplete");
    }
    const session = await auth();
    if (session?.user?.type === "regular" && session.user.id) {
      const encrypted = encryptRuntimeApiKey(config.apiKey);
      await upsertUserRuntimeConfig({
        authTag: encrypted.authTag,
        baseUrl: config.baseUrl,
        ciphertext: encrypted.ciphertext,
        iv: encrypted.iv,
        userId: session.user.id,
      });
      return NextResponse.json(serializeRuntimeConfigStatus(config));
    }

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

export async function GET() {
  const session = await auth();
  if (session?.user?.type !== "regular" || !session.user.id) {
    return NextResponse.json({ error: "Sign-in required" }, { status: 401 });
  }

  const stored = await getUserRuntimeConfigByUserId({
    userId: session.user.id,
  });
  if (!stored) {
    return NextResponse.json({ configured: false, mode: "gateway" });
  }

  try {
    const { decryptRuntimeApiKey } = await import(
      "@/lib/ai/runtime-config-crypto"
    );
    return NextResponse.json(
      serializeRuntimeConfigStatus({
        apiKey: decryptRuntimeApiKey({
          authTag: stored.authTag,
          ciphertext: stored.encryptedApiKey,
          iv: stored.iv,
        }),
        baseUrl: stored.baseUrl,
        defaultModelId: stored.defaultModelId ?? undefined,
        enabledModelIds: stored.enabledModelIds ?? undefined,
        mode: "embedded",
      })
    );
  } catch {
    return NextResponse.json({ configured: false, mode: "gateway" });
  }
}

export async function DELETE() {
  const session = await auth();
  if (session?.user?.type === "regular" && session.user.id) {
    await deleteUserRuntimeConfig({ userId: session.user.id });
  }

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
