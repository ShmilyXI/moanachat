// biome-ignore-all lint/performance/noJsxPropsBind: studio controls are local to the active tool
"use client";

import {
  AudioLinesIcon,
  CheckIcon,
  ClapperboardIcon,
  FileImageIcon,
  FolderOpenIcon,
  ImageIcon,
  Maximize2Icon,
  PlayIcon,
  RefreshCwIcon,
  SparklesIcon,
  Trash2Icon,
  UploadIcon,
  VideoIcon,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { StudioFrame } from "@/components/venice/venice-page";
import {
  createStudioAsset,
  deleteStudioAsset,
  fetchStudioAssets,
  isStudioAssetPending,
  isStudioAssetReady,
  publishStudioAsset,
  refreshStudioAsset,
  type StudioAssetRecord,
} from "@/lib/ai/studio-client";

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

function AssetPreview({ asset }: { asset: StudioAssetRecord }) {
  if (!asset.outputUrl) {
    return null;
  }
  if (asset.kind === "audio") {
    return (
      <audio className="w-full" controls src={asset.outputUrl}>
        <track
          default
          kind="captions"
          label="Generated media"
          src="data:text/vtt,WEBVTT"
          srcLang="en"
        />
      </audio>
    );
  }
  if (asset.kind === "video") {
    return (
      <video
        className="aspect-video w-full rounded-xl bg-black object-contain"
        controls
        preload="metadata"
        src={asset.outputUrl}
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
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
      <Image
        alt={asset.title ?? "Generated image"}
        className="object-cover"
        fill
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
        src={asset.outputUrl}
        unoptimized
      />
    </div>
  );
}

function statusLabel(asset: StudioAssetRecord): string {
  if (asset.status === "failed") {
    return asset.error || "Generation failed";
  }
  if (asset.status === "completed") {
    return "Completed";
  }
  return asset.status === "queued" ? "Queued" : "Processing";
}

function AssetCard({
  asset,
  onDelete,
  onPublish,
  published,
}: {
  asset: StudioAssetRecord;
  onDelete: (id: string) => void;
  onPublish: (asset: StudioAssetRecord) => void;
  published: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-card)]">
      <div className="p-3">
        <AssetPreview asset={asset} />
        {isStudioAssetPending(asset) ? (
          <div className="flex min-h-36 items-center justify-center rounded-xl bg-muted/30 text-sm text-muted-foreground">
            <RefreshCwIcon className="mr-2 size-4 animate-spin" />
            {statusLabel(asset)}
          </div>
        ) : null}
      </div>
      <div className="border-t border-border/40 px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-medium">
              {asset.title || "Untitled"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {statusLabel(asset)}
            </p>
          </div>
          <button
            aria-label="Delete asset"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onDelete(asset.id)}
            type="button"
          >
            <Trash2Icon className="size-4" />
          </button>
        </div>
        {isStudioAssetReady(asset) ? (
          <Button
            className="mt-3 w-full gap-2 rounded-lg"
            disabled={published}
            onClick={() => onPublish(asset)}
            size="sm"
            variant="outline"
          >
            {published ? (
              <CheckIcon className="size-3.5" />
            ) : (
              <PlayIcon className="size-3.5" />
            )}
            {published ? "Published to Feed" : "Publish to Feed"}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () =>
      reject(new Error("Unable to read image"))
    );
    reader.readAsDataURL(file);
  });
}

