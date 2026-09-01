"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight, ArrowUp, MessageCircle, Music2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
      "Venice's OpenAI-compatible API plugs into any agent stack with function calling, web search, and multimodal generation.",
    icon: "agent",
    title: "Built for Agents",
  },
] as const;

function TextDemo() {
  return (
    <div className="flex h-full flex-col bg-white p-5 text-left tablet:p-8">
      <div className="flex flex-1 flex-col gap-7 overflow-hidden pt-3 text-sm leading-relaxed text-[#0e2942]">
        <p>
          <MessageCircle className="mr-2 inline size-4" />
          Hello! I'm Moana, your private AI assistant. Ask me anything - your
          conversation stays completely private.
        </p>
        <div className="ml-auto max-w-[80%] rounded-full bg-[#bea989]/25 px-4 py-2">
          What is private AI?
        </div>
        <p>
          <MessageCircle className="mr-2 inline size-4" />
          Private AI keeps your prompts yours alone. Nothing is used to train
          public models.
        </p>
      </div>
      <div className="flex items-center rounded-[18px] border border-[#0e2942]/10 bg-[#eeede4] px-4 py-3 text-sm text-[#0e2942]/50">
        Type a message...
        <ArrowUp className="ml-auto size-6 rounded-full bg-[#1260a2] p-1 text-white" />
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
        src="https://media.venice.ai/assets/lp/image/01-venetian-futurism.webp"
      />
      <div className="absolute inset-x-4 bottom-4 flex items-center rounded-[18px] border border-white/30 bg-[#0e2942]/60 px-4 py-3 text-sm text-white backdrop-blur">
        Generate an image privately...
        <ArrowUp className="ml-auto size-6 rounded-full bg-white p-1 text-[#0e2942]" />
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
      />
      <div className="absolute inset-x-4 bottom-4 flex items-center rounded-[18px] border border-white/25 bg-[#0e2942]/60 px-4 py-3 text-sm text-white backdrop-blur">
        A cinematic portrait turning toward camera
        <ArrowUp className="ml-auto size-6 rounded-full bg-white p-1 text-[#0e2942]" />
      </div>
    </div>
  );
}
function AudioDemo() {
  return (
    <div className="flex size-full flex-col justify-between bg-[#b5230b] p-8 text-white">
      <div className="flex justify-end">
        <Music2 className="size-5" />
      </div>
      <div className="flex items-center justify-center gap-8">
        <button
          aria-label="Previous track"
          className="rounded-full border border-white/25 p-3"
          type="button"
        >
          ‹
        </button>
        <button
          aria-label="Play track"
          className="rounded-full border border-white/30 p-5"
          type="button"
        >
          ▶
        </button>
        <button
          aria-label="Next track"
          className="rounded-full border border-white/25 p-3"
          type="button"
        >
          ›
        </button>
      </div>
      <div>
        <audio
          className="w-full"
          controls
          src="https://media.venice.ai/assets/lp/audio/01-opera.mp3"
        />
        <div className="mt-3 flex items-center rounded-[18px] border border-white/25 bg-black/10 px-4 py-3 text-sm">
          Describe the music you want to make...
          <ArrowUp className="ml-auto size-6 rounded-full bg-white p-1 text-[#0e2942]" />
        </div>
      </div>
    </div>
  );
}
function AgentDemo() {
  return (
    <div className="flex size-full flex-col bg-[#f7f6ee] text-left">
      <div className="flex items-center gap-2 border-b border-[#0e2942]/10 px-5 py-4">
        <span className="size-3 rounded-full bg-[#0e2942]/10" />
        <span className="size-3 rounded-full bg-[#0e2942]/10" />
        <span className="size-3 rounded-full bg-[#0e2942]/10" />
        <span className="ml-3 font-mono text-xs text-[#0e2942]/55">
          agent.ts
        </span>
      </div>
      <pre className="flex-1 overflow-auto p-6 font-mono text-xs leading-[1.8] text-[#0e2942]/80 tablet:p-8 tablet:text-sm">
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
    <article className="group grid items-center gap-8 tablet:grid-cols-[34fr_66fr] tablet:gap-12 desktop:gap-16">
      <div className="order-2 flex flex-col items-start tablet:order-1">
        <h3 className="max-w-[450px] font-serif text-2xl leading-tight">
          {item.title}
        </h3>
        <p className="mt-2 max-w-[450px] text-base leading-relaxed text-[#0e2942]/70 tablet:text-lg">
          {item.description}
        </p>
        <a
          className="mt-6 inline-flex items-center gap-3 rounded-lg bg-[#1260a2] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#0d4982]"
          href="/chat"
        >
          {item.cta}
          <ArrowRight className="size-4" />
        </a>
      </div>
      <div className="order-1 aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-[#0e2942]/10 bg-white/60 shadow-[0_34px_120px_rgba(14,41,66,0.16)] tablet:order-2">
        <CapabilityMedia icon={item.icon} />
      </div>
    </article>
  );
}

export function CapabilitiesSection() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
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
      className="bg-[#eeede4] text-[#0e2942]"
      id="capabilities"
      ref={ref}
    >
      <div className="px-6 pb-16 pt-24 tablet:px-8 tablet:pb-20 tablet:pt-32 desktop:hidden">
        <SectionIntro />
      </div>
      <div className="mx-auto flex max-w-[1000px] flex-col gap-24 px-6 pb-24 desktop:hidden">
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
            style={{ opacity: introOpacity }}
          >
            <SectionIntro />
          </motion.div>
          <motion.div
            className="h-full w-full"
            style={{ opacity: contentOpacity, y: contentY }}
          >
            <div className="mx-auto grid h-full w-full max-w-[1400px] grid-cols-[34fr_66fr] items-center gap-12 px-16 py-12 desktop:gap-16">
              <div className="flex min-w-0 flex-col items-start">
                <motion.h3
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-[450px] font-serif text-2xl leading-tight"
                  initial={{ opacity: 0, y: 18 }}
                  key={capabilities[active].title}
                >
                  {capabilities[active].title}
                </motion.h3>
                <p className="mt-2 max-w-[450px] text-lg leading-relaxed text-[#0e2942]/70">
                  {capabilities[active].description}
                </p>
                <a
                  className="mt-6 inline-flex items-center gap-3 rounded-lg bg-[#1260a2] px-4 py-3 text-sm font-medium text-white"
                  href="/chat"
                >
                  {capabilities[active].cta}
                  <ArrowRight className="size-4" />
                </a>
              </div>
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="aspect-[4/3] w-full overflow-hidden rounded-[28px] border border-[#0e2942]/10 bg-white/60 shadow-[0_34px_120px_rgba(14,41,66,0.16)]"
                initial={{ opacity: 0, scale: 0.97 }}
                key={capabilities[active].icon}
                transition={{ duration: 0.4 }}
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
                className={`relative w-2 overflow-hidden rounded-full p-0 transition-all ${active === index ? "h-10 bg-[#bea989]/30" : "h-2 bg-[#0e2942]/15"}`}
                key={item.title}
                onClick={() => setActive(index)}
                type="button"
              >
                {active === index ? (
                  <span className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-[#bea989]" />
                ) : null}
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
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#1260a2]">
        Capabilities
      </p>
      <h2 className="font-serif text-4xl leading-tight tablet:text-5xl">
        Uncensored AI chat, images, video, and more
      </h2>
      <p className="max-w-2xl text-base leading-relaxed text-[#0e2942]/70 tablet:text-lg">
        Text, image, video, audio, code, and search in one place, all private or
        anonymous.
      </p>
    </div>
  );
}
