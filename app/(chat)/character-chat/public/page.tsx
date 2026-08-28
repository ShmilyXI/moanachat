// biome-ignore-all lint/performance/noJsxPropsBind: local search handler is scoped to this page
"use client";

import { BotIcon, MessageCircleIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  VenicePageHeader,
  VenicePageLayout,
} from "@/components/venice/venice-page";

const publicCharacters = [
  {
    description: "A thoughtful partner for drafts, ideas, and revision.",
    id: "writer",
    name: "The Writer",
  },
  {
    description: "A direct companion for plans, habits, and decisions.",
    id: "coach",
    name: "The Coach",
  },
  {
    description: "A curious guide for research and wide-ranging questions.",
    id: "explorer",
    name: "The Explorer",
  },
];

export default function PublicCharactersPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const items = publicCharacters.filter((item) =>
    `${item.name} ${item.description}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <VenicePageLayout>
      <VenicePageHeader
        description={t("characters.publicDescription")}
        title={t("characters.publicTitle")}
      />
      <div className="mx-auto w-full max-w-5xl px-5 py-6 md:px-10 md:py-10">
        <div className="relative mb-5 max-w-md">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            aria-label={t("characters.search")}
            className="h-9 rounded-lg pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("characters.search")}
            value={query}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((character) => (
            <article
              className="flex min-h-44 flex-col rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)]"
              key={character.id}
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                <BotIcon className="size-5" />
              </div>
              <h2 className="mt-4 text-sm font-medium">{character.name}</h2>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                {character.description}
              </p>
              <Button
                asChild
                className="mt-4 w-full gap-2 rounded-lg"
                size="sm"
                variant="outline"
              >
                <Link
                  href={`/?query=${encodeURIComponent(`Talk to ${character.name}`)}`}
                >
                  <MessageCircleIcon className="size-3.5" />
                  {t("characters.startChat")}
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </VenicePageLayout>
  );
}
