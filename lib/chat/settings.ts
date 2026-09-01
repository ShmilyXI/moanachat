export type ChatSettings = {
  webSearch: boolean;
  urlScraping: boolean;
  reasoning: boolean;
  disableSystemPrompt: boolean;
  temperature: number;
  topP: number;
};

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  disableSystemPrompt: false,
  reasoning: true,
  temperature: 0.6,
  topP: 0.95,
  urlScraping: false,
  webSearch: true,
};
