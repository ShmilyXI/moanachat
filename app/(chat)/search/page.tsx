// biome-ignore-all lint/performance/noJsxPropsBind: local search handler is scoped to this page
"use client";

import { ArrowUpRightIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { useLocale } from "@/components/locale-provider";
import { Input } from "@/components/ui/input";
import {
  VenicePageHeader,
  VenicePageLayout,
} from "@/components/venice/venice-page";
import { fetcher } from "@/lib/utils";

type HistoryChat = { id: string; title: string; createdAt: string };
type HistoryResponse = { chats: HistoryChat[]; hasMore: boolean };

export default function SearchPage() {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const { data, isLoading } = useSWR<HistoryResponse>(
    "/api/history?limit=50",
    fetcher
  );
  const chats = useMemo(() => {
    const source = data?.chats ?? [];
    return source.filter(
      (chat) =>
        !query.trim() || chat.title.toLowerCase().includes(query.toLowerCase())
    );
  }, [data, query]);

  return (
    <VenicePageLayout>
      <VenicePageHeader
        description={t("search.description")}
        title={t("chat.sidebar.search")}
      />
      <div className="mx-auto w-full max-w-3xl px-5 py-6 md:px-10 md:py-10">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            aria-label={t("search.input")}
            autoFocus
            className="h-10 rounded-lg pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search.input")}
            value={query}
          />
        </div>
        <div className="mt-6">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">
              {t("chat.history.loading")}
            </p>
          ) : null}
          {!isLoading && chats.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t("search.empty")}
            </p>
          ) : null}
          <div className="divide-y divide-border/40 rounded-xl border border-border/60 bg-card">
            {chats.map((chat) => (
              <Link
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                href={`/chat/${chat.id}`}
                key={chat.id}
              >
                <span className="truncate text-sm">{chat.title}</span>
                <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </VenicePageLayout>
  );
}
