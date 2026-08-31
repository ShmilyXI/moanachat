import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMediaRequest,
  type MediaKind,
  parseMediaResponse,
} from "@/lib/ai/venice-media";

test("builds Moana image generation requests", () => {
  assert.deepEqual(
    buildMediaRequest({
      aspectRatio: "16:9",
      kind: "image",
      model: "grok-imagine-image",
      prompt: "A quiet canal at sunset",
      resolution: "1K",
    }),
    {
      endpoint: "/v1/image/generate",
      payload: {
        aspect_ratio: "16:9",
        format: "png",
        model: "grok-imagine-image",
        prompt: "A quiet canal at sunset",
        resolution: "1K",
        return_binary: false,
        variants: 1,
      },
    }
  );
});

test("includes a source image when editing an existing asset", () => {
  assert.equal(
    buildMediaRequest({
      kind: "image",
      prompt: "Enhance this image",
      sourceUrl: "data:image/png;base64,abc",
    }).payload.image_url,
    "data:image/png;base64,abc"
  );
});

test("builds queued audio and video requests", () => {
  assert.equal(
    buildMediaRequest({
      kind: "audio",
      model: "tts-kokoro",
      prompt: "A warm welcome",
      voice: "af_sky",
    }).endpoint,
    "/v1/audio/speech"
  );
  assert.equal(
    buildMediaRequest({
      duration: "10s",
      kind: "video",
      model: "seedance-2-0-text-to-video-basic",
      prompt: "A cinematic canal at sunset",
    }).endpoint,
    "/v1/video/queue"
  );
});

test("normalizes completed image and queued media responses", () => {
  assert.deepEqual(parseMediaResponse("image", { images: ["abc123"] }), {
    outputUrl: "data:image/png;base64,abc123",
    status: "completed",
  });
  assert.deepEqual(
    parseMediaResponse("audio", {
      model: "tts-kokoro",
      queue_id: "audio-1",
      status: "QUEUED",
    }),
    {
      providerJobId: "audio-1",
      providerModel: "tts-kokoro",
      status: "queued",
    }
  );
  assert.deepEqual(
    parseMediaResponse("video", {
      download_url: "https://cdn.example/video.mp4",
      model: "seedance",
      queue_id: "video-1",
      status: "COMPLETED",
    }),
    {
      outputUrl: "https://cdn.example/video.mp4",
      providerJobId: "video-1",
      providerModel: "seedance",
      status: "completed",
    }
  );
});

test("rejects unsupported media response shapes", () => {
  for (const kind of ["image", "audio", "video"] as MediaKind[]) {
    assert.throws(() => parseMediaResponse(kind, {}), /media response/i);
  }
});
