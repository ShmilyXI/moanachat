// biome-ignore-all lint/performance/noJsxPropsBind: the menu callback is local to this control
"use client";

import { ArchiveIcon, ChevronDownIcon, Clock3Icon } from "lucide-react";
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatMode } from "@/lib/chat/modes";

export function ChatModeSelector({
  mode,
  onModeChange,
}: {
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const isTemporary = mode === "temporary";

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={t("chat.header.chatMode")}
          className="h-9 gap-1.5 rounded-lg border-border/50 bg-background/50 px-2.5 text-xs text-muted-foreground shadow-none hover:bg-background hover:text-foreground"
          data-testid="chat-mode-selector"
          variant="outline"
        >
          {isTemporary ? (
            <Clock3Icon className="size-3.5" />
          ) : (
            <ArchiveIcon className="size-3.5" />
          )}
          <span className="hidden sm:inline">
            {isTemporary
              ? t("chat.header.chatModeTemporary")
              : t("chat.header.chatModeNormal")}
          </span>
          <ChevronDownIcon className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[300px]">
        <DropdownMenuRadioGroup
          onValueChange={(value) => {
            if (value === "normal" || value === "temporary") {
              onModeChange(value);
              setOpen(false);
            }
          }}
          value={mode}
        >
          <DropdownMenuRadioItem
            className="items-start py-3"
            data-testid="chat-mode-normal"
            value="normal"
          >
            <div className="flex flex-col gap-1">
              <span>{t("chat.header.chatModeNormal")}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {t("chat.header.chatModeNormalDescription")}
              </span>
            </div>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            className="items-start py-3"
            data-testid="chat-mode-temporary"
            value="temporary"
          >
            <div className="flex flex-col gap-1">
              <span>{t("chat.header.chatModeTemporary")}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {t("chat.header.chatModeTemporaryDescription")}
              </span>
            </div>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
