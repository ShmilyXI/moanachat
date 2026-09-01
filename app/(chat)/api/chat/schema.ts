import { z } from "zod";
import { isSupportedAttachmentType } from "@/lib/chat/attachments";

const textPartSchema = z.object({
  text: z.string().min(1).max(2000),
  type: z.enum(["text"]),
});

const filePartSchema = z.object({
  mediaType: z.string().refine(isSupportedAttachmentType, {
    message: "Unsupported attachment type",
  }),
  name: z.string().min(1).max(100),
  type: z.enum(["file"]),
  url: z.url(),
});

const partSchema = z.union([textPartSchema, filePartSchema]);

const userMessageSchema = z.object({
  id: z.uuid(),
  parts: z.array(partSchema),
  role: z.enum(["user"]),
});

const toolApprovalMessageSchema = z.object({
  id: z.string(),
  parts: z.array(z.record(z.string(), z.unknown())),
  role: z.enum(["user", "assistant"]),
});

const chatModeSchema = z.enum(["normal", "temporary"]).default("normal");
const chatSettingsSchema = z
  .object({
    disableSystemPrompt: z.boolean().optional(),
    reasoning: z.boolean().optional(),
    temperature: z.number().min(0).max(1.5).optional(),
    topP: z.number().min(0).max(1).optional(),
    urlScraping: z.boolean().optional(),
    webSearch: z.boolean().optional(),
  })
  .optional();

export const postRequestBodySchema = z.object({
  characterId: z.uuid().optional(),
  chatMode: chatModeSchema,
  chatSettings: chatSettingsSchema,
  id: z.uuid(),
  message: userMessageSchema.optional(),
  messages: z.array(toolApprovalMessageSchema).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(["public", "private"]),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
