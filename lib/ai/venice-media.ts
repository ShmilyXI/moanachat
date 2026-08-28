import type { NewApiConfig } from "./newapi";

export type MediaKind = "audio" | "image" | "video";

export type MediaRequestInput = {
  aspectRatio?: string;
  duration?: string;
  kind: MediaKind;
  model?: string;
  prompt: string;
  resolution?: string;
  sourceUrl?: string;
  voice?: string;
};

export type MediaRequest = {
  endpoint: string;
  payload: Record<string, unknown>;
};

export type MediaResult = {
  error?: string;
  outputUrl?: string;
  providerJobId?: string;
  providerModel?: string;
  status: "completed" | "failed" | "processing" | "queued";
};

const DEFAULT_MODELS: Record<MediaKind, string> = {
  audio: "tts-kokoro",
  image: "grok-imagine-image",
  video: "seedance-2-0-text-to-video-basic",
};

export function getDefaultMediaModel(kind: MediaKind): string {
  return DEFAULT_MODELS[kind];
}

export function resolveMediaModel(input: MediaRequestInput): string {
  return input.model?.trim() || getDefaultMediaModel(input.kind);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function imageDataUrl(value: string): string {
  return value.startsWith("data:") || /^https?:\/\//.test(value)
    ? value
    : `data:image/png;base64,${value}`;
}

function statusFromProvider(value: unknown): MediaResult["status"] {
  const status = asString(value)?.toUpperCase();
  if (status?.includes("FAIL") || status === "ERROR") {
    return "failed";
  }
  if (status?.includes("COMPLETE") || status === "SUCCEEDED") {
    return "completed";
  }
  if (status?.includes("PROCESS")) {
    return "processing";
  }
  return "queued";
}

export function buildMediaRequest(input: MediaRequestInput): MediaRequest {
  const model = resolveMediaModel(input);

  if (input.kind === "image") {
    return {
      endpoint: "/v1/image/generate",
      payload: {
        ...(input.aspectRatio ? { aspect_ratio: input.aspectRatio } : {}),
        format: "png",
        ...(input.sourceUrl ? { image_url: input.sourceUrl } : {}),
        ...(input.resolution ? { resolution: input.resolution } : {}),
        model,
        prompt: input.prompt.trim(),
        return_binary: false,
        variants: 1,
      },
    };
  }

  if (input.kind === "audio") {
    return {
      endpoint: "/v1/audio/speech",
      payload: {
        input: input.prompt.trim(),
        model,
        response_format: "mp3",
        speed: 1,
        streaming: false,
        ...(input.voice ? { voice: input.voice } : {}),
      },
    };
  }

  return {
    endpoint: "/v1/video/queue",
    payload: {
      aspect_ratio: input.aspectRatio || "16:9",
      audio: true,
      duration: input.duration || "10s",
      model,
      ...(input.sourceUrl ? { image_url: input.sourceUrl } : {}),
      output_format: "mp4",
      prompt: input.prompt.trim(),
      resolution: "720p",
    },
  };
}

export function parseMediaResponse(
  kind: MediaKind,
  payload: unknown
): MediaResult {
  const record = asRecord(payload);
  if (!record) {
    throw new Error("Invalid media response");
  }

  if (kind === "image") {
    const images = Array.isArray(record.images) ? record.images : [];
    const data = Array.isArray(record.data) ? record.data : [];
    const firstImage = asString(images[0]);
    const firstData = asRecord(data[0]);
    const output =
      firstImage || asString(firstData?.url) || asString(firstData?.b64_json);
    if (!output) {
      throw new Error("Invalid media response: image output missing");
    }
    return { outputUrl: imageDataUrl(output), status: "completed" };
  }

  const providerJobId = asString(record.queue_id);
  const providerModel = asString(record.model);
  const outputUrl =
    asString(record.download_url) ||
    asString(record.url) ||
    asString(record.audio_url) ||
    asString(record.video_url);
  const error = asString(record.error);
  if (!providerJobId && !outputUrl && !error) {
    throw new Error("Invalid media response: queue or output missing");
  }

  return {
    ...(error ? { error } : {}),
    ...(outputUrl ? { outputUrl } : {}),
    ...(providerJobId ? { providerJobId } : {}),
    ...(providerModel ? { providerModel } : {}),
    status: error
      ? "failed"
      : outputUrl
        ? "completed"
        : statusFromProvider(record.status),
  };
}

function getMediaUrl(config: NewApiConfig, endpoint: string): string {
  return `${config.baseUrl?.replace(/\/+$/, "") ?? ""}${endpoint}`;
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = asRecord(await response.json());
    const nested = asRecord(payload?.error);
    return (
      asString(nested?.message) ||
      asString(payload?.message) ||
      `Media provider returned ${response.status}`
    );
  } catch {
    return `Media provider returned ${response.status}`;
  }
}

export async function requestMedia(
  config: NewApiConfig,
  input: MediaRequestInput
): Promise<MediaResult> {
  if (!config.baseUrl || !config.apiKey) {
    throw new Error("Media provider is not configured");
  }

  const request = buildMediaRequest(input);
  const response = await fetch(getMediaUrl(config, request.endpoint), {
    body: JSON.stringify(request.payload),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (input.kind === "audio" && !contentType.includes("json")) {
    const bytes = Buffer.from(await response.arrayBuffer()).toString("base64");
    return {
      outputUrl: `data:${contentType || "audio/mpeg"};base64,${bytes}`,
      status: "completed",
    };
  }

  return parseMediaResponse(input.kind, await response.json());
}

export async function retrieveMedia(
  config: NewApiConfig,
  input: {
    kind: Exclude<MediaKind, "image">;
    model: string;
    providerJobId: string;
  }
): Promise<MediaResult> {
  if (!config.baseUrl || !config.apiKey) {
    throw new Error("Media provider is not configured");
  }

  const endpoint =
    input.kind === "audio" ? "/v1/audio/retrieve" : "/v1/video/retrieve";
  const response = await fetch(getMediaUrl(config, endpoint), {
    body: JSON.stringify({
      delete_media_on_completion: false,
      model: input.model,
      queue_id: input.providerJobId,
    }),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("json")) {
    const bytes = Buffer.from(await response.arrayBuffer()).toString("base64");
    return {
      outputUrl: `data:${contentType || (input.kind === "audio" ? "audio/mpeg" : "video/mp4")};base64,${bytes}`,
      providerJobId: input.providerJobId,
      providerModel: input.model,
      status: "completed",
    };
  }

  return parseMediaResponse(input.kind, await response.json());
}
