import type { ChatModel } from "./models";
import type { RuntimeConfig } from "./runtime-config";

type OpenAIModelRecord = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
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
      typeof record.description === "string" ? record.description : "";

    return [
      {
        description,
        id,
        name,
        provider: id.split("/")[0] || id,
      },
    ];
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
