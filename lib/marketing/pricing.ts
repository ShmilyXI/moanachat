export type BillingCycle = "monthly" | "yearly";

export type MarketingPlan = {
  slug: "max" | "plus" | "pro";
  name: string;
  body: string;
  monthly: number;
  yearly: number;
  popular?: boolean;
  features: string[];
};

export const marketingPlans: MarketingPlan[] = [
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
    slug: "pro",
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
    slug: "plus",
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
    slug: "max",
    yearly: 180,
  },
];

export const billingCycles: BillingCycle[] = ["monthly", "yearly"];

export function getPlanBySlug(slug: string): MarketingPlan | undefined {
  return marketingPlans.find((plan) => plan.slug === slug);
}

export function isBillingCycle(value: string): value is BillingCycle {
  return (billingCycles as string[]).includes(value);
}

export function checkoutHref(slug: string, cycle: BillingCycle): string {
  return `/checkout/${slug}/${cycle}`;
}
