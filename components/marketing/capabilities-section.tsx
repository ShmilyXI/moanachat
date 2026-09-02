"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  MessageCircle,
  Music2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const capabilities = [
  {
    cta: "Chat Now",
    description:
      "Chat, reason, write, and build with powerful open-source language models. Uncensored and private.",
    icon: "message",
    title: "Text Generation",
  },
  {
    cta: "Create Images",
    description:
      "Generate, edit, upscale, and remove backgrounds. From photorealism to abstract art, any style you can imagine.",
    icon: "image",
    title: "Image Generation",
  },
  {
    cta: "Create Videos",
    description:
      "Create videos from text or images with access to Sora, Kling, Runway, Veo, and more cutting-edge models.",
    icon: "video",
    title: "Video Generation",
  },
  {
    cta: "Generate Audio",
    description:
      "Use text-to-speech voices, music generation, and sound effects for studio-quality audio workflows.",
    icon: "music",
    title: "Audio & Music",
  },
  {
    cta: "Learn More",
    description:
      "Moana's OpenAI-compatible API plugs into any agent stack with function calling, web search, and multimodal generation.",
    icon: "agent",
    title: "Built for Agents",
  },
] as const;

function TextDemo() {
  return (
    <div className="flex h-full flex-col bg-[var(--color-accent-ink)] p-5 text-left text-[var(--color-ink)] tablet:p-8">
      <div className="flex flex-1 flex-col gap-7 overflow-hidden pt-3 text-sm leading-relaxed">
        <p>
          <MessageCircle className="mr-2 inline size-4" />
          Hello! I'm Moana, your private AI assistant. Ask me anything - your
          conversation stays completely private.
        </p>
        <div className="ml-auto max-w-[80%] rounded-full bg-[var(--color-sand)]/25 px-4 py-2">
          What is private AI?
        </div>
        <p>
          <MessageCircle className="mr-2 inline size-4" />
          Private AI keeps your prompts yours alone. Nothing is used to train
          public models.
        </p>
      </div>
      <div className="flex items-center rounded-[var(--radius-panel)] border border-[var(--color-ink)]/10 bg-[var(--color-paper)] px-4 py-3 text-sm text-[var(--color-ink)]/50">
        Type a message...
        <ArrowUp className="ml-auto size-6 rounded-full bg-[var(--color-accent)] p-1 text-[var(--color-accent-ink)]" />
      </div>
    </div>
  );
}
function ImageDemo() {
  return (
    <div className="relative size-full overflow-hidden">
      <img
        alt="AI generated abstract portrait"
        className="size-full object-cover"
        decoding="async"
        height={768}
        loading="lazy"
        src="https://media.venice.ai/assets/lp/image/01-venetian-futurism.webp"
        width={1024}
      />
      <div className="absolute inset-x-4 bottom-4 flex items-center rounded-[var(--radius-panel)] border border-[var(--color-accent-ink)]/30 bg-[var(--color-ink)]/60 px-4 py-3 text-sm text-[var(--color-accent-ink)] backdrop-blur">
        Generate an image privately...
        <ArrowUp className="ml-auto size-6 rounded-full bg-[var(--color-accent-ink)] p-1 text-[var(--color-ink)]" />
      </div>
    </div>
  );
}
function VideoDemo() {
  return (
    <div className="relative size-full overflow-hidden">
      <video
        autoPlay
        className="size-full object-cover"
        loop
        muted
        playsInline
        preload="metadata"
        src="https://media.venice.ai/assets/lp/video/01-cinematic-portrait.mp4"
        width={1024}
        height={768}
      />
      <div className="absolute inset-x-4 bottom-4 flex items-center rounded-[var(--radius-panel)] border border-[var(--color-accent-ink)]/25 bg-[var(--color-ink)]/60 px-4 py-3 text-sm text-[var(--color-accent-ink)] backdrop-blur">
        A cinematic portrait turning toward camera
        <ArrowUp className="ml-auto size-6 rounded-full bg-[var(--color-accent-ink)] p-1 text-[var(--color-ink)]" />
      </div>
    </div>
  );
}
function AudioDemo() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const toggleTrack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (audio.paused) {
      audio.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false)
      );
      return;
    }

    audio.pause();
    setIsPlaying(false);
  }, []);

  const resetTrack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const handleTrackStarted = useCallback(() => setIsPlaying(true), []);
  const handleTrackStopped = useCallback(() => setIsPlaying(false), []);

  return (
    <div
      className="marketing-audio-demo flex size-full flex-col justify-between bg-[var(--color-signal)] p-8 text-[var(--color-signal-ink)]"
      data-audio-demo
    >
      <div className="flex justify-end">
        <Music2 className="size-5" />
      </div>
      <div className="flex items-center justify-center gap-8">
        <button
          aria-label="Previous track"
          className="grid size-12 place-items-center rounded-full border border-[var(--color-signal-ink)]/25 transition-colors hover:bg-[var(--color-signal-ink)]/10"
          onClick={resetTrack}
          type="button"
        >
          <SkipBack className="size-5" />
        </button>
        <button
          aria-label={isPlaying ? "Pause track" : "Play track"}
          className="grid size-20 place-items-center rounded-full border border-[var(--color-signal-ink)]/30 transition-colors hover:bg-[var(--color-signal-ink)]/10"
          onClick={toggleTrack}
          type="button"
        >
          {isPlaying ? (
            <Pause className="size-7" />
          ) : (
            <Play className="ml-1 size-7" />
          )}
        </button>
        <button
          aria-label="Next track"
          className="grid size-12 place-items-center rounded-full border border-[var(--color-signal-ink)]/25 transition-colors hover:bg-[var(--color-signal-ink)]/10"
          onClick={resetTrack}
          type="button"
        >
          <SkipForward className="size-5" />
        </button>
      </div>
      <div>
        {/* The visible prompt and controls describe this decorative audio demo. */}
        {/* biome-ignore lint/a11y/useMediaCaption: Decorative demo audio has no spoken content. */}
        <audio
          className="absolute size-px opacity-0"
          onEnded={handleTrackStopped}
          onPause={handleTrackStopped}
          onPlay={handleTrackStarted}
          ref={audioRef}
          src="https://media.venice.ai/assets/lp/audio/01-opera.mp3"
        />
        <div className="mt-3 flex items-center rounded-[var(--radius-panel)] border border-[var(--color-signal-ink)]/25 bg-[var(--color-ink)]/10 px-4 py-3 text-sm">
          Describe the music you want to make...
          <ArrowUp className="ml-auto size-6 rounded-full bg-[var(--color-signal-ink)] p-1 text-[var(--color-ink)]" />
        </div>
      </div>
    </div>
  );
}
function AgentDemo() {
  return (
    <div className="flex size-full flex-col bg-[var(--color-paper-2)] text-left text-[var(--color-ink)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-ink)]/10 px-5 py-4">
        <span className="font-mono text-xs text-[var(--color-ink)]/55">
          agent.ts
        </span>
      </div>
      <pre className="flex-1 overflow-auto p-6 font-mono text-xs leading-[1.8] text-[var(--color-ink)]/80 tablet:p-8 tablet:text-sm">
        <code>{`const response = await moana.chat({\n  model: "private-large",\n  tools: [{ type: "web_search" }],\n  messages: [{\n    role: "user",\n    content: "Research a topic"\n  }]\n});`}</code>
      </pre>
    </div>
  );
}

