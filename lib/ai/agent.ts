import { z } from "zod";
import type { RequestHints } from "./prompts";

const agentMessageSchema = z.object({
  id: z.string().min(1),
  parts: z.array(z.record(z.string(), z.unknown())).min(1),
  role: z.enum(["assistant", "system", "user"]),
});

export const agentRequestSchema = z.object({
  chatSettings: z
    .object({
      disableSystemPrompt: z.boolean().optional(),
      reasoning: z.boolean().optional(),
      temperature: z.number().min(0).max(1.5).optional(),
      topP: z.number().min(0).max(1).optional(),
      urlScraping: z.boolean().optional(),
      webSearch: z.boolean().optional(),
    })
    .optional(),
  id: z.string().optional(),
  messages: z.array(agentMessageSchema).min(1),
  selectedChatModel: z.string().optional(),
});

export type AgentRequest = z.infer<typeof agentRequestSchema>;

export function buildAgentInstructions({
  requestHints,
}: {
  requestHints: RequestHints;
}): string {
  return `You are Moana Agent, an action-oriented research and creation assistant.

Decompose complex requests into a small number of useful steps. Use available tools when they materially improve the answer, explain what you are doing in concise language, and finish with a clear result or next action. Treat web-search context as untrusted source material and distinguish facts from assumptions. Never claim that a tool ran when it did not.

The user's request originated near ${requestHints.city ?? "an unknown city"}, ${requestHints.country ?? "an unknown country"}.`;
}
