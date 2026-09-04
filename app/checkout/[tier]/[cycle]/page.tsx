import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import {
  type BillingCycle,
  billingCycles,
  getPlanBySlug,
  isBillingCycle,
} from "@/lib/marketing/pricing";

export const metadata: Metadata = {
  description: "Review your Moana plan and create an account to continue.",
  title: "Checkout | Moana",
};

export function generateStaticParams() {
  return ["pro", "plus", "max"].flatMap((tier) =>
    billingCycles.map((cycle) => ({ cycle, tier }))
  );
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ cycle: string; tier: string }>;
}) {
  const { cycle, tier } = await params;
  const plan = getPlanBySlug(tier);
  if (!plan || !isBillingCycle(cycle)) {
    notFound();
  }

  const billing: BillingCycle = cycle;
  const price = billing === "yearly" ? plan.yearly : plan.monthly;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-paper)] text-[var(--color-ink)]">
      <MarketingHeader navVisible />
      <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-28 tablet:px-8 tablet:pt-32">
        <div className="w-full max-w-[520px]">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Checkout
          </p>
          <h1 className="mt-4 font-serif text-2xl leading-tight tablet:text-4xl">
            Get {plan.name}.{" "}
            <span className="text-[var(--color-ink)]/55">Privately.</span>
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--color-ink)]/70">
            {plan.body}
          </p>

          <div className="marketing-checkout-card mt-8 rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-accent-ink)]/75 p-6 shadow-[var(--shadow-card-soft)] tablet:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-base leading-5">{plan.name}</h2>
              <div
                className="marketing-checkout-cycle inline-flex rounded-full border border-[var(--color-ink)]/10 bg-[var(--color-paper-2)] p-0.5"
                data-checkout-cycle
              >
                {billingCycles.map((option) => (
                  <a
                    aria-current={billing === option ? "true" : undefined}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-[background-color,color] ${billing === option ? "bg-[var(--color-accent)] text-[var(--color-accent-ink)]" : "text-[var(--color-ink)]/60"}`}
                    href={`/checkout/${plan.slug}/${option}`}
                    key={option}
                  >
                    {option === "yearly" ? "Yearly" : "Monthly"}
                  </a>
                ))}
              </div>
            </div>
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-5xl font-semibold tracking-tight">
                ${price}
              </span>
              <span className="text-sm text-[var(--color-ink)]/55">/mo</span>
            </div>
            <p className="mt-2 text-sm text-[var(--color-ink)]/60">
              {billing === "yearly"
                ? `Billed annually — save 10% vs. the $${plan.monthly}/mo monthly plan.`
                : "Billed monthly. Switch to yearly anytime to save 10%."}
            </p>
            <div className="mt-6 space-y-2.5">
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
            <a
              className="mt-7 flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-3 text-sm font-medium text-[var(--color-accent-ink)] transition hover:bg-[var(--color-accent-hover)]"
              data-testid="checkout-continue"
              href="/sign-up"
            >
              Continue to sign up <ArrowRight className="size-4" />
            </a>
            <p className="mt-3 text-center text-xs text-[var(--color-ink)]/55">
              Billing is not wired up yet — this reserved checkout flow leads to
              account creation.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm">
            <a
              className="inline-flex items-center gap-1.5 text-[var(--color-ink)]/60 transition hover:text-[var(--color-ink)]"
              href="/#pricing"
            >
              <ArrowLeft className="size-4" /> Back to pricing
            </a>
            <a
              className="inline-flex items-center gap-1.5 font-medium text-[var(--color-accent)]"
              href="/chat"
            >
              Try free today <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
