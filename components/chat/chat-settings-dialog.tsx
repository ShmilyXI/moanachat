// biome-ignore-all lint/performance/noJsxPropsBind: setting callbacks are local to this dialog
"use client";

import { RotateCcwIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChatSettings } from "@/lib/chat/settings";
import { cn } from "@/lib/utils";

function SettingToggle({
  checked,
  description,
  disabled,
  label,
  onChange,
  testId,
}: {
  checked: boolean;
  description?: string;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  testId: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm">{label}</span>
        {description ? (
          <span className="text-xs text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <input
        aria-label={label}
        checked={checked}
        className="peer sr-only"
        data-testid={testId}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className="relative h-5 w-9 shrink-0 rounded-full bg-muted transition-colors peer-checked:bg-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-background after:transition-transform peer-checked:after:translate-x-4" />
    </label>
  );
}

export function ChatSettingsDialog({
  onOpenChange,
  open,
  settings,
  onSettingsChange,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  settings: ChatSettings;
  onSettingsChange: (settings: ChatSettings) => void;
}) {
  const { t } = useLocale();
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    if (open) {
      setDraft(settings);
    }
  }, [open, settings]);

  const update = <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K]
  ) => setDraft((current) => ({ ...current, [key]: value }));

  const close = () => {
    onSettingsChange(draft);
    onOpenChange(false);
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}
      open={open}
    >
      <DialogContent className="max-w-lg rounded-2xl p-0">
        <DialogHeader className="flex-row items-center justify-between border-b border-border/50 px-5 py-4">
          <DialogTitle>{t("chat.settings.title")}</DialogTitle>
          <Button
            aria-label={t("chat.settings.reset")}
            className="size-8 rounded-lg text-muted-foreground"
            onClick={() => setDraft(settings)}
            size="icon"
            variant="ghost"
          >
            <RotateCcwIcon className="size-3.5" />
          </Button>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-3 py-3">
          <SettingToggle
            checked={draft.webSearch}
            description={t("chat.settings.webSearchDescription")}
            label={t("chat.settings.webSearch")}
            onChange={(checked) => update("webSearch", checked)}
            testId="setting-web-search"
          />
          <SettingToggle
            checked={draft.urlScraping}
            description={t("chat.settings.urlScrapingDescription")}
            label={t("chat.settings.urlScraping")}
            onChange={(checked) => update("urlScraping", checked)}
            testId="setting-url-scraping"
          />
          <SettingToggle
            checked={draft.reasoning}
            description={t("chat.settings.reasoningDescription")}
            disabled
            label={t("chat.settings.reasoning")}
            onChange={(checked) => update("reasoning", checked)}
            testId="setting-reasoning"
          />
          <SettingToggle
            checked={draft.largeContext}
            description={t("chat.settings.contextDescription")}
            label={t("chat.settings.context")}
            onChange={(checked) => update("largeContext", checked)}
            testId="setting-large-context"
          />

          <div className="mt-3 border-t border-border/50 pt-3">
            <p className="px-2 pb-1 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t("chat.settings.advanced")}
            </p>
            <SettingToggle
              checked={draft.disableSystemPrompt}
              label={t("chat.settings.disableSystemPrompt")}
              onChange={(checked) => update("disableSystemPrompt", checked)}
              testId="setting-disable-system-prompt"
            />
            <SettingToggle
              checked={draft.contextUsage}
              label={t("chat.settings.contextUsage")}
              onChange={(checked) => update("contextUsage", checked)}
              testId="setting-context-usage"
            />
            <div className="grid grid-cols-2 gap-3 px-2 py-3">
              <label className="flex flex-col gap-2 text-sm">
                <span>{t("chat.settings.temperature")}</span>
                <span className="flex items-center gap-2">
                  <input
                    aria-label={t("chat.settings.temperature")}
                    className="h-1.5 w-full accent-foreground"
                    max="1.5"
                    min="0"
                    onChange={(event) =>
                      update("temperature", Number(event.target.value))
                    }
                    step="0.05"
                    type="range"
                    value={draft.temperature}
                  />
                  <output className="w-8 text-right text-xs text-muted-foreground">
                    {draft.temperature.toFixed(2)}
                  </output>
                </span>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span>{t("chat.settings.topP")}</span>
                <span className="flex items-center gap-2">
                  <input
                    aria-label={t("chat.settings.topP")}
                    className="h-1.5 w-full accent-foreground"
                    max="1"
                    min="0"
                    onChange={(event) =>
                      update("topP", Number(event.target.value))
                    }
                    step="0.05"
                    type="range"
                    value={draft.topP}
                  />
                  <output className="w-8 text-right text-xs text-muted-foreground">
                    {draft.topP.toFixed(2)}
                  </output>
                </span>
              </label>
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-border/50 px-5 py-3">
          <Button className={cn("rounded-lg")} onClick={close}>
            {t("chat.continue")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
