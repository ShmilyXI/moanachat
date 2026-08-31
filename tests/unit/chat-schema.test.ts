import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import { postRequestBodySchema } from "@/app/(chat)/api/chat/schema";

const baseRequest = {
  chatMode: "normal" as const,
  id: "00000000-0000-4000-8000-000000000001",
  selectedChatModel: "gpt-5.6-sol",
  selectedVisibilityType: "private" as const,
};

test("accepts supported document attachments in a chat message", () => {
  for (const [index, mediaType] of [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/plain",
    "text/markdown",
    "text/csv",
    "application/json",
  ].entries()) {
    const result = postRequestBodySchema.safeParse({
      ...baseRequest,
      message: {
        id: `00000000-0000-4000-8000-${String(index + 2).padStart(12, "0")}`,
        parts: [
          {
            mediaType,
            name: "document",
            type: "file",
            url: "https://blob.example.com/document",
          },
        ],
        role: "user",
      },
    });

    assert.equal(result.success, true, mediaType);
  }
});

test("rejects unsupported executable attachments", () => {
  const result = postRequestBodySchema.safeParse({
    ...baseRequest,
    message: {
      id: "00000000-0000-4000-8000-000000000002",
      parts: [
        {
          mediaType: "application/x-msdownload",
          name: "malware.exe",
          type: "file",
          url: "https://blob.example.com/malware.exe",
        },
      ],
      role: "user",
    },
  });

  assert.equal(result.success, false);
});
