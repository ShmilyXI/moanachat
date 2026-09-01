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
    <section className="relative overflow-hidden bg-[#f7f6ee] px-6 py-24 text-[#0e2942] tablet:px-8 tablet:py-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "url(https://venice.ai/images/repeating-block.svg)",
          backgroundPosition: "center top",
          backgroundSize: "150px 150px",
        }}
      />
      <div className="relative z-10 mx-auto max-w-[1000px]">
        <div className="flex flex-col items-center text-center">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#1260a2]">
            Privacy Architecture
          </p>
          <h2 className="mt-5 font-serif text-4xl tablet:text-5xl">
            AI that respects your privacy
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#0e2942]/70 tablet:text-lg">
            While others log and analyze your prompts, Moana ensures your
            conversations remain yours alone.
          </p>
        </div>
        <div className="relative mx-auto mt-16 max-w-[720px]">
          {layers.map(([tier, title, body, Icon], index) => (
            <article
              className="relative flex gap-6 pb-12 last:pb-0 tablet:gap-7"
              key={title}
            >
              <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full border border-[#0e2942]/10 bg-[#f7f6ee] text-[#bea989] shadow-[0_8px_30px_rgba(14,41,66,0.07)]">
                <Icon className="size-6" />
                {index < layers.length - 1 ? (
                  <span className="absolute left-1/2 top-full h-12 w-px -translate-x-1/2 bg-[#0e2942]/15" />
                ) : null}
              </div>
              <div className="pt-1">
                <p className="font-mono text-xs uppercase tracking-wide text-[#1260a2]">
                  {tier}
                </p>
                <h3 className="mt-2 font-serif text-2xl">{title}</h3>
                <p className="mt-2 max-w-xl text-base leading-relaxed text-[#0e2942]/65">
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
