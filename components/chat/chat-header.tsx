"use client";

import { BotIcon, PanelLeftIcon, PenSquareIcon } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import type { ChatMode } from "@/lib/chat/modes";
import { ChatModeSelector } from "./chat-mode-selector";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";

function PureChatHeader({
  chatId,
  chatMode,
  onChatModeChange,
  selectedVisibilityType,
  isReadonly,
}: {
  chatId: string;
  chatMode: ChatMode;
  onChatModeChange: (mode: ChatMode) => void;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { t } = useLocale();
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-border/30 bg-sidebar/95 px-3 backdrop-blur-xl md:px-4">
      {isMobile ? (
        <Button
          aria-label={t("chat.sidebar.open")}
          className="size-8 rounded-lg"
          data-testid="sidebar-toggle-button"
          onClick={toggleSidebar}
          size="icon"
          variant="ghost"
        >
          <PanelLeftIcon className="size-4" />
        </Button>
      ) : null}

      <Link
        className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground sm:flex"
        href="/chat/agent"
      >
        <BotIcon className="size-3.5" />
        {isMobile ? null : <span>{t("chat.header.agent")}</span>}
        {isMobile ? null : (
          <span className="rounded-full bg-violet-200 px-1.5 py-0.5 text-[10px] font-medium text-violet-800 dark:bg-violet-300/20 dark:text-violet-200">
            {t("chat.new")}
          </span>
        )}
      </Link>

      <div className="ml-auto flex items-center gap-1.5">
        {isReadonly ? null : (
          <VisibilitySelector
            chatId={chatId}
            selectedVisibilityType={selectedVisibilityType}
          />
        )}
        <ChatModeSelector mode={chatMode} onModeChange={onChatModeChange} />
        <Button
          asChild
          className="h-9 gap-1.5 rounded-lg border-border/50 bg-background/60 px-2.5 text-xs shadow-none hover:bg-background"
          variant="outline"
        >
          <Link href="/">
            <PenSquareIcon className="size-3.5" />
            {isMobile ? null : <span>{t("chat.header.newChat")}</span>}
          </Link>
        </Button>
      </div>
    </header>
  );
}

export const ChatHeader = memo(
  PureChatHeader,
  (prevProps, nextProps) =>
    prevProps.chatId === nextProps.chatId &&
    prevProps.chatMode === nextProps.chatMode &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly
);
