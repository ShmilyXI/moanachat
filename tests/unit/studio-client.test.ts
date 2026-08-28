import assert from "node:assert/strict";
import test from "node:test";
import {
  isStudioAssetPending,
  isStudioAssetReady,
  type StudioAssetRecord,
} from "@/lib/ai/studio-client";

const asset = (status: StudioAssetRecord["status"], outputUrl?: string) => ({
  id: "asset-1",
  kind: "image" as const,
  outputUrl,
  status,
});

test("recognizes queued and processing studio assets as pending", () => {
  assert.equal(isStudioAssetPending(asset("queued")), true);
  assert.equal(isStudioAssetPending(asset("processing")), true);
  assert.equal(isStudioAssetPending(asset("completed")), false);
});

test("only completed assets with an output can be published", () => {
  assert.equal(
    isStudioAssetReady(asset("completed", "https://cdn.test/a")),
    true
  );
  assert.equal(isStudioAssetReady(asset("completed")), false);
  assert.equal(
    isStudioAssetReady(asset("failed", "https://cdn.test/a")),
    false
  );
});
