import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  normalizeRuntimeModelPreferences,
  parseEmbeddedRuntimeConfig,
  resolveRuntimeConfig,
  resolveRuntimeConfigSources,
} from "@/lib/ai/runtime-config";

test("keeps a valid enabled set and default model", () => {
  assert.deepEqual(
    normalizeRuntimeModelPreferences({
      defaultModelId: "openai/gpt-4.1",
      enabledModelIds: ["openai/gpt-4.1", "deepseek/deepseek-v3"],
    }),
    {
      defaultModelId: "openai/gpt-4.1",
      enabledModelIds: ["openai/gpt-4.1", "deepseek/deepseek-v3"],
    }
  );
});

test("trims model IDs and removes duplicates", () => {
  assert.deepEqual(
    normalizeRuntimeModelPreferences({
      defaultModelId: " openai/gpt-4.1 ",
      enabledModelIds: [
        " openai/gpt-4.1 ",
        "deepseek/deepseek-v3",
        "deepseek/deepseek-v3",
      ],
    }),
    {
      defaultModelId: "openai/gpt-4.1",
      enabledModelIds: ["openai/gpt-4.1", "deepseek/deepseek-v3"],
    }
  );
});

test("rejects an empty set and a default outside the set", () => {
  assert.throws(
    () =>
      normalizeRuntimeModelPreferences({
        defaultModelId: "missing",
        enabledModelIds: [],
      }),
    /at least one|default/i
  );

  assert.throws(
    () =>
      normalizeRuntimeModelPreferences({
        defaultModelId: "missing",
        enabledModelIds: ["openai/gpt-4.1"],
      }),
    /default/i
  );
});

test("parses baseUrl and apiKey query parameters", () => {
  assert.deepEqual(
    parseEmbeddedRuntimeConfig(
      new URLSearchParams({
        apiKey: "sk-test",
        baseUrl: "https://newapi.example.com",
      })
    ),
    {
      apiKey: "sk-test",
      baseUrl: "https://newapi.example.com",
      mode: "embedded",
    }
  );
});

test("accepts apiBase and removes one trailing /v1", () => {
  assert.deepEqual(
    parseEmbeddedRuntimeConfig({
      apiBase: "https://newapi.example.com/v1/",
      apiKey: "sk-test",
    }),
    {
      apiKey: "sk-test",
      baseUrl: "https://newapi.example.com",
      mode: "embedded",
    }
  );
});

test("accepts only http and https base URLs", () => {
  assert.throws(
    () =>
      parseEmbeddedRuntimeConfig({
        apiKey: "sk-test",
        baseUrl: "ftp://newapi.example.com",
      }),
    /http/i
  );
});

test("rejects URLs containing credentials", () => {
  assert.throws(
    () =>
      parseEmbeddedRuntimeConfig({
        apiKey: "sk-test",
        baseUrl: "https://user:password@newapi.example.com",
      }),
    /credential/i
  );
});

test("rejects empty and oversized values", () => {
  assert.throws(
    () =>
      parseEmbeddedRuntimeConfig({
        apiKey: "",
        baseUrl: "https://example.com",
      }),
    /key/i
  );
  assert.throws(
    () =>
      parseEmbeddedRuntimeConfig({
        apiKey: "sk-test",
        baseUrl: `https://example.com/${"a".repeat(2048)}`,
      }),
    /2048|long/i
  );
  assert.throws(
    () =>
      parseEmbeddedRuntimeConfig({
        apiKey: `sk-${"a".repeat(2048)}`,
        baseUrl: "https://example.com",
      }),
    /2048|long/i
  );
});

test("falls back to the gateway key when no embedded cookie exists", () => {
  assert.deepEqual(resolveRuntimeConfig(undefined, "gateway-test"), {
    apiKey: "gateway-test",
    mode: "gateway",
  });
});

test("falls back to the gateway key when the embedded cookie is invalid", () => {
  assert.deepEqual(resolveRuntimeConfig("not-json", "gateway-test"), {
    apiKey: "gateway-test",
    mode: "gateway",
  });
});

test("prefers the authenticated account configuration", () => {
  assert.deepEqual(
    resolveRuntimeConfigSources({
      account: { apiKey: "account-key", baseUrl: "https://account.example" },
      cookie: { apiKey: "cookie-key", baseUrl: "https://cookie.example" },
      gatewayApiKey: "gateway-key",
    }),
    {
      apiKey: "account-key",
      baseUrl: "https://account.example",
      mode: "embedded",
    }
  );
});

test("falls back to the embedded cookie when account configuration is invalid", () => {
  assert.deepEqual(
    resolveRuntimeConfigSources({
      account: { apiKey: "", baseUrl: "" },
      cookie: { apiKey: "cookie-key", baseUrl: "https://cookie.example" },
      gatewayApiKey: "gateway-key",
    }),
    {
      apiKey: "cookie-key",
      baseUrl: "https://cookie.example",
      mode: "embedded",
    }
  );
});

test("falls back to the gateway key when account and cookie are missing", () => {
  assert.deepEqual(
    resolveRuntimeConfigSources({ gatewayApiKey: "gateway-key" }),
    { apiKey: "gateway-key", mode: "gateway" }
  );
});
