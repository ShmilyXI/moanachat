import type { Metadata } from "next";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import {
  type CatalogModel,
  ModelsCatalog,
} from "@/components/marketing/models-catalog";
import { chatModels, getCapabilities } from "@/lib/ai/models";

export const metadata: Metadata = {
  description:
    "Browse the private and anonymized models available on Moana — text, reasoning, vision, and tool use.",
  title: "Models | Moana",
};

export default async function ModelsPage() {
  const capabilities = await getCapabilities();
  const models: CatalogModel[] = chatModels.map((model) => ({
    capabilities: capabilities[model.id],
    description: model.description,
    id: model.id,
    name: model.name,
    provider: model.provider,
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-paper)] text-[var(--color-ink)]">
      <MarketingHeader navVisible />
      <main className="flex-1 px-6 pb-24 pt-28 tablet:px-8 tablet:pt-32">
        <div className="mx-auto mb-12 flex max-w-[1000px] flex-col items-center gap-4 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Models
          </p>
          <h1 className="font-serif text-2xl leading-tight tablet:text-4xl">
            Every model, one private interface
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[var(--color-ink)]/70 tablet:text-lg">
            Chat, reason, see, and build with tools across leading providers —
            all through one private or anonymized interface.
          </p>
          <p className="flex items-center gap-2 text-xs text-[var(--color-ink)]/50">
            Powered by
            <ModelSelectorLogo
              className="size-4 opacity-70"
              provider="openai"
            />
            <ModelSelectorLogo
              className="size-4 opacity-70"
              provider="moonshotai"
            />
            <ModelSelectorLogo
              className="size-4 opacity-70"
              provider="deepseek"
            />
            <ModelSelectorLogo className="size-4 opacity-70" provider="xai" />
            and the open model ecosystem
          </p>
        </div>
        <ModelsCatalog models={models} />
      </main>
      <MarketingFooter />
    </div>
  );
}
