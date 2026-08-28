// The page owns short-lived input handlers for a single interactive surface.
// biome-ignore-all lint/performance/noJsxPropsBind: local handlers keep this page self-contained
"use client";

import {
  ArrowUpIcon,
  BotIcon,
  ImageIcon,
  LightbulbIcon,
  SparklesIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { VenicePageLayout } from "@/components/venice/venice-page";

export default function AgentChatPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const submit = () => {
    const value = prompt.trim();
    if (!value) {
      return;
    }
    router.push(`/?query=${encodeURIComponent(value)}`);
  };

  const starters = [
    { icon: <LightbulbIcon />, label: t("agent.starter.world") },
    { icon: <ImageIcon />, label: t("agent.starter.image") },
    { icon: <BotIcon />, label: t("agent.starter.video") },
    { icon: <SparklesIcon />, label: t("agent.starter.surprise") },
  ];

  return (
    <VenicePageLayout className="flex min-h-[calc(100dvh-1px)] flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-3xl">
        <div className="mx-auto mb-8 flex max-w-xl flex-col items-center text-center">
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

        <div className="rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-composer)] focus-within:shadow-[var(--shadow-composer-focus)]">
          <textarea
            aria-label={t("agent.input")}
            className="min-h-32 w-full resize-none bg-transparent px-4 py-4 text-sm outline-none placeholder:text-muted-foreground/45"
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={t("agent.input")}
            value={prompt}
          />
          <div className="flex items-center justify-between border-t border-border/40 px-3 py-2.5">
            <span className="text-xs text-muted-foreground/60">
              {t("agent.private")}
            </span>
            <Button
              aria-label={t("chat.composer.submit")}
              className="size-8 rounded-xl"
              disabled={!prompt.trim()}
              onClick={submit}
              size="icon"
            >
              <ArrowUpIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
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
      </div>
    </VenicePageLayout>
  );
}
