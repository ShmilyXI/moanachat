export type ChatSettings = {
  webSearch: boolean;
  urlScraping: boolean;
  reasoning: boolean;
  largeContext: boolean;
  disableSystemPrompt: boolean;
  contextUsage: boolean;
  temperature: number;
  topP: number;
};

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  contextUsage: false,
  disableSystemPrompt: false,
  largeContext: true,
  reasoning: true,
  temperature: 0.6,
  topP: 0.95,
  urlScraping: false,
  webSearch: true,
};
