import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  type RuntimeConfig,
  serializeRuntimeConfigStatus,
} from "@/lib/ai/runtime-config";
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

test("serializes saved model preferences without credential material", () => {
  const status = serializeRuntimeConfigStatus({
    apiKey: "account-secret",
    baseUrl: "https://newapi.example.com",
    defaultModelId: "openai/gpt-4.1",
    enabledModelIds: ["openai/gpt-4.1", "deepseek/deepseek-v3"],
    mode: "embedded",
  } satisfies RuntimeConfig);

  assert.deepEqual(status, {
    baseUrl: "https://newapi.example.com",
    configured: true,
    defaultModelId: "openai/gpt-4.1",
    enabledModelIds: ["openai/gpt-4.1", "deepseek/deepseek-v3"],
    mode: "embedded",
  });
  assert.equal("apiKey" in status, false);
  assert.equal(JSON.stringify(status).includes("account-secret"), false);
});