function CapabilityMedia({
  icon,
}: {
  icon: (typeof capabilities)[number]["icon"];
}) {
  if (icon === "message") {
    return <TextDemo />;
  }
  if (icon === "image") {
    return <ImageDemo />;
  }
  if (icon === "video") {
    return <VideoDemo />;
  }
  if (icon === "music") {
    return <AudioDemo />;
  }
  return <AgentDemo />;
}

function CapabilityCard({ item }: { item: (typeof capabilities)[number] }) {
  return (
    <article className="marketing-capability-card group grid items-center gap-8 desktop:grid-cols-[minmax(0,34fr)_minmax(0,66fr)] desktop:gap-16">
      <div className="marketing-capability-card__copy order-2 flex flex-col items-start tablet:order-1">
        <h3 className="max-w-[450px] font-serif text-xl leading-tight tablet:text-2xl">
          {item.title}
        </h3>
        <p className="mt-2 max-w-[450px] text-base leading-relaxed text-[var(--color-ink)]/70 tablet:text-lg">
          {item.description}
        </p>
        <a
          className="mt-6 inline-flex items-center gap-3 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-[var(--color-accent-ink)] transition hover:bg-[var(--color-accent-hover)]"
          href="/chat"
        >
          {item.cta}
          <ArrowRight className="size-4" />
        </a>
      </div>
      <div className="order-1 aspect-[4/3] w-full min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-accent-ink)]/60 shadow-[var(--shadow-media)] tablet:order-2">
        <CapabilityMedia icon={item.icon} />
      </div>
    </article>
  );
}

