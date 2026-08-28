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
import { useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  VenicePageHeader,
  VenicePageLayout,
} from "@/components/venice/venice-page";
import { cn } from "@/lib/utils";

type FeedItem = {
  id: string;
  image: string;
  title: string;
  author: string;
  kind: "image" | "video";
};

const feedItems: FeedItem[] = [
  {
    author: "Venice creator",
    id: "1",
    image: "/images/demo-thumbnail.png",
    kind: "image",
    title: "Cinematic study in light",
  },
  {
    author: "Venice creator",
    id: "2",
    image: "/images/mouth of the seine, monet.jpg",
    kind: "image",
    title: "A quiet afternoon by the river",
  },
  {
    author: "Venice creator",
    id: "3",
    image: "/preview.png",
    kind: "video",
    title: "A moving sketch of an imagined city",
  },
];

export default function FeedPage() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<
    "all" | "image" | "video" | "notifications"
  >("all");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState("");

  const visibleItems = feedItems.filter((item) => {
    if (
      filter !== "all" &&
      filter !== "notifications" &&
      item.kind !== filter
    ) {
      return false;
    }
    return (
      !query.trim() ||
      `${item.title} ${item.author}`.toLowerCase().includes(query.toLowerCase())
    );
  });

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
            onClick={() => setFilter(value as typeof filter)}
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
      ) : (
        <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-6 sm:grid-cols-2 md:px-10 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <article
              className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-card)]"
              key={item.id}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <Image
                  alt={item.title}
                  className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  src={item.image}
                />
              </div>
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
                      liked[item.id] && "text-rose-500"
                    )}
                    onClick={() =>
                      setLiked((current) => ({
                        ...current,
                        [item.id]: !current[item.id],
                      }))
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <HeartIcon
                      className="size-4"
                      fill={liked[item.id] ? "currentColor" : "none"}
                    />
                  </Button>
                  <Button
                    aria-label={t("feed.save")}
                    className={cn(
                      "size-8 rounded-lg",
                      saved[item.id] && "text-foreground"
                    )}
                    onClick={() =>
                      setSaved((current) => ({
                        ...current,
                        [item.id]: !current[item.id],
                      }))
                    }
                    size="icon"
                    variant="ghost"
                  >
                    <BookmarkIcon
                      className="size-4"
                      fill={saved[item.id] ? "currentColor" : "none"}
                    />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </VenicePageLayout>
  );
}
