import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  fetchNewApiModels,
  getNewApiModelIds,
  normalizeNewApiModels,
} from "@/lib/ai/newapi";

const config = {
  apiKey: "sk-test",
  baseUrl: "https://newapi.example.com",
  mode: "embedded" as const,
};

test("normalizes OpenAI model records without changing slash-containing ids", () => {
  assert.deepEqual(
    normalizeNewApiModels({
      data: [
        { id: "openai/gpt-4.1", name: "GPT 4.1" },
        { id: "custom-model", name: "" },
      ],
    }),
    [
      {
        description: "",
        id: "openai/gpt-4.1",
        name: "GPT 4.1",
        provider: "openai",
      },
      {
        description: "",
        id: "custom-model",
        name: "custom-model",
        provider: "custom-model",
      },
    ]
  );
});

test("uses id for missing names and ignores malformed records", () => {
  assert.deepEqual(
    normalizeNewApiModels({
      data: [
        { id: "anthropic/claude-3" },
        { name: "missing id" },
        null,
        "not-a-record",
      ],
    }),
    [
      {
        description: "",
        id: "anthropic/claude-3",
        name: "anthropic/claude-3",
        provider: "anthropic",
      },
    ]
  );
});

test("returns no models for malformed or missing data", () => {
  assert.deepEqual(normalizeNewApiModels(undefined), []);
  assert.deepEqual(normalizeNewApiModels({}), []);
  assert.deepEqual(normalizeNewApiModels({ data: {} }), []);
});

test("fetches models from the configured New API endpoint with a bearer token", async () => {
  const originalFetch = globalThis.fetch;
  let request: Request | undefined;
  globalThis.fetch = async (input, init) => {
    request = new Request(input, init);
    return Response.json({ data: [{ id: "openai/gpt-4.1" }] });
  };

  try {
    assert.deepEqual(await fetchNewApiModels(config), [
      {
        description: "",
        id: "openai/gpt-4.1",
        name: "openai/gpt-4.1",
        provider: "openai",
      },
    ]);
    assert.equal(request?.url, "https://newapi.example.com/v1/models");
    assert.equal(request?.headers.get("authorization"), "Bearer sk-test");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("returns an empty model list when New API responds unsuccessfully", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 401 });

  try {
    assert.deepEqual(await fetchNewApiModels(config), []);
    assert.deepEqual(await getNewApiModelIds(config), new Set());
  } finally {
    globalThis.fetch = originalFetch;
  }
});
