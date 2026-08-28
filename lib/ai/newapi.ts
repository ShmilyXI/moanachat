import type { ChatModel } from "./models";
import type { RuntimeConfig } from "./runtime-config";

type OpenAIModelRecord = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  type?: unknown;
  model_spec?: {
    availableContextTokens?: unknown;
    capabilities?: Record<string, unknown>;
    description?: unknown;
    privacy?: unknown;
    pricing?: { input?: unknown; output?: unknown };
    traits?: unknown;
  };
};

type OpenAIModelsResponse = {
  data?: unknown;
};

export type NewApiConfig = Pick<RuntimeConfig, "baseUrl" | "apiKey">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Convert the OpenAI `/v1/models` envelope into the model shape used by Moanachat. */
export function normalizeNewApiModels(payload: unknown): ChatModel[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    return [];
  }

  return payload.data.flatMap((value) => {
    if (!isRecord(value)) {
      return [];
    }

    const record = value as OpenAIModelRecord;
    if (typeof record.id !== "string" || !record.id.trim()) {
      return [];
    }

    const id = record.id.trim();
    const name =
      typeof record.name === "string" && record.name.trim()
        ? record.name.trim()
        : id;
    const description =
      typeof record.description === "string"
        ? record.description
        : typeof record.model_spec?.description === "string"
          ? record.model_spec.description
          : "";
    const model = {
      description,
      id,
      name,
      provider: id.split("/")[0] || id,
    } as ChatModel;
    const spec = record.model_spec;
    if (typeof record.type === "string") {
      model.type = record.type;
    }
    if (
      spec &&
      typeof spec.availableContextTokens === "number" &&
      Number.isFinite(spec.availableContextTokens)
    ) {
      model.contextLength = spec.availableContextTokens;
    }
    if (spec && typeof spec.privacy === "string") {
      model.privacy = spec.privacy;
    }
    if (spec?.pricing && typeof spec.pricing === "object") {
      const input =
        typeof spec.pricing.input === "number" ? spec.pricing.input : undefined;
      const output =
        typeof spec.pricing.output === "number"
          ? spec.pricing.output
          : undefined;
      if (input !== undefined || output !== undefined) {
        model.pricing = { input, output };
      }
    }
    if (spec && Array.isArray(spec.traits)) {
      const tags = spec.traits.filter(
        (trait): trait is string => typeof trait === "string"
      );
      if (tags.length > 0) {
        model.tags = tags;
      }
    }
    if (spec?.capabilities) {
      model.capabilities = {
        audioInput: spec.capabilities.supportsAudioInput === true,
        reasoning: spec.capabilities.supportsReasoning === true,
        tools: spec.capabilities.supportsFunctionCalling === true,
        videoInput: spec.capabilities.supportsVideoInput === true,
        vision: spec.capabilities.supportsVision === true,
        webSearch: spec.capabilities.supportsWebSearch === true,
      };
    }
    return [model];
  });
}

function getModelsUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, "")}/v1/models`;
}

export async function fetchNewApiModels(
  config: NewApiConfig
): Promise<ChatModel[]> {
  if (!config.baseUrl || !config.apiKey) {
    return [];
  }

  try {
    const response = await fetch(getModelsUrl(config.baseUrl), {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as OpenAIModelsResponse;
    return normalizeNewApiModels(payload);
  } catch {
    return [];
  }
}

export async function getNewApiModelIds(
  config: NewApiConfig
): Promise<Set<string>> {
  return new Set((await fetchNewApiModels(config)).map((model) => model.id));
}
