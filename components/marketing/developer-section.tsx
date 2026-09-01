"use client";

import { ArrowRight, Terminal } from "lucide-react";
import { useState } from "react";

const snippets = {
  Image: `const image = await moana.images.generate({\n  model: "image-ultra",\n  prompt: "A Venetian sunset",\n  width: 1024,\n  height: 1024,\n});`,
  Music: `const track = await moana.music.generate({\n  model: "music-pro",\n  prompt: "A cinematic score with sweeping strings",\n});`,
  Text: `const response = await fetch("https://api.moana.ai/api/v1/chat/completions", {\n  method: "POST",\n  headers: {\n    Authorization: \`Bearer \${key}\`,\n    "Content-Type": "application/json",\n  },\n  body: JSON.stringify({\n    model: "private-large",\n    messages: [{ role: "user", content: "Latest AI news" }],\n  }),\n});`,
  Video: `const video = await moana.video.generate({\n  model: "video-pro",\n  prompt: "A hummingbird hovering in slow motion",\n  duration: 5,\n});`,
};

export function DeveloperSection() {
  const [tab, setTab] = useState<keyof typeof snippets>("Text");
  return (
    <section
      className="relative overflow-hidden bg-[var(--color-paper)] px-6 py-24 text-[var(--color-ink)] tablet:px-8 tablet:py-32"
      id="developers"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: "url(https://venice.ai/images/repeating-block.svg)",
          backgroundPosition: "center top",
          backgroundSize: "150px 150px",
        }}
      />
      <div className="relative z-10 mx-auto flex max-w-[1000px] flex-col items-center text-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Developer API
        </p>
        <h2 className="mt-5 font-serif text-4xl tablet:text-5xl">
          One API for Everything
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-ink)]/70 tablet:text-lg">
          Text, images, video, music, speech, embeddings, and web tools through
          a single industry-standard API. One key. Zero data retention.
        </p>
        <div className="mt-12 flex h-[420px] w-full max-w-[700px] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--color-ink)]/10 bg-[var(--color-paper-2)] text-left shadow-[var(--shadow-code)] tablet:h-[480px]">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-ink)]/10 bg-[var(--color-ink)]/[0.035] px-5 py-4">
            <div className="flex items-center gap-2">
              <Terminal className="size-4 text-[var(--color-ink)]/50" />
              <span className="font-mono text-xs text-[var(--color-ink)]/60">
                {tab.toLowerCase()}.ts
              </span>
            </div>
            <div className="flex gap-1">
              {(Object.keys(snippets) as (keyof typeof snippets)[]).map(
                (name) => (
                  <button
                    aria-pressed={tab === name}
                    className={`rounded-[var(--radius-control)] px-2 py-1 text-[11px] font-medium ${tab === name ? "bg-[var(--color-ink)]/10" : "text-[var(--color-ink)]/60"}`}
                    key={name}
                    onClick={() => setTab(name)}
                    type="button"
                  >
                    {name}
                  </button>
                )
              )}
            </div>
          </div>
          <pre className="m-0 flex-1 overflow-auto p-5 font-mono text-xs leading-[1.8] text-[var(--color-ink)]/80 tablet:p-6 tablet:text-sm">
            <code>{snippets[tab]}</code>
            <span className="ml-1 inline-block animate-pulse text-[var(--color-accent)]">
              ▎
            </span>
          </pre>
        </div>
        <a
          className="mt-10 inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-[var(--color-accent-ink)]"
          href="/chat"
        >
          Explore API Docs <ArrowRight className="size-4" />
        </a>
      </div>
    </section>
  );
}
