import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { customProvider, gateway } from "ai";
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

export async function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const config = await getRuntimeConfig();
  if (config.mode === "embedded" && config.baseUrl && config.apiKey) {
    const provider = createOpenAICompatible({
      apiKey: config.apiKey,
      baseURL: `${config.baseUrl}/v1`,
      name: "new-api",
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