export function StudioToolPage({ kind }: { kind: StudioKind }) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prompt, setPrompt] = useState("");
  const [assetName, setAssetName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [assets, setAssets] = useState<StudioAssetRecord[]>([]);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(kind === "library");
  const [error, setError] = useState<string | null>(null);
  const labels = copy[kind];

  const loadLibrary = useCallback(async () => {
    setIsLoadingLibrary(true);
    try {
      setAssets(await fetchStudioAssets());
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load media library"
      );
    } finally {
      setIsLoadingLibrary(false);
    }
  }, []);

  useEffect(() => {
    if (kind === "library") {
      loadLibrary().catch(() => undefined);
    }
  }, [kind, loadLibrary]);

  const pollAsset = useCallback(async (id: string) => {
    let attempts = 0;
    const check = async (): Promise<void> => {
      if (attempts >= 60) {
        return;
      }
      attempts += 1;
      await new Promise((resolve) => window.setTimeout(resolve, 2500));
      try {
        const next = await refreshStudioAsset(id);
        setAssets((current) =>
          current.map((asset) => (asset.id === id ? next : asset))
        );
        if (isStudioAssetPending(next)) {
          await check();
        }
      } catch {
        // Stop polling after a transient refresh failure.
      }
    };
    await check();
  }, []);

  const handleFileChange = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    try {
      setAssetName(file.name);
      setSourceUrl(await readFileAsDataUrl(file));
      setError(null);
    } catch (fileError) {
      setError(
        fileError instanceof Error ? fileError.message : "Unable to read image"
      );
    }
  };

  const submit = async () => {
    const value =
      prompt.trim() || (kind === "enhance" ? "Enhance this image" : "");
    if (!value || (kind === "enhance" && !sourceUrl)) {
      if (kind === "enhance") {
        fileInputRef.current?.click();
      }
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const generationKind: "audio" | "image" | "video" =
        kind === "enhance" ? "image" : (kind as "audio" | "image" | "video");
      const asset = await createStudioAsset({
        kind: generationKind,
        prompt: value,
        sourceUrl: kind === "enhance" ? sourceUrl : undefined,
        title: value.slice(0, 80),
      });
      setAssets((current) => [
        asset,
        ...current.filter((item) => item.id !== asset.id),
      ]);
      setPrompt("");
      if (isStudioAssetPending(asset)) {
        pollAsset(asset.id).catch(() => undefined);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Media generation failed"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStudioAsset(id);
      setAssets((current) => current.filter((asset) => asset.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete media asset"
      );
    }
  };

  const handlePublish = async (asset: StudioAssetRecord) => {
    try {
      await publishStudioAsset({
        assetId: asset.id,
        title: asset.title || "Untitled",
      });
      setPublishedIds((current) => new Set(current).add(asset.id));
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Unable to publish to Feed"
      );
    }
  };

  if (kind === "library") {
    return (
      <StudioFrame description={labels.description} title={labels.title}>
        {error ? (
          <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {isLoadingLibrary ? (
          <div className="flex min-h-72 items-center justify-center text-sm text-muted-foreground">
            {t("chat.history.loading")}
          </div>
        ) : assets.length === 0 ? (
          <StudioEmptyState kind={kind} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <AssetCard
                asset={asset}
                key={asset.id}
                onDelete={handleDelete}
                onPublish={handlePublish}
                published={publishedIds.has(asset.id)}
              />
            ))}
          </div>
        )}
      </StudioFrame>
    );
  }

  if (kind === "movie-editor") {
    return (
      <StudioFrame description={labels.description} title={labels.title}>
        <StudioEmptyState kind={kind} />
        <div className="mt-4 flex justify-center">
          <Button
            className="gap-2 rounded-lg"
            onClick={() => setError("Movie editing is not available yet.")}
          >
            <ClapperboardIcon className="size-4" />
            {t("studio.createProject")}
          </Button>
        </div>
        {error ? (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        ) : null}
      </StudioFrame>
    );
  }

  return (
    <StudioFrame description={labels.description} title={labels.title}>
      {error ? (
        <p className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
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
          ) : null}
          <label className="mt-4 flex flex-col gap-2 text-sm">
            <span>
              {kind === "audio" ? t("studio.prompt") : t("studio.promptImage")}
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
          <input
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(event) =>
              handleFileChange(event.target.files?.[0]).catch(() => undefined)
            }
            ref={fileInputRef}
            type="file"
          />
          <div className="mt-4 flex justify-end">
            <Button
              className="gap-2 rounded-lg"
              disabled={isGenerating || (kind !== "enhance" && !prompt.trim())}
              onClick={() => submit().catch(() => undefined)}
            >
              {isGenerating ? (
                <RefreshCwIcon className="size-4 animate-spin" />
              ) : kind === "video" ? (
                <VideoIcon className="size-4" />
              ) : kind === "audio" ? (
                <AudioLinesIcon className="size-4" />
              ) : (
                <SparklesIcon className="size-4" />
              )}
              {isGenerating ? "Generating..." : t("studio.generate")}
            </Button>
          </div>
          {assets[0] && kind !== "enhance" ? (
            <div className="mt-5">
              <AssetCard
                asset={assets[0]}
                onDelete={handleDelete}
                onPublish={handlePublish}
                published={publishedIds.has(assets[0].id)}
              />
            </div>
          ) : null}
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
                <span className="text-muted-foreground">
                  {kind === "video" ? "16:9" : "1:1"}
                </span>
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
