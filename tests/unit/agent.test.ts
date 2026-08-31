import assert from "node:assert/strict";
import test from "node:test";
import { APICallError } from "ai";
import { agentRequestSchema, buildAgentInstructions } from "@/lib/ai/agent";
import { getAIProviderErrorMessage } from "@/lib/errors";

test("builds a focused agent instruction with tool and search behavior", () => {
  const instructions = buildAgentInstructions({
    requestHints: {
      city: "Shanghai",
      country: "CN",
      latitude: "31.2",
      longitude: "121.5",
    },
  });

  assert.match(instructions, /agent/i);
  assert.match(instructions, /tool/i);
  assert.match(instructions, /Shanghai/);
});

test("validates agent messages and rejects empty requests", () => {
  const parsed = agentRequestSchema.safeParse({
    messages: [
      {
        id: "m1",
        parts: [{ text: "Find a quiet cafe", type: "text" }],
        role: "user",
      },
    ],
    selectedChatModel: "openai/gpt-4.1",
  });

  assert.equal(parsed.success, true);
  assert.equal(agentRequestSchema.safeParse({ messages: [] }).success, false);
});

test("explains an upstream New API insufficient-balance error", () => {
  const error = new APICallError({
    message: "Failed to call language model",
    requestBodyValues: {},
    responseBody: JSON.stringify({
      error: {
        code: "insufficient_quota",
        message: "当前账户余额不足，请充值后再试",
      },
    }),
    statusCode: 403,
    url: "https://ai-store.example/v1/chat/completions",
  });

  assert.equal(
    getAIProviderErrorMessage(error),
    "The AI provider account has insufficient balance. Recharge the account or choose another enabled model."
  );
});

test("explains provider authentication and rate-limit errors without leaking details", () => {
  const authError = new APICallError({
    message: "Unauthorized",
    requestBodyValues: { apiKey: "secret" },
    responseBody: "invalid api key",
    statusCode: 401,
    url: "https://ai-store.example/v1/chat/completions",
  });
  const rateLimitError = new APICallError({
    message: "Too many requests",
    requestBodyValues: {},
    responseBody: "retry later",
    statusCode: 429,
    url: "https://ai-store.example/v1/chat/completions",
  });

  assert.match(getAIProviderErrorMessage(authError) ?? "", /API URL and key/);
  assert.match(
    getAIProviderErrorMessage(rateLimitError) ?? "",
    /rate limiting/
  );
  assert.equal(
    getAIProviderErrorMessage(new Error("unknown failure")),
    undefined
  );
});
