// biome-ignore-all lint/performance/noJsxPropsBind: tool callbacks are local to this dialog
"use client";

import {
  AudioLinesIcon,
  CombineIcon,
  FilePlus2Icon,
  ImageIcon,
  Maximize2Icon,
  ScanFaceIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/components/locale-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ToolItem = {
  href?: string;
  icon: React.ReactNode;
  key:
    | "addMedia"
    | "editImage"
    | "combineImages"
    | "upscale"
    | "removeBackground"
    | "imageToVideo"
    | "summarizeVideo"
    | "generateAudio"
    | "styleReference";
};

const toolItems: ToolItem[] = [
  { icon: <FilePlus2Icon />, key: "addMedia" },
  { href: "/studio/enhance", icon: <ImageIcon />, key: "editImage" },
  { href: "/studio/enhance", icon: <CombineIcon />, key: "combineImages" },
  { href: "/studio/enhance", icon: <Maximize2Icon />, key: "upscale" },
  { href: "/studio/enhance", icon: <ScanFaceIcon />, key: "removeBackground" },
  { href: "/studio/video", icon: <VideoIcon />, key: "imageToVideo" },
  { href: "/studio/video", icon: <VideoIcon />, key: "summarizeVideo" },
  { href: "/studio/audio", icon: <AudioLinesIcon />, key: "generateAudio" },
  { href: "/studio/image", icon: <SparklesIcon />, key: "styleReference" },
];

export function ChatToolsDialog({
  onAddMedia,
  onOpenChange,
  open,
}: {
  onAddMedia: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const { t } = useLocale();

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-sm rounded-2xl p-0">
        <DialogHeader className="border-b border-border/50 px-5 py-4">
          <DialogTitle>{t("chat.tools.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-1 p-3">
          {toolItems.map((item) => {
            const label = t(`chat.tools.${item.key}`);
            const className = cn(
              "flex min-h-20 flex-col items-start justify-between gap-3 rounded-xl border border-transparent px-3 py-3 text-left text-sm transition-colors hover:border-border/60 hover:bg-muted/60"
            );

            if (item.key === "addMedia") {
              return (
                <button
                  className={className}
                  key={item.key}
                  onClick={() => {
                    onOpenChange(false);
                    onAddMedia();
                  }}
                  type="button"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
                    {item.icon}
                  </span>
                  <span>{label}</span>
                </button>
              );
            }

            return (
              <Link
                className={className}
                href={item.href ?? "/studio"}
                key={item.key}
                onClick={() => onOpenChange(false)}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                  {item.icon}
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
