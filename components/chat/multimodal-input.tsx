// biome-ignore-all lint/performance/noJsxPropsBind: composer callbacks are scoped to this surface
"use client";

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import equal from "fast-deep-equal";
import {
  ArrowUpIcon,
  MicIcon,
  MicOffIcon,
  SlidersHorizontalIcon,
  WrenchIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  type ChangeEvent,
  type Dispatch,
  memo,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { useLocalStorage, useWindowSize } from "usehooks-ts";
import { useLocale } from "@/components/locale-provider";
import type { ModelCapabilities } from "@/lib/ai/models";
import type { ChatSettings } from "@/lib/chat/settings";
import {
  createSpeechRecognition,
  extractSpeechTranscript,
  mergeSpeechTranscript,
  type SpeechRecognitionLike,
} from "@/lib/chat/speech";
import type { Attachment, ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "../ai-elements/prompt-input";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ChatSettingsDialog } from "./chat-settings-dialog";
import { ChatToolsDialog } from "./chat-tools-dialog";
import { PaperclipIcon, StopIcon } from "./icons";
import { ModelSelectorCompact } from "./model-selector-compact";
import { PreviewAttachment } from "./preview-attachment";
import {
  getSlashCommands,
  type SlashCommand,
  SlashCommandMenu,
} from "./slash-commands";
import { SuggestedActions } from "./suggested-actions";
import type { VisibilityType } from "./visibility-selector";

function PureMultimodalInput({
  chatId,
  chatSettings,
  input,
  setInput,
  status,
  stop,
  attachments,
  setAttachments,
  messages,
  setMessages,
  sendMessage,
  className,
  selectedVisibilityType,
  selectedModelId,
  onModelChange,
  onSettingsChange,
  editingMessage,
  onCancelEdit,
  isLoading,
}: {
  chatId: string;
  chatSettings: ChatSettings;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  status: UseChatHelpers<ChatMessage>["status"];
  stop: () => void;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  messages: UIMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  sendMessage:
    | UseChatHelpers<ChatMessage>["sendMessage"]
    | (() => Promise<void>);
  className?: string;
  selectedVisibilityType: VisibilityType;
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
  onSettingsChange: Dispatch<SetStateAction<ChatSettings>>;
  editingMessage?: ChatMessage | null;
  onCancelEdit?: () => void;
  isLoading?: boolean;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { width } = useWindowSize();
  const hasAutoFocused = useRef(false);
  useEffect(() => {
    if (!hasAutoFocused.current && width) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        hasAutoFocused.current = true;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [width]);

  const [localStorageInput, setLocalStorageInput] = useLocalStorage(
    "input",
    ""
  );

  useEffect(() => {
    if (textareaRef.current) {
      const domValue = textareaRef.current.value;
      const finalValue = domValue || localStorageInput || "";
      setInput(finalValue);
    }
  }, [localStorageInput, setInput]);

  useEffect(() => {
    setLocalStorageInput(input);
  }, [input, setLocalStorageInput]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [slashOpen, setSlashOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const slashCommands = useMemo(() => getSlashCommands(t), [t]);

  useEffect(
    () => () => {
      speechRecognitionRef.current?.stop();
    },
    []
  );

  const handleVoiceInput = useCallback(() => {
    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = createSpeechRecognition();
    if (!recognition) {
      toast.error(t("chat.composer.voiceUnavailable"));
      return;
    }

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || "en-US";
    recognition.onresult = (event) => {
      const transcript = extractSpeechTranscript(event);
      if (transcript) {
        setInput((current) => mergeSpeechTranscript(current, transcript));
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error(t("chat.composer.voiceFailed"));
    };
    recognition.onend = () => {
      setIsListening(false);
      speechRecognitionRef.current = null;
    };
    speechRecognitionRef.current = recognition;
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      setIsListening(false);
      speechRecognitionRef.current = null;
      toast.error(t("chat.composer.voiceFailed"));
    }
  }, [isListening, setInput, t]);

  const handleInput = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const val = event.target.value;
      setInput(val);

      if (val.startsWith("/") && !val.includes(" ")) {
        setSlashOpen(true);
        setSlashQuery(val.slice(1));
        setSlashIndex(0);
      } else {
        setSlashOpen(false);
      }
    },
    [setInput]
  );

  const handleSlashSelect = useCallback(
    (cmd: SlashCommand) => {
      setSlashOpen(false);
      setInput("");
      switch (cmd.action) {
        case "new":
          router.push("/");
          break;
        case "clear":
          setMessages(() => []);
          break;
        case "rename":
          toast(t("chat.rename.unavailable"));
          break;
        case "model": {
          const modelBtn = document.querySelector<HTMLButtonElement>(
            "[data-testid='model-selector']"
          );
          modelBtn?.click();
          break;
        }
        case "theme":
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          break;
        case "delete":
          toast(t("chat.delete.title"), {
            action: {
              label: t("chat.delete"),
              onClick: () => {
                fetch(
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatId}`,
                  { method: "DELETE" }
                );
                router.push("/");
                toast.success(t("chat.delete.success"));
              },
            },
          });
          break;
        case "purge":
          toast(t("chat.deleteAll.title"), {
            action: {
              label: t("chat.deleteAll"),
              onClick: () => {
                fetch(
                  `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`,
                  {
                    method: "DELETE",
                  }
                );
                router.push("/");
                toast.success(t("chat.deleteAll.success"));
              },
            },
          });
          break;
        default:
          break;
      }
    },
    [chatId, resolvedTheme, router, setInput, setMessages, setTheme, t]
  );

  const submitForm = useCallback(() => {
    window.history.pushState(
      {},
      "",
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/chat/${chatId}`
    );

    sendMessage({
      parts: [
        ...attachments.map((attachment) => ({
          mediaType: attachment.contentType,
          name: attachment.name,
          type: "file" as const,
          url: attachment.url,
        })),
        {
          text: input,
          type: "text",
        },
      ],
      role: "user",
    });

    setAttachments([]);
    setLocalStorageInput("");
    setInput("");

    if (width && width > 768) {
      textareaRef.current?.focus();
    }
  }, [
    input,
    setInput,
    attachments,
    sendMessage,
    setAttachments,
    setLocalStorageInput,
    width,
    chatId,
  ]);

  const uploadFile = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/files/upload`,
          {
            body: formData,
            method: "POST",
          }
        );

        if (response.ok) {
          const data = await response.json();
          const { url, pathname, contentType } = data;

          return {
            contentType,
            name: pathname,
            url,
          };
        }
        const { error } = await response.json();
        toast.error(error);
      } catch {
        toast.error(t("chat.upload.failedFile"));
      }
    },
    [t]
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        );

        setAttachments((currentAttachments) => [
          ...currentAttachments,
          ...successfullyUploadedAttachments,
        ]);
      } catch {
        toast.error(t("chat.upload.failedFiles"));
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, t, uploadFile]
  );

  const handlePaste = useCallback(
    async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {
        return;
      }

      const imageItems = Array.from(items).filter((item) =>
        item.type.startsWith("image/")
      );

      if (imageItems.length === 0) {
        return;
      }

      event.preventDefault();

      setUploadQueue((prev) => [...prev, t("chat.upload.pastedImage")]);

      try {
        const uploadPromises = imageItems
          .map((item) => item.getAsFile())
          .filter((file): file is File => file !== null)
          .map((file) => uploadFile(file));

        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) =>
            attachment !== undefined &&
            attachment.url !== undefined &&
            attachment.contentType !== undefined
        );

        setAttachments((curr) => [
          ...curr,
          ...(successfullyUploadedAttachments as Attachment[]),
        ]);
      } catch {
        toast.error(t("chat.upload.failedPastedImages"));
      } finally {
        setUploadQueue([]);
      }
    },
    [setAttachments, t, uploadFile]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.addEventListener("paste", handlePaste);
    return () => textarea.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleCancelEditMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      onCancelEdit?.();
    },
    [onCancelEdit]
  );

  const handleSlashClose = useCallback(() => {
    setSlashOpen(false);
  }, []);

  const handlePromptSubmit = useCallback(() => {
    if (input.startsWith("/")) {
      const query = input.slice(1).trim();
      const cmd = slashCommands.find((c) => c.name === query);
      if (cmd) {
        handleSlashSelect(cmd);
      }
      return;
    }
    if (!input.trim() && attachments.length === 0) {
      return;
    }
    if (status === "ready" || status === "error") {
      submitForm();
    } else {
      toast.error(t("chat.wait.response"));
    }
  }, [
    attachments.length,
    handleSlashSelect,
    input,
    slashCommands,
    status,
    submitForm,
    t,
  ]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (slashOpen) {
        const filtered = slashCommands.filter((cmd) =>
          cmd.name.startsWith(slashQuery.toLowerCase())
        );
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSlashIndex((i) => Math.min(i + 1, filtered.length - 1));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSlashIndex((i) => Math.max(i - 1, 0));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          if (filtered[slashIndex]) {
            handleSlashSelect(filtered[slashIndex]);
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setSlashOpen(false);
          return;
        }
      }
      if (e.key === "Escape" && editingMessage && onCancelEdit) {
        e.preventDefault();
        onCancelEdit();
      }
    },
    [
      editingMessage,
      handleSlashSelect,
      onCancelEdit,
      slashIndex,
      slashOpen,
      slashQuery,
      slashCommands,
    ]
  );

  return (
    <div className={cn("relative flex w-full flex-col gap-4", className)}>
      {editingMessage && onCancelEdit ? (
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span>{t("chat.composer.editing")}</span>
          <button
            className="rounded px-1.5 py-0.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
            onMouseDown={handleCancelEditMouseDown}
            type="button"
          >
            {t("chat.cancel")}
          </button>
        </div>
      ) : null}

      {!editingMessage &&
        !isLoading &&
        messages.length === 0 &&
        attachments.length === 0 &&
        uploadQueue.length === 0 && (
          <SuggestedActions
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
            sendMessage={sendMessage}
          />
        )}

      <input
        className="pointer-events-none fixed -top-4 -left-4 size-0.5 opacity-0"
        multiple
        onChange={handleFileChange}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <div className="relative">
        {slashOpen ? (
          <SlashCommandMenu
            commands={slashCommands}
            onClose={handleSlashClose}
            onSelect={handleSlashSelect}
            query={slashQuery}
            selectedIndex={slashIndex}
          />
        ) : null}
      </div>

      <PromptInput
        className="[&>div]:rounded-2xl [&>div]:border [&>div]:border-border/30 [&>div]:bg-card/70 [&>div]:shadow-[var(--shadow-composer)] [&>div]:transition-shadow [&>div]:duration-300 [&>div]:focus-within:shadow-[var(--shadow-composer-focus)]"
        onSubmit={handlePromptSubmit}
      >
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div
            className="flex w-full self-start flex-row gap-2 overflow-x-auto px-3 pt-3 no-scrollbar"
            data-testid="attachments-preview"
          >
            {attachments.map((attachment) => (
              <AttachmentPreviewItem
                attachment={attachment}
                fileInputRef={fileInputRef}
                key={attachment.url}
                setAttachments={setAttachments}
              />
            ))}

            {uploadQueue.map((filename) => (
              <PreviewAttachment
                attachment={{
                  contentType: "",
                  name: filename,
                  url: "",
                }}
                isUploading={true}
                key={filename}
              />
            ))}
          </div>
        )}
        <PromptInputTextarea
          className="min-h-24 text-[13px] leading-relaxed px-4 pt-3.5 pb-1.5 placeholder:text-muted-foreground/35"
          data-testid="multimodal-input"
          onChange={handleInput}
          onKeyDown={handleTextareaKeyDown}
          placeholder={
            editingMessage ? t("chat.composer.edit") : t("chat.composer.ask")
          }
          ref={textareaRef}
          value={input}
        />
        <PromptInputFooter className="px-3 pb-3">
          <PromptInputTools>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={t("chat.header.tools")}
                  className="h-7 w-7 rounded-lg border border-border/40 p-1 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  onClick={() => setToolsOpen(true)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <WrenchIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t("chat.header.tools")}
              </TooltipContent>
            </Tooltip>
            <AttachmentsButton
              fileInputRef={fileInputRef}
              selectedModelId={selectedModelId}
              status={status}
            />
            <ModelSelectorCompact
              onModelChange={onModelChange}
              selectedModelId={selectedModelId}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label={t("chat.header.settings")}
                  className="h-7 w-7 rounded-lg border border-border/40 p-1 text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                  onClick={() => setSettingsOpen(true)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <SlidersHorizontalIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t("chat.header.settings")}
              </TooltipContent>
            </Tooltip>
          </PromptInputTools>

          <div className="flex items-center gap-1">
            {status === "submitted" || status === "streaming" ? null : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={
                      isListening
                        ? t("chat.composer.stopVoice")
                        : t("chat.composer.voice")
                    }
                    aria-pressed={isListening}
                    className={cn(
                      "h-7 w-7 rounded-lg border border-border/40 p-1 transition-colors hover:border-border hover:text-foreground",
                      isListening && "bg-rose-500/10 text-rose-600"
                    )}
                    onClick={handleVoiceInput}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    {isListening ? (
                      <MicOffIcon className="size-3.5" />
                    ) : (
                      <MicIcon className="size-3.5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isListening
                    ? t("chat.composer.stopVoice")
                    : t("chat.composer.voice")}
                </TooltipContent>
              </Tooltip>
            )}
            {status === "submitted" || status === "streaming" ? (
              <StopButton setMessages={setMessages} stop={stop} />
            ) : (
              <PromptInputSubmit
                className={cn(
                  "h-7 w-7 rounded-xl transition-all duration-200",
                  input.trim()
                    ? "bg-foreground text-background hover:opacity-85 active:scale-95"
                    : "bg-muted text-muted-foreground/25 cursor-not-allowed"
                )}
                data-testid="send-button"
                disabled={!input.trim() || uploadQueue.length > 0}
                status={status}
                variant="secondary"
              >
                <ArrowUpIcon className="size-4" />
              </PromptInputSubmit>
            )}
          </div>
        </PromptInputFooter>
      </PromptInput>

      <ChatToolsDialog
        onAddMedia={() => fileInputRef.current?.click()}
        onOpenChange={setToolsOpen}
        open={toolsOpen}
      />
      <ChatSettingsDialog
        onOpenChange={setSettingsOpen}
        onSettingsChange={onSettingsChange}
        open={settingsOpen}
        settings={chatSettings}
      />
    </div>
  );
}

export const MultimodalInput = memo(
  PureMultimodalInput,
  (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) {
      return false;
    }
    if (prevProps.status !== nextProps.status) {
      return false;
    }
    if (!equal(prevProps.attachments, nextProps.attachments)) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }
    if (prevProps.selectedModelId !== nextProps.selectedModelId) {
      return false;
    }
    if (prevProps.editingMessage !== nextProps.editingMessage) {
      return false;
    }
    if (prevProps.isLoading !== nextProps.isLoading) {
      return false;
    }
    if (prevProps.messages.length !== nextProps.messages.length) {
      return false;
    }

    return true;
  }
);

function PureAttachmentPreviewItem({
  attachment,
  fileInputRef,
  setAttachments,
}: {
  attachment: Attachment;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
}) {
  const handleRemove = useCallback(() => {
    setAttachments((currentAttachments) =>
      currentAttachments.filter((a) => a.url !== attachment.url)
    );
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [attachment.url, fileInputRef, setAttachments]);

  return <PreviewAttachment attachment={attachment} onRemove={handleRemove} />;
}

const AttachmentPreviewItem = memo(PureAttachmentPreviewItem);

function PureAttachmentsButton({
  fileInputRef,
  status,
  selectedModelId,
}: {
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  status: UseChatHelpers<ChatMessage>["status"];
  selectedModelId: string;
}) {
  const { data: modelsResponse } = useSWR(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/models`,
    (url: string) => fetch(url).then((r) => r.json()),
    { dedupingInterval: 3_600_000, revalidateOnFocus: false }
  );

  const caps: Record<string, ModelCapabilities> | undefined =
    modelsResponse?.capabilities ?? modelsResponse;
  const hasVision = caps?.[selectedModelId]?.vision ?? false;
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      fileInputRef.current?.click();
    },
    [fileInputRef]
  );

  return (
    <Button
      className={cn(
        "h-7 w-7 rounded-lg border border-border/40 p-1 transition-colors",
        hasVision
          ? "text-foreground hover:border-border hover:text-foreground"
          : "text-muted-foreground/30 cursor-not-allowed"
      )}
      data-testid="attachments-button"
      disabled={status !== "ready" || !hasVision}
      onClick={handleClick}
      variant="ghost"
    >
      <PaperclipIcon size={14} style={{ height: 14, width: 14 }} />
    </Button>
  );
}

const AttachmentsButton = memo(PureAttachmentsButton);

function PureStopButton({
  stop,
  setMessages,
}: {
  stop: () => void;
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
}) {
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      stop();
      setMessages((messages) => messages);
    },
    [setMessages, stop]
  );

  return (
    <Button
      className="h-7 w-7 rounded-xl bg-foreground p-1 text-background transition-all duration-200 hover:opacity-85 active:scale-95 disabled:bg-muted disabled:text-muted-foreground/25 disabled:cursor-not-allowed"
      data-testid="stop-button"
      onClick={handleClick}
    >
      <StopIcon size={14} />
    </Button>
  );
}

const StopButton = memo(PureStopButton);
