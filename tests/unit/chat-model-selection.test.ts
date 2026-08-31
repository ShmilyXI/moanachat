import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import { getChatModelProviderOptions, selectChatModel } from "@/lib/ai/models";

const embeddedModels = [
  {
    description: "",
    id: "openai/gpt-4.1",
    name: "GPT 4.1",
    provider: "openai",
  },
  {
    description: "",
    id: "anthropic/claude-3.7",
    name: "Claude 3.7",
    provider: "anthropic",
  },
];

test("keeps an embedded model when it is in the discovered list", () => {
  assert.equal(
    selectChatModel({
      availableModels: embeddedModels,
      mode: "embedded",
      requestedModelId: "anthropic/claude-3.7",
      staticDefaultModelId: "moonshotai/kimi-k2.5",
    }),
    "anthropic/claude-3.7"
  );
});

test("falls back to the first discovered embedded model", () => {
  assert.equal(
    selectChatModel({
      availableModels: embeddedModels,
      mode: "embedded",
      requestedModelId: "missing-model",
      staticDefaultModelId: "moonshotai/kimi-k2.5",
    }),
    "openai/gpt-4.1"
  );
});

test("prefers the saved default when it is in the discovered list", () => {
  assert.equal(
    selectChatModel({
      availableModels: embeddedModels,
      mode: "embedded",
      requestedModelId: "missing-model",
      staticDefaultModelId: "anthropic/claude-3.7",
    }),
    "anthropic/claude-3.7"
  );
});

test("keeps the static default when no embedded model is available", () => {
  assert.equal(
    selectChatModel({
      availableModels: [],
      mode: "embedded",
      requestedModelId: "missing-model",
      staticDefaultModelId: "moonshotai/kimi-k2.5",
    }),
    "moonshotai/kimi-k2.5"
  );
});

test("validates standalone requests against the curated model list", () => {
  assert.equal(
    selectChatModel({
      mode: "gateway",
      requestedModelId: "deepseek/deepseek-v3.2",
      staticDefaultModelId: "moonshotai/kimi-k2.5",
    }),
    "deepseek/deepseek-v3.2"
  );
  assert.equal(
    selectChatModel({
      mode: "gateway",
      requestedModelId: "missing-model",
      staticDefaultModelId: "moonshotai/kimi-k2.5",
    }),
    "moonshotai/kimi-k2.5"
  );
});

test("uses the same gateway and reasoning provider options for every chat surface", () => {
  assert.deepEqual(getChatModelProviderOptions("deepseek/deepseek-v3.2"), {
    gateway: { order: ["bedrock", "deepinfra"] },
  });
  assert.deepEqual(getChatModelProviderOptions("openai/gpt-oss-20b"), {
    gateway: { order: ["groq", "bedrock"] },
    openai: { reasoningEffort: "low" },
  });
  assert.deepEqual(getChatModelProviderOptions("custom/model"), {});
});
