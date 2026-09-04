"use client";

import { Brain, Eye, MessageSquare, Search, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";

export type CatalogModel = {
  description: string;
  id: string;
  name: string;
  provider: string;
  capabilities?: {
    capabilitiesKnown?: boolean;
    reasoning: boolean;
    tools: boolean;
    vision: boolean;
  };
};

const providerNames: Record<string, string> = {
  deepseek: "DeepSeek",
  moonshotai: "Moonshot",
  openai: "OpenAI",
  xai: "xAI",
};

const filters = [
  { id: "all", label: "All models" },
  { id: "reasoning", label: "Reasoning" },
  { id: "tools", label: "Tools" },
  { id: "vision", label: "Vision" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function matchesFilter(model: CatalogModel, filter: FilterId): boolean {
  if (filter === "all") {
    return true;
  }
  return Boolean(model.capabilities?.[filter]);
}

export function ModelsCatalog({ models }: { models: CatalogModel[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return models.filter((model) => {
      if (!matchesFilter(model, filter)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return (
        model.name.toLowerCase().includes(needle) ||
        model.description.toLowerCase().includes(needle) ||
        (providerNames[model.provider] ?? model.provider)
          .toLowerCase()
          .includes(needle)
      );
    });
  }, [filter, models, query]);

  return (
    <div className="mx-auto w-full max-w-[1000px]">
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <label className="relative block w-full max-w-[360px]">
          <span className="sr-only">Search models</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink)]/40" />
          <input
            className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-ink)]/12 bg-[var(--color-paper-2)] pl-10 pr-4 text-sm text-[var(--color-ink)] outline-2 outline-transparent placeholder:text-[var(--color-ink)]/45 focus-visible:outline-[var(--color-accent)]"
            data-testid="models-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search models..."
            type="search"
            value={query}
          />
        </label>
        <div className="flex flex-wrap gap-1.5" data-testid="models-filters">
          {filters.map((item) => (
            <button
              aria-pressed={filter === item.id}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${filter === item.id ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-accent-ink)]" : "border-[var(--color-ink)]/15 text-[var(--color-ink)]/65 hover:border-[var(--color-ink)]/30 hover:text-[var(--color-ink)]"}`}
              key={item.id}
              onClick={() => setFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p
        className="mt-6 font-mono text-xs text-[var(--color-ink)]/50"
        data-testid="models-count"
      >
        {visible.length} {visible.length === 1 ? "model" : "models"}
      </p>

      <div className="mt-4 grid gap-[18px] text-left tablet:grid-cols-2">
        {visible.map((model) => (
          <article
            className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-ink)]/10 bg-[var(--color-accent-ink)]/75 p-6 shadow-[var(--shadow-card-soft)]"
            data-testid="model-card"
            key={model.id}
          >
            <div className="flex items-center gap-3">
              <ModelSelectorLogo
                className="size-8 rounded-full bg-[var(--color-paper-2)] p-1 ring-1 ring-[var(--color-ink)]/10"
                provider={model.provider}
              />
              <div className="min-w-0">
                <h3 className="truncate font-serif text-base leading-5">
                  {model.name}
                </h3>
                <p className="text-xs text-[var(--color-ink)]/55">
                  {providerNames[model.provider] ?? model.provider}
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink)]/70">
              {model.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {model.capabilities?.reasoning ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ink)]/12 px-2.5 py-1 text-[11px] text-[var(--color-ink)]/65">
                  <Brain className="size-3" /> Reasoning
                </span>
              ) : null}
              {model.capabilities?.vision ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ink)]/12 px-2.5 py-1 text-[11px] text-[var(--color-ink)]/65">
                  <Eye className="size-3" /> Vision
                </span>
              ) : null}
              {model.capabilities?.tools ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ink)]/12 px-2.5 py-1 text-[11px] text-[var(--color-ink)]/65">
                  <Wrench className="size-3" /> Tools
                </span>
              ) : null}
            </div>
            <a
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-[var(--color-accent-ink)] transition hover:bg-[var(--color-accent-hover)]"
              href="/chat"
            >
              <MessageSquare className="size-3.5" /> Open in chat
            </a>
          </article>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 text-center text-sm text-[var(--color-ink)]/55">
          No models match “{query}”. Try a different name or filter.
        </p>
      ) : null}
    </div>
  );
}
