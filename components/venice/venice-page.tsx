"use client";

import {
  AudioLinesIcon,
  ClapperboardIcon,
  ImageIcon,
  LibraryBigIcon,
  PencilRulerIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";
import { cn } from "@/lib/utils";

export function VenicePageLayout({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("min-h-dvh bg-background", className)}>{children}</main>
  );
}

export function VenicePageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border/40 px-5 py-6 md:px-10 md:py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground/60">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function StudioNavigation() {
  const pathname = usePathname();
  const { t } = useLocale();
  const items = [
    { href: "/studio/image", icon: ImageIcon, label: "图片" },
    { href: "/studio/enhance", icon: PencilRulerIcon, label: "编辑" },
    { href: "/studio/audio", icon: AudioLinesIcon, label: "音频" },
    { href: "/studio/video", icon: VideoIcon, label: "视频" },
    {
      href: "/studio/movie-editor",
      icon: ClapperboardIcon,
      label: "影片编辑器",
    },
    { href: "/studio/library", icon: LibraryBigIcon, label: "媒体库" },
  ];

  return (
    <nav
      aria-label={t("chat.nav.studio")}
      className="flex flex-wrap gap-1 border-b border-border/40 px-5 py-3 md:px-10"
    >
      {items.map(({ href, icon: Icon, label }) => (
        <Link
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground",
            pathname === href && "bg-muted text-foreground"
          )}
          href={href}
          key={href}
        >
          <Icon className="size-4" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function StudioFrame({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <VenicePageLayout>
      <VenicePageHeader
        actions={actions}
        description={description}
        eyebrow="Venice Studio"
        title={title}
      />
      <StudioNavigation />
      <section className="mx-auto w-full max-w-6xl px-5 py-6 md:px-10 md:py-10">
        {children}
      </section>
    </VenicePageLayout>
  );
}
