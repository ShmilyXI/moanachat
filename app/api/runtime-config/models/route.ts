import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getCapabilitiesForModels } from "@/lib/ai/models";
import { fetchNewApiModels } from "@/lib/ai/newapi";
import {
  normalizeRuntimeModelPreferences,
  parseEmbeddedRuntimeConfig,
} from "@/lib/ai/runtime-config";
import { decryptRuntimeApiKey } from "@/lib/ai/runtime-config-crypto";
import {
  getUserRuntimeConfigByUserId,
  updateUserRuntimeModelPreferences,
} from "@/lib/db/queries";

function unauthorizedResponse() {
  return Response.json({ error: "Sign-in required" }, { status: 401 });
}

async function getSignedInUserId() {
  const session = await auth();
  return session?.user?.type === "regular" && session.user.id
    ? session.user.id
    : null;
}

function readObjectPayload(payload: unknown): Record<string, unknown> {
  return typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : {};
}

async function getStoredRuntimeConfig(userId: string) {
  const stored = await getUserRuntimeConfigByUserId({ userId });
  if (!stored) {
    return null;
  }

  return parseEmbeddedRuntimeConfig({
    apiKey: decryptRuntimeApiKey({
      authTag: stored.authTag,
      ciphertext: stored.encryptedApiKey,
      iv: stored.iv,
    }),
    baseUrl: stored.baseUrl,
  });
}

export async function POST(request: Request) {
  const userId = await getSignedInUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const payload = readObjectPayload(await request.json());
    const suppliedApiKey =
      typeof payload.apiKey === "string" ? payload.apiKey.trim() : "";
    const config = suppliedApiKey
      ? parseEmbeddedRuntimeConfig(payload)
      : await getStoredRuntimeConfig(userId);

    if (!config) {
      return Response.json(
        { error: "Runtime configuration is not configured" },
        { status: 400 }
      );
    }

    const models = await fetchNewApiModels(config);
    if (models.length === 0) {
      return Response.json(
        {
          code: "new_api_models_unavailable",
          error: "new_api_models_unavailable",
        },
        { status: 502 }
      );
    }

    return Response.json({
      capabilities: getCapabilitiesForModels(models),
      mode: "embedded",
      models,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to discover New API models",
      },
      { status: 400 }
    );
  }
}

const preferencesSchema = z.object({
  defaultModelId: z.string().min(1),
  enabledModelIds: z.array(z.string().min(1)),
});

export async function PUT(request: Request) {
  const userId = await getSignedInUserId();
  if (!userId) {
    return unauthorizedResponse();
  }

  try {
    const parsed = preferencesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid model preferences" },
        { status: 400 }
      );
    }

    const preferences = normalizeRuntimeModelPreferences(parsed.data);
    if (!preferences) {
      return Response.json(
        { error: "Invalid model preferences" },
        { status: 400 }
      );
    }

    const config = await getStoredRuntimeConfig(userId);
    if (!config) {
      return Response.json(
        { error: "Runtime configuration is not configured" },
        { status: 400 }
      );
    }

    const models = await fetchNewApiModels(config);
    if (models.length === 0) {
      return Response.json(
        {
          code: "new_api_models_unavailable",
          error: "new_api_models_unavailable",
        },
        { status: 502 }
      );
    }

    const availableModelIds = new Set(models.map((model) => model.id));
    const unavailableModelId = preferences.enabledModelIds.find(
      (modelId) => !availableModelIds.has(modelId)
    );
    if (unavailableModelId) {
      return Response.json(
        { error: `Model is not available: ${unavailableModelId}` },
        { status: 400 }
      );
    }

    const saved = await updateUserRuntimeModelPreferences({
      defaultModelId: preferences.defaultModelId,
      enabledModelIds: preferences.enabledModelIds,
      userId,
    });
    if (!saved) {
      return Response.json(
        { error: "Runtime configuration is not configured" },
        { status: 400 }
      );
    }

    return Response.json({ success: true, ...preferences });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid model preferences",
      },
      { status: 400 }
    );
  }
}
