// biome-ignore-all lint/performance/noJsxPropsBind: local form handlers are scoped to this page
"use client";

import {
  ArrowUpRightIcon,
  BotIcon,
  PlusIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  VenicePageHeader,
  VenicePageLayout,
} from "@/components/venice/venice-page";
import { fetcher } from "@/lib/utils";

type Character = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  visibility: "private" | "public";
};

export default function CharactersPage() {
  const { t } = useLocale();
  const {
    data: characters = [],
    isLoading,
    mutate,
  } = useSWR<Character[]>("/api/characters", fetcher);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createCharacter = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    const response = await fetch("/api/characters", {
      body: JSON.stringify({
        description: description.trim(),
        name: trimmedName,
        prompt: description.trim(),
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    if (!response.ok) {
      return;
    }
    await mutate();
    setName("");
    setDescription("");
  };

  return (
    <VenicePageLayout>
      <VenicePageHeader
        actions={
          <Button asChild className="gap-2 rounded-lg">
            <Link href="/character-chat/public">
              <ArrowUpRightIcon className="size-4" />
              {t("characters.browse")}
            </Link>
          </Button>
        }
        description={t("characters.description")}
        title={t("chat.nav.characters")}
      />
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-6 md:grid-cols-[minmax(0,1fr)_320px] md:px-10 md:py-10">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">{t("characters.mine")}</h2>
            <span className="text-xs text-muted-foreground">
              {characters.length}
            </span>
          </div>
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
              {t("chat.history.loading")}
            </div>
          ) : characters.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
              <BotIcon className="mb-3 size-7 text-muted-foreground" />
              <p className="text-sm font-medium">{t("characters.empty")}</p>
              <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                {t("characters.emptyDescription")}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {characters.map((character) => (
                <article
                  className="rounded-2xl border border-border/60 bg-card p-4"
                  key={character.id}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <BotIcon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium">
                        {character.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {character.description || t("characters.noDescription")}
                      </p>
                    </div>
                    <button
                      aria-label={t("chat.delete")}
                      className="ml-auto rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      onClick={async () => {
                        await fetch(`/api/characters?id=${character.id}`, {
                          method: "DELETE",
                        });
                        await mutate();
                      }}
                      type="button"
                    >
                      <Trash2Icon className="size-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2">
            <SparklesIcon className="size-4" />
            <h2 className="text-base font-medium">{t("characters.create")}</h2>
          </div>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm" htmlFor="character-name">
              <span>{t("characters.name")}</span>
              <Input
                id="character-name"
                onChange={(event) => setName(event.target.value)}
                placeholder={t("characters.namePlaceholder")}
                value={name}
              />
            </label>
            <label
              className="grid gap-2 text-sm"
              htmlFor="character-personality"
            >
              <span>{t("characters.personality")}</span>
              <textarea
                className="min-h-28 resize-y rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
                id="character-personality"
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("characters.personalityPlaceholder")}
                value={description}
              />
            </label>
            <Button
              className="gap-2 rounded-lg"
              disabled={!name.trim()}
              onClick={createCharacter}
            >
              <PlusIcon className="size-4" />
              {t("characters.save")}
            </Button>
          </div>
        </section>
      </div>
    </VenicePageLayout>
  );
}
