import assert from "node:assert/strict";
import test from "node:test";
import { agentRequestSchema, buildAgentInstructions } from "@/lib/ai/agent";

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
