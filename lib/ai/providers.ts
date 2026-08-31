import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { customProvider, gateway } from "ai";
import type { ChatSettings } from "@/lib/chat/settings";
import { isTestEnvironment } from "../constants";
import { titleModel } from "./models";
import { fetchNewApiModels } from "./newapi";
import { getRuntimeConfig } from "./runtime-config";

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        chatModel,
        titleModel: mockTitleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": mockTitleModel,
        },
      });
    })()
  : null;

export async function getLanguageModel(
  modelId: string,
  chatSettings?: ChatSettings
) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("chat-model");
  }

  const config = await getRuntimeConfig();
  if (config.mode === "embedded" && config.baseUrl && config.apiKey) {
    const provider = createOpenAICompatible({
      apiKey: config.apiKey,
      baseURL: `${config.baseUrl}/v1`,
      name: "new-api",
      transformRequestBody: (body) => ({
        ...body,
        venice_parameters: {
          disable_thinking: chatSettings?.reasoning === false,
          enable_e2ee: true,
          enable_web_citations: chatSettings?.webSearch ?? true,
          enable_web_scraping: chatSettings?.urlScraping ?? false,
          enable_web_search: chatSettings?.webSearch === false ? "off" : "auto",
          include_venice_system_prompt:
            chatSettings?.disableSystemPrompt !== true,
          return_search_results_as_documents: chatSettings?.webSearch ?? true,
        },
      }),
    });
    return provider(modelId);
  }

  return gateway.languageModel(modelId);
}

export async function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }

  const config = await getRuntimeConfig();
  if (config.mode === "embedded" && config.baseUrl && config.apiKey) {
    const provider = createOpenAICompatible({
      apiKey: config.apiKey,
      baseURL: `${config.baseUrl}/v1`,
      name: "new-api",
    });
    const models = await fetchNewApiModels(config);
    const modelId = models.some((model) => model.id === titleModel.id)
      ? titleModel.id
      : (models[0]?.id ?? titleModel.id);
    return provider(modelId);
  }

  return gateway.languageModel(titleModel.id);
}
