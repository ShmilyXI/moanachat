import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  filterRuntimeModels,
  getRuntimeDefaultModel,
} from "@/lib/ai/newapi";
import type { ChatModel } from "@/lib/ai/models";

const discoveredModels: ChatModel[] = [
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

test("filters discovered models to the saved enabled IDs", () => {
  const result = filterRuntimeModels(discoveredModels, [
    "openai/gpt-4.1",
    "removed/model",
  ]);

  assert.deepEqual(
    result.map((model) => model.id),
    ["openai/gpt-4.1"]
  );
});

test("uses the saved default when it is still available", () => {
  assert.equal(
    getRuntimeDefaultModel(discoveredModels, "anthropic/claude-3.7"),
    "anthropic/claude-3.7"
  );
});

test("falls back to the first available model when the saved default is gone", () => {
  assert.equal(
    getRuntimeDefaultModel(discoveredModels, "removed/model"),
    "openai/gpt-4.1"
  );
});

test("treats undefined preferences as legacy all-enabled behavior", () => {
  assert.deepEqual(filterRuntimeModels(discoveredModels, undefined), discoveredModels);
});
