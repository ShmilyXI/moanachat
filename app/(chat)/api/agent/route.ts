import { geolocation, ipAddress } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  isStepCount,
  streamText,
} from "ai";
import { auth, type UserType } from "@/app/(auth)/auth";
import { agentRequestSchema, buildAgentInstructions } from "@/lib/ai/agent";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import {
  chatModels,
  DEFAULT_CHAT_MODEL,
  getCapabilities,
  getCapabilitiesForModels,
  selectChatModel,
} from "@/lib/ai/models";
import { fetchNewApiModels } from "@/lib/ai/newapi";
import { getLanguageModel } from "@/lib/ai/providers";
import { getRuntimeConfig } from "@/lib/ai/runtime-config";
import { createDocument } from "@/lib/ai/tools/create-document";
import { editDocument } from "@/lib/ai/tools/edit-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
import { type ChatSettings, DEFAULT_CHAT_SETTINGS } from "@/lib/chat/settings";
import { isTestEnvironment } from "@/lib/constants";
import { getMessageCountByUserId } from "@/lib/db/queries";
import { ChatbotError } from "@/lib/errors";
import { checkIpRateLimit } from "@/lib/ratelimit";
import type { ChatMessage } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const parsed = agentRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return new ChatbotError("bad_request:api").toResponse();
  }

  const session = await auth();
  if (!session?.user) {
    return new ChatbotError("unauthorized:chat").toResponse();
  }

  try {
    await checkIpRateLimit(ipAddress(request));

    const userType: UserType = session.user.type;
    const messageCount = await getMessageCountByUserId({
      differenceInHours: 1,
      id: session.user.id,
    });
    if (messageCount > entitlementsByUserType[userType].maxMessagesPerHour) {
      return new ChatbotError("rate_limit:chat").toResponse();
    }

    const runtimeConfig = await getRuntimeConfig();
    if (
      !isTestEnvironment &&
      runtimeConfig.mode === "gateway" &&
      !runtimeConfig.apiKey
    ) {
      return new ChatbotError("not_configured:chat").toResponse();
    }
    const embeddedModels =
      runtimeConfig.mode === "embedded"
        ? await fetchNewApiModels(runtimeConfig)
        : undefined;
    if (runtimeConfig.mode === "embedded" && !embeddedModels?.length) {
      return new ChatbotError("offline:chat").toResponse();
    }

    const selectedModel = selectChatModel({
      availableModels: embeddedModels,
      mode: runtimeConfig.mode,
      requestedModelId: parsed.data.selectedChatModel ?? DEFAULT_CHAT_MODEL,
      staticDefaultModelId: DEFAULT_CHAT_MODEL,
    });
    const chatSettings: ChatSettings = {
      ...DEFAULT_CHAT_SETTINGS,
      ...parsed.data.chatSettings,
    };
    const capabilities =
      runtimeConfig.mode === "embedded"
        ? getCapabilitiesForModels(embeddedModels ?? [])[selectedModel]
        : (await getCapabilities())[selectedModel];
    const supportsTools = capabilities?.tools === true;
    const isReasoningModel = capabilities?.reasoning === true;
    const { city, country, latitude, longitude } = geolocation(request);
    const modelMessages = await convertToModelMessages(
      parsed.data.messages as ChatMessage[]
    );

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const result = streamText({
          activeTools: supportsTools
            ? [
                "getWeather",
                "createDocument",
                "editDocument",
                "updateDocument",
                "requestSuggestions",
              ]
            : [],
          instructions: buildAgentInstructions({
            requestHints: { city, country, latitude, longitude },
          }),
          messages: modelMessages,
          model: await getLanguageModel(selectedModel, chatSettings),
          providerOptions: {
            ...(chatModels.find((model) => model.id === selectedModel)
              ?.reasoningEffort && {
              openai: {
                reasoningEffort: chatModels.find(
                  (model) => model.id === selectedModel
                )?.reasoningEffort,
              },
            }),
          },
          stopWhen: isStepCount(8),
          temperature:
            runtimeConfig.mode === "embedded"
              ? chatSettings.temperature
              : undefined,
          tools: {
            createDocument: createDocument({
              dataStream: writer,
              modelId: selectedModel,
              session,
            }),
            editDocument: editDocument({ dataStream: writer, session }),
            getWeather,
            requestSuggestions: requestSuggestions({
              dataStream: writer,
              modelId: selectedModel,
              session,
            }),
            updateDocument: updateDocument({
              dataStream: writer,
              modelId: selectedModel,
              session,
            }),
          },
          topP:
            runtimeConfig.mode === "embedded" ? chatSettings.topP : undefined,
        });

        writer.merge(
          result.toUIMessageStream({
            sendReasoning: isReasoningModel,
          })
        );
      },
      generateId,
    });

    return createUIMessageStreamResponse({ stream });
  } catch (error) {
    if (error instanceof ChatbotError) {
      return error.toResponse();
    }
    console.error("Unhandled error in agent API:", error);
    return new ChatbotError("bad_request:api").toResponse();
  }
}
