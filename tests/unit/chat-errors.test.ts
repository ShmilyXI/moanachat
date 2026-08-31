import assert from "node:assert/strict";
import test from "node:test";
import { APICallError } from "ai";
import { getChatStreamErrorMessage } from "@/lib/ai/chat-errors";

test("maps provider quota errors to an actionable chat message", () => {
  const error = new APICallError({
    message: "Failed to call language model",
    requestBodyValues: {},
    responseBody: JSON.stringify({
      error: {
        code: "insufficient_user_quota",
        message: "Request rejected",
      },
    }),
    statusCode: 403,
    url: "https://ai-store.example/v1/chat/completions",
  });

  assert.equal(
    getChatStreamErrorMessage(error),
    "The AI provider account has insufficient balance. Recharge the account or choose another enabled model."
  );
});

test("uses a stable fallback for unknown chat stream errors", () => {
  assert.equal(
    getChatStreamErrorMessage(new Error("unknown failure")),
    "An error occurred."
  );
});
