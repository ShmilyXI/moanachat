// biome-ignore-all lint/performance/noJsxPropsBind: studio controls are local to the active tool
"use client";

import {
  AudioLinesIcon,
  ClapperboardIcon,
  FileImageIcon,
  FolderOpenIcon,
  ImageIcon,
  Maximize2Icon,
  PlayIcon,
  SparklesIcon,
  UploadIcon,
  VideoIcon,
} from "lucide-react";
import { useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { StudioFrame } from "@/components/venice/venice-page";

type StudioKind =
  | "image"
  | "enhance"
  | "audio"
  | "video"
  | "movie-editor"
  | "library";

const copy: Record<StudioKind, { title: string; description: string }> = {
  audio: {
    description: "Create music, speech, and sound effects from a prompt.",
    title: "Audio",
  },
  enhance: {
    description: "Edit, combine, upscale, and transform image assets.",
    title: "Edit",
  },
  image: {
    description: "Generate images with the model and style you choose.",
    title: "Image",
  },
  library: {
    description: "Keep generated media together and return to it later.",
    title: "Library",
  },
  "movie-editor": {
    description: "Arrange clips and export a finished movie.",
    title: "Movie editor",
  },
  video: {
    description: "Create short video clips from text or image references.",
    title: "Video",
  },
};

function StudioEmptyState({ kind }: { kind: StudioKind }) {
  const { t } = useLocale();
  const icon =
    kind === "audio" ? (
      <AudioLinesIcon className="size-7" />
    ) : kind === "video" ? (
      <VideoIcon className="size-7" />
    ) : kind === "movie-editor" ? (
      <ClapperboardIcon className="size-7" />
    ) : kind === "library" ? (
      <FolderOpenIcon className="size-7" />
    ) : kind === "enhance" ? (
      <Maximize2Icon className="size-7" />
    ) : (
      <ImageIcon className="size-7" />
    );

  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-foreground">
        {icon}
      </div>
      <p className="text-sm font-medium">{t("studio.emptyTitle")}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {t("studio.emptyDescription")}
      </p>
    </div>
  );
}

export function StudioToolPage({ kind }: { kind: StudioKind }) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [assetName, setAssetName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const labels = copy[kind];

  const submit = () => {
    if (kind === "enhance" && !assetName) {
      fileInputRef.current?.click();
      return;
    }
    setSubmitted(true);
  };

  if (kind === "library" || kind === "movie-editor") {
    return (
      <StudioFrame description={labels.description} title={labels.title}>
        {submitted ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
            <PlayIcon className="size-4" />
            <span>{t("studio.ready")}</span>
          </div>
        ) : null}
        <StudioEmptyState kind={kind} />
        <div className="mt-4 flex justify-center">
          <Button
            className="gap-2 rounded-lg"
            onClick={() => setSubmitted(true)}
          >
            {kind === "movie-editor" ? (
              <ClapperboardIcon className="size-4" />
            ) : (
              <FolderOpenIcon className="size-4" />
            )}
            {kind === "movie-editor"
              ? t("studio.createProject")
              : t("studio.uploadProject")}
          </Button>
        </div>
      </StudioFrame>
    );
  }

  return (
    <StudioFrame description={labels.description} title={labels.title}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-2xl border border-border/60 bg-card p-4 shadow-[var(--shadow-card)] md:p-6">
          {kind === "enhance" ? (
            <button
              className="flex min-h-52 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <UploadIcon className="mb-3 size-6" />
              <span>{assetName || t("studio.uploadAsset")}</span>
              <span className="mt-1 text-xs">{t("studio.uploadHint")}</span>
            </button>
          ) : (
            <>
              <label className="flex flex-col gap-2 text-sm">
                <span>
                  {kind === "audio"
                    ? t("studio.prompt")
                    : t("studio.promptImage")}
                </span>
                <textarea
                  aria-label={t("studio.prompt")}
                  className="min-h-48 w-full resize-y rounded-xl border border-border/60 bg-background px-3 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/45 focus:border-foreground/30"
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder={
                    kind === "audio"
                      ? t("studio.audioPlaceholder")
                      : t("studio.imagePlaceholder")
                  }
                  value={prompt}
                />
              </label>
              {submitted ? (
                <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <SparklesIcon className="size-4" />
                    {t("studio.ready")}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {prompt || t("studio.defaultPrompt")}
                  </p>
                </div>
              ) : null}
            </>
          )}
          <input
            accept="image/*"
            className="hidden"
            onChange={(event) =>
              setAssetName(event.target.files?.[0]?.name ?? "")
            }
            ref={fileInputRef}
            type="file"
          />
          <div className="mt-4 flex justify-end">
            <Button
              className="gap-2 rounded-lg"
              disabled={kind !== "enhance" && !prompt.trim()}
              onClick={submit}
            >
              {kind === "video" ? (
                <VideoIcon className="size-4" />
              ) : kind === "audio" ? (
                <AudioLinesIcon className="size-4" />
              ) : (
                <SparklesIcon className="size-4" />
              )}
              {t("studio.generate")}
            </Button>
          </div>
        </section>
        <aside className="space-y-3">
          <div className="rounded-xl border border-border/60 bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t("studio.settings")}
            </p>
            <div className="mt-3 grid gap-2">
              <Button
                className="justify-between rounded-lg border-border/50 text-sm"
                variant="outline"
              >
                <span>{t("studio.model")}</span>
                <span className="text-muted-foreground">Auto</span>
              </Button>
              <Button
                className="justify-between rounded-lg border-border/50 text-sm"
                variant="outline"
              >
                <span>{t("studio.aspect")}</span>
                <span className="text-muted-foreground">1:1</span>
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
            <FileImageIcon className="mb-2 size-4 text-foreground" />
            {t("studio.privacy")}
          </div>
        </aside>
      </div>
    </StudioFrame>
  );
}
