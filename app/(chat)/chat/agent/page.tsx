// biome-ignore-all lint/performance/noJsxPropsBind: agent interactions are scoped to this page
"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  ArrowUpIcon,
  BotIcon,
  ImageIcon,
  LightbulbIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useDataStream } from "@/components/chat/data-stream-provider";
import { PreviewMessage, ThinkingMessage } from "@/components/chat/message";
import { ModelSelectorCompact } from "@/components/chat/model-selector-compact";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { VenicePageLayout } from "@/components/venice/venice-page";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import type { ChatMessage } from "@/lib/types";
import { fetcherNoStore, generateUUID } from "@/lib/utils";

export default function AgentChatPage() {
  const { t } = useLocale();
  const { setDataStream } = useDataStream();
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_CHAT_MODEL);
  const chatIdRef = useRef(generateUUID());
  const demoPromptSentRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: modelsData } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    fetcherNoStore,
    { revalidateOnFocus: false }
  );
  const embeddedModels =
    modelsData?.mode === "embedded" ? modelsData.models : undefined;

  useEffect(() => {
    if (!embeddedModels?.length) {
      return;
    }

    const preferredModelId =
      modelsData?.defaultModelId ?? embeddedModels[0]?.id;
    if (
      preferredModelId &&
      !embeddedModels.some(
        (model: { id: string }) => model.id === selectedModelId
      )
    ) {
      setSelectedModelId(preferredModelId);
    }
  }, [embeddedModels, modelsData?.defaultModelId, selectedModelId]);

  const isEmbedded = modelsData?.mode === "embedded";
  const modelSelectionUnavailable =
    isEmbedded && (!modelsData || !embeddedModels?.length || !selectedModelId);
  const {
    addToolApprovalResponse,
    messages,
    regenerate,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat<ChatMessage>({
    generateId: generateUUID,
    id: chatIdRef.current,
    onData: (dataPart) => {
      setDataStream((current) => [...current, dataPart]);
    },
    onError: (streamError) => {
      setError(
        streamError.message?.includes("No AI provider")
          ? t("chat.provider.notConfigured")
          : streamError.message || "Agent request failed"
      );
    },
    transport: new DefaultChatTransport({
      api: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/agent`,
      prepareSendMessagesRequest({ id, messages: currentMessages }) {
        return {
          body: {
            id,
            messages: currentMessages,
            selectedChatModel: selectedModelId,
          },
        };
      },
    }),
  });

  useEffect(() => {
    if (demoPromptSentRef.current || modelSelectionUnavailable) {
      return;
    }

    const stored = window.localStorage.getItem("moanaDemoPrompt");
    if (!stored) {
      return;
    }

    let value = "";
    try {
      value = JSON.parse(stored)?.value?.trim() ?? "";
    } catch {
      value = "";
    }
    window.localStorage.removeItem("moanaDemoPrompt");
    if (!value) {
      return;
    }

    demoPromptSentRef.current = true;
    setError(null);
    sendMessage({
      parts: [{ text: value, type: "text" }],
      role: "user",
    }).catch(() => undefined);
  }, [modelSelectionUnavailable, sendMessage]);

  const messageCount = messages.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when streamed message state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount]);

  const submit = async () => {
    const value = prompt.trim();
    if (!value || status === "submitted" || status === "streaming") {
      return;
    }
    setPrompt("");
    setError(null);
    await sendMessage({
      parts: [{ text: value, type: "text" }],
      role: "user",
    });
  };

  const starters = [
    { icon: <LightbulbIcon />, label: t("agent.starter.world") },
    { icon: <ImageIcon />, label: t("agent.starter.image") },
    { icon: <BotIcon />, label: t("agent.starter.video") },
    { icon: <SparklesIcon />, label: t("agent.starter.surprise") },
  ];
  const isLoading = status === "submitted" || status === "streaming";

  return (
    <VenicePageLayout className="flex min-h-[calc(100dvh-1px)] flex-col items-center px-5 py-8">
      <div className="flex w-full max-w-3xl min-h-0 flex-1 flex-col">
        <div className="mx-auto mb-6 flex max-w-xl shrink-0 flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-foreground text-background">
            <BotIcon className="size-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {t("agent.title")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {t("agent.description")}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-5">
          {messages.length === 0 ? (
            <div className="flex min-h-36 items-center justify-center text-sm text-muted-foreground">
              {t("agent.empty")}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((message, index) => (
                <PreviewMessage
                  addToolApprovalResponse={addToolApprovalResponse}
                  chatId={chatIdRef.current}
                  isLoading={isLoading && index === messages.length - 1}
                  isReadonly={false}
                  key={message.id}
                  message={message}
                  regenerate={regenerate}
                  requiresScrollPadding={false}
                  setMessages={setMessages}
                  vote={undefined}
                />
              ))}
              {status === "submitted" && <ThinkingMessage />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {error ? (
          <p className="mb-3 shrink-0 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="shrink-0 rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-composer)] focus-within:shadow-[var(--shadow-composer-focus)]">
          <textarea
            aria-label={t("agent.input")}
            className="min-h-28 w-full resize-none bg-transparent px-4 py-4 text-sm outline-none placeholder:text-muted-foreground/45"
            disabled={isLoading}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit().catch(() => undefined);
              }
            }}
            placeholder={t("agent.input")}
            value={prompt}
          />
          <div className="flex items-center justify-between border-t border-border/40 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground/60">
                {t("agent.private")}
              </span>
              <ModelSelectorCompact
                onModelChange={setSelectedModelId}
                selectedModelId={selectedModelId}
              />
            </div>
            {isLoading ? (
              <Button
                aria-label={t("chat.composer.stop")}
                className="size-8 rounded-xl"
                onClick={() => stop()}
                size="icon"
                variant="outline"
              >
                <SquareIcon className="size-3.5" />
              </Button>
            ) : (
              <Button
                aria-label={t("chat.composer.submit")}
                className="size-8 rounded-xl"
                disabled={!prompt.trim() || modelSelectionUnavailable}
                onClick={() => submit().catch(() => undefined)}
                size="icon"
              >
                <ArrowUpIcon className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="mt-5 grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
            {starters.map((starter) => (
              <button
                className="flex min-h-20 flex-col items-start justify-between gap-3 rounded-xl border border-border/50 bg-card/50 px-3 py-3 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                key={starter.label}
                onClick={() => setPrompt(starter.label)}
                type="button"
              >
                <span className="text-foreground">{starter.icon}</span>
                <span>{starter.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </VenicePageLayout>
  );
}
