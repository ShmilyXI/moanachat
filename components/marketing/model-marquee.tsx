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
  const doubled = [...items, ...items];
  return (
    <div
      className={`marketing-model-row flex w-max items-center gap-10 ${reverse ? "animate-[marquee-reverse_42s_linear_infinite]" : "animate-[marquee_38s_linear_infinite]"}`}
    >
      {doubled.map(([slug, name], index) => (
        <div
          className="flex items-center gap-3 whitespace-nowrap text-sm text-[var(--color-ink)]/65"
          key={`${slug}-${index}`}
        >
          <span
            className="flex size-7 items-center justify-center opacity-50"
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
      className="relative overflow-hidden bg-[var(--color-paper)] px-6 pb-[104px] pt-24 text-[var(--color-ink)] tablet:px-10 tablet:py-32"
      id="models"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Moana AI
        </p>
        <h2 className="marketing-model-title mt-5 font-serif leading-tight">
          Access leading AI models with your privacy in mind
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-ink)]/65 tablet:text-lg">
          Create text, image, video, code, build agents, and more using fully
          private or anonymized models from leading AI providers.
        </p>
      </div>
      <div className="marketing-model-marquee relative mt-12 space-y-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <ModelRow items={textModels} />
        <ModelRow items={mediaModels} reverse />
      </div>
      <a
        className="mx-auto mt-10 flex w-fit items-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-[var(--color-accent-ink)] transition hover:bg-[var(--color-accent-hover)]"
        href="#capabilities"
      >
        View all models <span aria-hidden>→</span>
      </a>
    </section>
  );
}
