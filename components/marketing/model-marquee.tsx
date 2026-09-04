const textModels = [
  ["openai", "OpenAI"],
  ["mistral", "Mistral"],
  ["meta", "Meta"],
  ["qwen", "Qwen"],
  ["grok", "Grok"],
  ["kimi", "Kimi"],
  ["BlackForestLabs", "Black Forest Labs"],
  ["nvidia", "NVIDIA"],
  ["claude", "Claude"],
  ["google", "Google"],
  ["deepseek", "DeepSeek"],
];
const mediaModels = [
  ["gemma", "Gemma"],
  ["kling", "Kling"],
  ["arcee-ai", "Arcee"],
  ["pixversevideo", "PixVerse"],
  ["vidu", "Vidu"],
  ["elevenlabs", "ElevenLabs"],
  ["runway", "Runway"],
  ["bytedance", "Bytedance"],
  ["minimax", "MiniMax"],
  ["inception", "Inception"],
  ["glm", "GLM"],
];

function ModelRow({
  items,
  reverse = false,
}: {
  items: string[][];
  reverse?: boolean;
}) {
  const doubled = [
    ...items.map(([slug, name]) => ({ copy: "primary", name, slug })),
    ...items.map(([slug, name]) => ({ copy: "duplicate", name, slug })),
  ];
  return (
    <div
      className={`marketing-model-row flex w-max items-center gap-4 ${reverse ? "animate-[marquee-reverse_42s_linear_infinite]" : "animate-[marquee_38s_linear_infinite]"}`}
    >
      {doubled.map(({ copy, name, slug }) => (
        <div
          className="marketing-model-item flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-5 py-2.5 text-sm text-[var(--color-ink)]/65"
          key={`${slug}-${name}-${copy}`}
        >
          <span
            className="flex size-6 items-center justify-center opacity-50"
            style={{
              backgroundImage: `url(https://venice.ai/images/icons/models/${slug}.svg)`,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
            }}
          />
          <span>{name}</span>
        </div>
      ))}
    </div>
  );
}

export function ModelMarquee() {
  return (
    <section
      className="relative overflow-hidden bg-[var(--color-paper)] px-0 py-24 text-[var(--color-ink)] tablet:py-32"
      id="models"
    >
      <div className="marketing-model-intro mx-auto max-w-5xl px-6 text-center tablet:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Moana AI
        </p>
        <h2 className="marketing-model-title font-serif">
          Access leading AI models with your privacy in mind
        </h2>
        <p className="marketing-model-description mx-auto max-w-2xl text-base text-[var(--color-ink)]/65 tablet:text-lg">
          Create text, image, video, code, build agents, and more using fully
          private or anonymized models from leading AI providers.
        </p>
      </div>
      <div className="marketing-model-marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <ModelRow items={textModels} />
        <ModelRow items={mediaModels} reverse />
      </div>
      <div className="marketing-model-cta flex justify-center">
        <a
          className="flex items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-6 py-3.5 text-base font-medium leading-none text-[var(--color-accent-ink)] transition hover:bg-[var(--color-accent-hover)]"
          href="/models"
        >
          View All Models <span aria-hidden>→</span>
        </a>
      </div>
    </section>
  );
}
