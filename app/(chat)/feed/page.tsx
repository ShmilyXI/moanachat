// biome-ignore-all lint/performance/noJsxPropsBind: local feed controls are scoped to this page
"use client";

import {
  BellIcon,
  BookmarkIcon,
  HeartIcon,
  ImageIcon,
  SearchIcon,
  VideoIcon,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  VenicePageHeader,
  VenicePageLayout,
} from "@/components/venice/venice-page";
import { type FeedItem, fetchFeed, setFeedReaction } from "@/lib/feed-client";
import { cn } from "@/lib/utils";

type FeedFilter = "all" | "image" | "video" | "notifications";

function FeedMedia({ item }: { item: FeedItem }) {
  if (item.kind === "audio") {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-muted px-5">
        <audio className="w-full" controls src={item.mediaUrl}>
          <track
            default
            kind="captions"
            label="Generated media"
            src="data:text/vtt,WEBVTT"
            srcLang="en"
          />
        </audio>
      </div>
    );
  }
  if (item.kind === "video") {
    return (
      <video
        className="aspect-[4/3] w-full bg-black object-contain"
        controls
        preload="metadata"
        src={item.mediaUrl}
      >
        <track
          default
          kind="captions"
          label="Generated media"
          src="data:text/vtt,WEBVTT"
          srcLang="en"
        />
      </video>
    );
  }
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
      <Image
        alt={item.title}
        className="object-cover transition-transform duration-500 hover:scale-[1.03]"
        fill
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
        src={item.mediaUrl}
        unoptimized
      />
    </div>
  );
}

export default function FeedPage() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [query, setQuery] = useState("");
  const kind = filter === "image" || filter === "video" ? filter : undefined;
  const {
    data: items = [],
    error,
    isLoading,
    mutate,
  } = useSWR<FeedItem[]>(
    filter === "notifications" ? null : ["/api/feed", kind],
    ([, selectedKind]) =>
      fetchFeed(selectedKind as FeedItem["kind"] | undefined),
    { revalidateOnFocus: false }
  );

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter(
      (item) =>
        !normalized ||
        `${item.title} ${item.author}`.toLowerCase().includes(normalized)
    );
  }, [items, query]);

  const updateReaction = async (item: FeedItem, reaction: "like" | "save") => {
    const active = reaction === "like" ? !item.liked : !item.saved;
    await mutate(
      (current) =>
        current?.map((entry) => {
          if (entry.id !== item.id) {
            return entry;
          }
          return {
            ...entry,
            liked: reaction === "like" ? active : entry.liked,
            likes:
              reaction === "like"
                ? entry.likes + (active ? 1 : -1)
                : entry.likes,
            saved: reaction === "save" ? active : entry.saved,
            saves:
              reaction === "save"
                ? entry.saves + (active ? 1 : -1)
                : entry.saves,
          };
        }),
      { optimisticData: items, revalidate: false, rollbackOnError: true }
    );
    try {
      await setFeedReaction({ active, kind: reaction, postId: item.id });
    } catch {
      await mutate();
    }
  };

  return (
    <VenicePageLayout>
      <VenicePageHeader
        description={t("feed.description")}
        title={t("chat.nav.feed")}
      />
      <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-5 py-3 md:px-10">
        {[
          ["all", t("feed.recent"), null],
          ["image", t("feed.images"), ImageIcon],
          ["video", t("feed.videos"), VideoIcon],
          ["notifications", t("feed.notifications"), BellIcon],
        ].map(([value, label, Icon]) => (
          <Button
            className={cn(
              "gap-2 rounded-lg text-sm",
              filter === value
                ? "bg-muted text-foreground"
                : "text-muted-foreground"
            )}
            key={value as string}
            onClick={() => setFilter(value as FeedFilter)}
            size="sm"
            variant="ghost"
          >
            {Icon ? <Icon className="size-3.5" /> : null}
            {label as string}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <SearchIcon className="size-4 text-muted-foreground" />
          <Input
            aria-label={t("feed.search")}
            className="h-8 w-44 rounded-lg border-border/50 bg-transparent text-xs"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("feed.search")}
            value={query}
          />
        </div>
      </div>
      {filter === "notifications" ? (
        <div className="px-5 py-14 text-center text-sm text-muted-foreground md:px-10">
          {t("feed.emptyNotifications")}
        </div>
      ) : error ? (
        <div className="px-5 py-14 text-center text-sm text-destructive md:px-10">
          {error.message}
        </div>
      ) : isLoading ? (
        <div className="px-5 py-14 text-center text-sm text-muted-foreground md:px-10">
          {t("chat.history.loading")}
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="px-5 py-14 text-center text-sm text-muted-foreground md:px-10">
          {t("feed.empty")}
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-6 sm:grid-cols-2 md:px-10 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <article
              className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-card)]"
              key={item.id}
            >
              <FeedMedia item={item} />
              <div className="p-4">
                <h2 className="truncate text-sm font-medium">{item.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.author}
                </p>
                <div className="mt-4 flex items-center gap-1">
                  <Button
                    aria-label={t("feed.like")}
                    className={cn(
                      "size-8 rounded-lg",
                      item.liked && "text-rose-500"
                    )}
                    onClick={() =>
                      updateReaction(item, "like").catch(() => undefined)
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <HeartIcon
                      className="size-4"
                      fill={item.liked ? "currentColor" : "none"}
                    />
                  </Button>
                  <span className="mr-2 text-xs text-muted-foreground">
                    {item.likes}
                  </span>
                  <Button
                    aria-label={t("feed.save")}
                    className={cn(
                      "size-8 rounded-lg",
                      item.saved && "text-foreground"
                    )}
                    onClick={() =>
                      updateReaction(item, "save").catch(() => undefined)
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <BookmarkIcon
                      className="size-4"
                      fill={item.saved ? "currentColor" : "none"}
                    />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {item.saves}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </VenicePageLayout>
  );
}
