import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import { type ChatModel, getCapabilitiesForModels } from "@/lib/ai/models";
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

test("preserves Moana model metadata and capability flags", () => {
  assert.deepEqual(
    normalizeNewApiModels({
      data: [
        {
          id: "zai-org-glm-5-1",
          model_spec: {
            availableContextTokens: 131_072,
            capabilities: {
              supportsAudioInput: true,
              supportsFunctionCalling: true,
              supportsReasoning: true,
              supportsVideoInput: false,
              supportsVision: true,
              supportsWebSearch: true,
            },
            description: "Long-context model",
            pricing: { input: 0.15, output: 0.6 },
            privacy: "private",
            traits: ["fastest", "reasoning"],
          },
          name: "GLM 5.1",
          type: "text",
        },
      ],
    }),
    [
      {
        capabilities: {
          audioInput: true,
          capabilitiesKnown: true,
          reasoning: true,
          tools: true,
          videoInput: false,
          vision: true,
          webSearch: true,
        },
        contextLength: 131_072,
        description: "Long-context model",
        id: "zai-org-glm-5-1",
        name: "GLM 5.1",
        pricing: { input: 0.15, output: 0.6 },
        privacy: "private",
        provider: "zai-org-glm-5-1",
        tags: ["fastest", "reasoning"],
        type: "text",
      },
    ]
  );
});

test("detects vision support from top-level input modalities", () => {
  const [model] = normalizeNewApiModels({
    data: [
      {
        architecture: { input_modalities: ["text", "image"] },
        id: "gpt-vision",
      },
    ],
  });

  assert.deepEqual(model?.capabilities, {
    audioInput: false,
    capabilitiesKnown: true,
    reasoning: false,
    tools: false,
    videoInput: false,
    vision: true,
    webSearch: false,
  });
});

test("marks missing model capability metadata as unknown", () => {
  const [model] = normalizeNewApiModels({ data: [{ id: "unknown-model" }] });
  assert.equal(model?.capabilities, undefined);

  assert.deepEqual(
    getCapabilitiesForModels([model as ChatModel])["unknown-model"],
    {
      capabilitiesKnown: false,
      reasoning: false,
      tools: false,
      vision: false,
    }
  );
});

test("fetches models from the configured New API endpoint with a bearer token", async () => {
  const originalFetch = globalThis.fetch;
  let request: Request | undefined;
  globalThis.fetch = (input, init) => {
    request = new Request(input, init);
    return Promise.resolve(Response.json({ data: [{ id: "openai/gpt-4.1" }] }));
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
