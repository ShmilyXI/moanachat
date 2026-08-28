export const CHAT_MODES = ["normal", "temporary"] as const;

export type ChatMode = (typeof CHAT_MODES)[number];

export function isChatMode(value: unknown): value is ChatMode {
  return value === "normal" || value === "temporary";
}

export function shouldPersistChat(mode: ChatMode): boolean {
  return mode === "normal";
}
