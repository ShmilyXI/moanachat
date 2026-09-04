"use client";

import { PanelLeftIcon, PenSquareIcon } from "lucide-react";
import Link from "next/link";
import { memo } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import type { ChatMode } from "@/lib/chat/modes";
import { NEW_CHAT_PATH } from "@/lib/chat/routes";
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
          <Link href={NEW_CHAT_PATH}>
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