export function CapabilitiesSection() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const reducedMotion = useReducedMotion();
  const scrollYProgress = useMotionValue(0);
  const introOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0.08, 0.16], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0.08, 0.16], [80, 0]);

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(".marketing-home");
    const section = ref.current;
    if (!container || !section) {
      return;
    }
    const update = () => {
      const range = Math.max(1, section.offsetHeight - container.clientHeight);
      const value = Math.max(
        0,
        Math.min(1, -section.getBoundingClientRect().top / range)
      );
      scrollYProgress.set(value);
      const progress = Math.max(0, Math.min(1, (value - 0.16) / 0.72));
      setActive(
        Math.min(
          capabilities.length - 1,
          Math.floor(progress * capabilities.length)
        )
      );
    };
    const timer = window.setInterval(update, 100);
    update();
    return () => window.clearInterval(timer);
  }, [scrollYProgress]);

  return (
    <section
      className="bg-[var(--color-paper)] text-[var(--color-ink)]"
      id="capabilities"
      ref={ref}
    >
      <div className="marketing-capabilities-intro px-6 pb-16 pt-24 tablet:px-8 tablet:pb-20 tablet:pt-24 desktop:hidden">
        <SectionIntro />
      </div>
      <div className="marketing-capabilities-list mx-auto flex max-w-[1000px] flex-col gap-24 px-6 pb-24 tablet:gap-28 tablet:px-8 desktop:hidden">
        {capabilities.map((item) => (
          <CapabilityCard item={item} key={item.title} />
        ))}
      </div>
      <div
        className="relative hidden desktop:block"
        style={{ height: `${(1.45 * capabilities.length + 1.5) * 100}vh` }}
      >
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-8"
            style={{ opacity: reducedMotion ? 1 : introOpacity }}
          >
            <SectionIntro />
          </motion.div>
          <motion.div
            className="h-full w-full"
            style={{
              opacity: reducedMotion ? 1 : contentOpacity,
              y: reducedMotion ? 0 : contentY,
            }}
          >
            <div className="mx-auto grid h-full w-full max-w-[1400px] grid-cols-[minmax(0,34fr)_minmax(0,66fr)] items-center gap-12 px-16 py-12 desktop:gap-16">
              <div className="flex min-w-0 flex-col items-start">
                <motion.h3
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-[450px] font-serif text-xl leading-tight tablet:text-2xl"
                  initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                  key={capabilities[active].title}
                >
                  {capabilities[active].title}
                </motion.h3>
                <p className="mt-2 max-w-[450px] text-lg leading-relaxed text-[var(--color-ink)]/70">
                  {capabilities[active].description}
                </p>
                <a
                  className="mt-6 inline-flex items-center gap-3 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-[var(--color-accent-ink)]"
                  href="/chat"
                >
                  {capabilities[active].cta}
                  <ArrowRight className="size-4" />
                </a>
              </div>
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-[4/3] w-full min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-accent-ink)]/60 shadow-[var(--shadow-media)]"
                initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
                key={capabilities[active].icon}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.4 }}
              >
                <CapabilityMedia icon={capabilities[active].icon} />
              </motion.div>
            </div>
          </motion.div>
          <div className="absolute right-6 top-1/2 flex -translate-y-1/2 flex-col items-center gap-2">
            {capabilities.map((item, index) => (
              <button
                aria-label={`Show ${item.title}`}
                aria-pressed={active === index}
                  className="marketing-capability-dot relative flex size-11 items-center justify-center rounded-full p-0"
                  key={item.title}
                  onClick={() => setActive(index)}
                  type="button"
                >
                  <span
                    className={`block size-2 rounded-full transition-[background-color,transform,opacity] ${active === index ? "scale-y-[5] bg-[var(--color-sand)]" : "bg-[var(--color-ink)]/15"}`}
                  />
                </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionIntro() {
  return (
    <div className="mx-auto flex max-w-[1000px] flex-col items-center gap-4 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
        Capabilities
      </p>
      <h2 className="font-serif text-2xl leading-tight tablet:text-4xl">
        Uncensored AI chat, images, video, and more
      </h2>
      <p className="max-w-2xl text-base leading-relaxed text-[var(--color-ink)]/70 tablet:text-lg">
        Text, image, video, audio, code, and search in one place, all private or
        anonymous.
      </p>
    </div>
  );
}
