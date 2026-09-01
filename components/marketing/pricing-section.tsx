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
      className="relative bg-[#eeede4] px-6 py-24 text-[#0e2942] tablet:px-8 tablet:py-32"
      id="pricing"
    >
      <div className="mx-auto max-w-[1200px] text-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#1260a2]">
          Pricing
        </p>
        <h2 className="mt-5 font-serif text-4xl tablet:text-5xl">
          Simple pricing. No surprises.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#0e2942]/70 tablet:text-lg">
          Start free, upgrade when you're ready. Every tier includes uncensored
          models and full privacy. Save 10% on annual subscriptions.
        </p>
        <a
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#1260a2]"
          href="/chat"
        >
          Try free today <ArrowRight className="size-4" />
        </a>
        <div className="mx-auto mt-10 inline-flex rounded-full border border-[#0e2942]/10 bg-white/65 p-1 shadow-sm">
          <button
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${yearly ? "text-[#0e2942]/60" : "bg-white shadow"}`}
            onClick={() => setYearly(false)}
            type="button"
          >
            Monthly
          </button>
          <button
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${yearly ? "bg-white shadow" : "text-[#0e2942]/60"}`}
            onClick={() => setYearly(true)}
            type="button"
          >
            Yearly <span className="ml-1 text-[#1260a2]">Save 10%</span>
          </button>
        </div>
        <div className="mt-10 grid gap-5 text-left desktop:grid-cols-3">
          {plans.map((plan) => (
            <article
              className="relative flex min-h-[470px] flex-col rounded-[24px] border border-[#0e2942]/10 bg-white/75 p-6 shadow-[0_18px_65px_rgba(14,41,66,0.08)] tablet:p-7"
              key={plan.name}
            >
              {plan.popular ? (
                <span className="absolute right-6 top-6 rounded-full bg-[#1260a2] px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
                  Most popular
                </span>
              ) : null}
              <h3 className="font-serif text-2xl">{plan.name}</h3>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight">
                  ${yearly ? plan.yearly : plan.monthly}
                </span>
                <span className="text-sm text-[#0e2942]/55">/mo</span>
              </div>
              <p className="mt-3 min-h-10 text-sm text-[#0e2942]/65">
                {plan.body}
              </p>
              <a
                className="mt-7 flex items-center justify-center rounded-lg bg-[#1260a2] px-4 py-3 text-xs font-medium uppercase tracking-wide text-white transition hover:bg-[#0d4982]"
                href="/sign-up"
              >
                Get {plan.name}
              </a>
              <div className="mt-6 space-y-3 border-t border-[#0e2942]/10 pt-6">
                {plan.features.map((feature) => (
                  <p
                    className="flex items-start gap-3 text-sm text-[#0e2942]/80"
                    key={feature}
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-[#1260a2]" />
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
