"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    body: "Full access to all AI models and features",
    features: [
      "All AI models (Pro & Advanced)",
      "Unlimited text prompts",
      "1,000 images per day",
      "$1 in credits per month",
      "Hi-res upscaling and watermark removal",
      "Character creation",
      "API access",
    ],
    monthly: 18,
    name: "Pro",
    yearly: 16,
  },
  {
    body: "Everything in Pro, plus massive credit allocation",
    features: [
      "Everything in Pro",
      "$75 in credits per month",
      "10% credit bonus vs. retail",
      "2-month credit banking",
      "Video generation via credits",
      "Higher API limits",
    ],
    monthly: 68,
    name: "Pro+",
    popular: true,
    yearly: 61,
  },
  {
    body: "Maximum power for creators and enterprises",
    features: [
      "Everything in Pro+",
      "$225 in credits per month",
      "12.5% credit bonus vs. retail",
      "3-month credit banking",
      "Highest API limits",
      "Priority support",
    ],
    monthly: 200,
    name: "Max",
    yearly: 180,
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(false);
  return (
    <section
      className="relative bg-[var(--color-paper)] px-6 py-24 text-[var(--color-ink)] tablet:px-8 tablet:py-32"
      id="pricing"
    >
      <div className="marketing-pricing-content mx-auto text-center">
        <p className="marketing-pricing-eyebrow font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
          Pricing
        </p>
        <h2 className="marketing-pricing-title mt-5 font-serif text-2xl tablet:text-4xl">
          Simple pricing. No surprises.
        </h2>
        <p className="marketing-pricing-description mx-auto mt-4 max-w-2xl text-base leading-6 text-[var(--color-ink)]/70 tablet:text-lg">
          Start free, upgrade when you're ready. Every tier includes uncensored
          models and full privacy. Save 10% on annual subscriptions.
        </p>
        <div className="marketing-pricing-controls">
          <a
            className="marketing-pricing-trial inline-flex items-center gap-2 text-sm font-medium text-[var(--color-accent)]"
            href="/chat"
          >
            Try free today <ArrowRight className="size-4" />
          </a>
          <div className="marketing-pricing-toggle inline-flex rounded-full border border-[var(--color-ink)]/10 bg-[var(--color-accent-ink)]/65 shadow-sm">
            <button
              aria-pressed={!yearly}
              className={`rounded-full text-sm font-medium transition-[background-color,color,box-shadow] ${yearly ? "text-[var(--color-ink)]/60" : "bg-[var(--color-accent-ink)] shadow"}`}
              onClick={() => setYearly(false)}
              type="button"
            >
              Monthly
            </button>
            <button
              aria-pressed={yearly}
              className={`rounded-full text-sm font-medium transition-[background-color,color,box-shadow] ${yearly ? "bg-[var(--color-accent-ink)] shadow" : "text-[var(--color-ink)]/60"}`}
              onClick={() => setYearly(true)}
              type="button"
            >
              Yearly{" "}
              <span className="ml-1 text-[var(--color-accent)]">Save 10%</span>
            </button>
          </div>
        </div>
        <div className="mt-10 grid gap-[18px] text-left desktop:grid-cols-3">
          {plans.map((plan) => (
            <article
              className="marketing-pricing-card relative flex flex-col rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-accent-ink)]/75 p-6 shadow-[var(--shadow-card-soft)] tablet:p-7"
              key={plan.name}
            >
              {plan.popular ? (
                <span className="absolute right-6 top-6 rounded-full bg-[var(--color-accent)] px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-[var(--color-accent-ink)]">
                  Most popular
                </span>
              ) : null}
              <h3 className="font-serif text-base leading-5">{plan.name}</h3>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight">
                  ${yearly ? plan.yearly : plan.monthly}
                </span>
                <span className="text-sm text-[var(--color-ink)]/55">/mo</span>
              </div>
              <p className="mt-3 min-h-10 text-sm text-[var(--color-ink)]/65">
                {plan.body}
              </p>
              <a
                className="mt-[22px] flex items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-accent-ink)] transition-[background-color,transform] hover:bg-[var(--color-accent-hover)]"
                href="/sign-up"
              >
                Get {plan.name}
              </a>
              <div className="mt-[22px] space-y-2.5">
                {plan.features.map((feature) => (
                  <p
                    className="flex items-start gap-3 text-sm text-[var(--color-ink)]/80"
                    key={feature}
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--color-accent)]" />
                    {feature}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
