import { Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

const layers = [
  [
    "Tier 1",
    "Anonymized",
    "Access premier third-party models. All identifying metadata is stripped before processing.",
    Eye,
  ],
  [
    "Tier 2",
    "Private",
    "Zero data retention on self-hosted open-source models. Your prompts are never stored.",
    EyeOff,
  ],
  [
    "Tier 3",
    "TEE (Trusted Execution)",
    "Hardware-secured enclaves ensure Moana itself cannot access your computation.",
    LockKeyhole,
  ],
  [
    "Tier 4",
    "End-to-End Encrypted",
    "Client-side encryption. Your prompts are encrypted before leaving your device. Only TEE decrypts.",
    ShieldCheck,
  ],
] as const;

export function PrivacySection() {
  return (
    <section
      className="relative overflow-hidden bg-[var(--color-paper-2)] px-6 py-[100px] text-[var(--color-ink)] tablet:px-8 tablet:py-32"
      id="privacy"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "url(https://venice.ai/images/repeating-block.svg)",
          backgroundPosition: "center top",
          backgroundSize: "150px 150px",
        }}
      />
      <div className="relative z-10 mx-auto max-w-[1000px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Privacy Architecture
          </p>
          <h2 className="font-serif text-2xl leading-[1.33] tablet:text-4xl">
            AI that respects your privacy
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-ink)]/70 tablet:text-lg">
            While others log and analyze your prompts, Moana ensures your
            conversations remain yours alone.
          </p>
        </div>
        <div className="relative mx-auto mt-[72px] flex max-w-[720px] flex-col gap-7">
          {layers.map(([tier, title, body, Icon]) => (
            <article
              className="marketing-privacy-item relative flex items-start gap-6"
              key={title}
            >
              <div className="marketing-privacy-icon relative flex size-16 shrink-0 items-center justify-center rounded-full border border-[var(--color-ink)]/10 bg-[var(--color-paper-2)] text-[var(--color-sand)] shadow-[var(--shadow-icon)]">
                <Icon className="size-6" />
              </div>
              <div className="marketing-privacy-copy min-w-0 pt-[3px]">
                <p className="font-mono text-xs uppercase tracking-wide text-[var(--color-accent)]">
                  {tier}
                </p>
                <h3 className="mt-1 font-serif text-2xl leading-none">{title}</h3>
                <p className="mt-2 max-w-xl text-base leading-[1.35] text-[var(--color-ink)]/65">
                  {body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
