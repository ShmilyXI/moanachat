import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getRuntimeConfig } from "@/lib/ai/runtime-config";
import {
  type MediaKind,
  requestMedia,
  resolveMediaModel,
  retrieveMedia,
} from "@/lib/ai/venice-media";
import {
  createStudioAsset,
  deleteStudioAsset,
  getStudioAssetById,
  getStudioAssetsByUserId,
  updateStudioAsset,
} from "@/lib/db/queries";

const mediaRequestSchema = z.object({
  aspectRatio: z.string().max(20).optional(),
  duration: z.string().max(20).optional(),
  kind: z.enum(["audio", "image", "video"]),
  model: z.string().max(200).optional(),
  prompt: z.string().trim().min(1).max(20_000),
  resolution: z.string().max(20).optional(),
  sourceUrl: z.url().or(z.string().startsWith("data:")).optional(),
  title: z.string().trim().min(1).max(200).optional(),
  voice: z.string().max(100).optional(),
});

function mimeTypeForKind(kind: MediaKind): string {
  if (kind === "audio") {
    return "audio/mpeg";
  }
  if (kind === "video") {
    return "video/mp4";
  }
  return "image/png";
}

function dataUrlToBuffer(value: string): Buffer | null {
  const match = value.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) {
    return null;
  }
  return Buffer.from(match[2], "base64");
}

async function persistOutput({
  kind,
  outputUrl,
  userId,
  assetId,
}: {
  assetId: string;
  kind: MediaKind;
  outputUrl: string | undefined;
  userId: string;
}): Promise<string | undefined> {
  if (!outputUrl?.startsWith("data:")) {
    return outputUrl;
  }

  const buffer = dataUrlToBuffer(outputUrl);
  if (!buffer || !process.env.BLOB_READ_WRITE_TOKEN) {
    return outputUrl;
  }

  const extension = kind === "audio" ? "mp3" : kind === "video" ? "mp4" : "png";
  const blob = await put(`studio/${userId}/${assetId}.${extension}`, buffer, {
    access: "public",
    addRandomSuffix: false,
    contentType: mimeTypeForKind(kind),
  });
  return blob.url;
}

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (id) {
    const asset = await getStudioAssetById({ id, userId: session.user.id });
    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (
      asset.providerJobId &&
      asset.model &&
      (asset.kind === "audio" || asset.kind === "video") &&
      (asset.status === "queued" || asset.status === "processing")
    ) {
      try {
        const result = await retrieveMedia(await getRuntimeConfig(), {
          kind: asset.kind,
          model: asset.model,
          providerJobId: asset.providerJobId,
        });
        const outputUrl = await persistOutput({
          assetId: asset.id,
          kind: asset.kind,
          outputUrl: result.outputUrl,
          userId: session.user.id,
        });
        const updated = await updateStudioAsset({
          error: result.error ?? null,
          id: asset.id,
          model: result.providerModel ?? asset.model,
          outputUrl: outputUrl ?? null,
          providerJobId: result.providerJobId ?? asset.providerJobId,
          status: result.status,
          userId: session.user.id,
        });
        return NextResponse.json(updated ?? asset);
      } catch {
        return NextResponse.json(asset);
      }
    }

    return NextResponse.json(asset);
  }

  return NextResponse.json(
    await getStudioAssetsByUserId({ userId: session.user.id })
  );
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = mediaRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid media request" },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const model = resolveMediaModel(input);
  const runtimeConfig = await getRuntimeConfig();
  const asset = await createStudioAsset({
    kind: input.kind,
    model,
    prompt: input.prompt,
    status: input.kind === "video" ? "queued" : "processing",
    title: input.title ?? input.prompt.slice(0, 80),
    userId: session.user.id,
  });

  if (!asset) {
    return NextResponse.json(
      { error: "Asset could not be created" },
      { status: 500 }
    );
  }

  try {
    const result = await requestMedia(runtimeConfig, input);
    const outputUrl = await persistOutput({
      assetId: asset.id,
      kind: input.kind,
      outputUrl: result.outputUrl,
      userId: session.user.id,
    });
    const updated = await updateStudioAsset({
      error: result.error ?? null,
      id: asset.id,
      model: result.providerModel ?? model,
      outputUrl: outputUrl ?? null,
      providerJobId: result.providerJobId ?? null,
      status: result.status,
      userId: session.user.id,
    });
    return NextResponse.json(updated ?? asset);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Media generation failed";
    const updated = await updateStudioAsset({
      error: message,
      id: asset.id,
      status: "failed",
      userId: session.user.id,
    });
    return NextResponse.json(
      updated ?? { ...asset, error: message, status: "failed" },
      { status: 502 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await deleteStudioAsset({ id, userId: session.user.id });
  return NextResponse.json({ success: true });
}
