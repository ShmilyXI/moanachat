export type StudioAssetRecord = {
  id: string;
  kind: "audio" | "image" | "project" | "video";
  status: "completed" | "failed" | "processing" | "queued";
  outputUrl?: string | null;
  error?: string | null;
  title?: string;
  prompt?: string | null;
  model?: string | null;
  providerJobId?: string | null;
};

export function isStudioAssetPending(asset: StudioAssetRecord): boolean {
  return asset.status === "queued" || asset.status === "processing";
}

export function isStudioAssetReady(asset: StudioAssetRecord): boolean {
  return asset.status === "completed" && Boolean(asset.outputUrl);
}

export async function fetchStudioAssets(): Promise<StudioAssetRecord[]> {
  const response = await fetch("/api/media");
  if (!response.ok) {
    throw new Error("Unable to load media library");
  }
  return (await response.json()) as StudioAssetRecord[];
}

export async function createStudioAsset(input: {
  aspectRatio?: string;
  duration?: string;
  kind: "audio" | "image" | "video";
  model?: string;
  prompt: string;
  resolution?: string;
  sourceUrl?: string;
  title?: string;
  voice?: string;
}): Promise<StudioAssetRecord> {
  const response = await fetch("/api/media", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = (await response.json()) as
    | StudioAssetRecord
    | { error?: string };
  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Media generation failed"
    );
  }
  return payload as StudioAssetRecord;
}

export async function refreshStudioAsset(
  id: string
): Promise<StudioAssetRecord> {
  const response = await fetch(`/api/media?id=${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error("Unable to refresh media asset");
  }
  return (await response.json()) as StudioAssetRecord;
}

export async function publishStudioAsset({
  assetId,
  title,
}: {
  assetId: string;
  title: string;
}) {
  const response = await fetch("/api/feed", {
    body: JSON.stringify({ assetId, title }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error || "Unable to publish to Feed");
  }
  return response.json();
}

export async function deleteStudioAsset(id: string): Promise<void> {
  const response = await fetch(`/api/media?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Unable to delete media asset");
  }
}
