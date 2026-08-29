import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import { serializeRuntimeConfigStatus } from "@/lib/ai/runtime-config";
import { getMessageByErrorCode } from "@/lib/errors";

test("serializes runtime status without credential material", () => {
  const status = serializeRuntimeConfigStatus({
    apiKey: "account-secret",
    baseUrl: "https://newapi.example.com",
    mode: "embedded",
  });

  assert.deepEqual(status, {
    baseUrl: "https://newapi.example.com",
    configured: true,
    mode: "embedded",
  });
  assert.equal("apiKey" in status, false);
  assert.equal(JSON.stringify(status).includes("account-secret"), false);
});

test("describes missing provider configuration", () => {
  const message = getMessageByErrorCode("not_configured:chat");

  assert.match(message, /API|provider|dashboard/i);
});
