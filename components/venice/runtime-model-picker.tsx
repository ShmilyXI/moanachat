// biome-ignore-all lint/performance/noJsxPropsBind: picker callbacks are scoped to this component
"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocale } from "@/components/locale-provider";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ChatModel } from "@/lib/ai/models";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function RuntimeModelPicker({
  defaultModelId,
  models,
  onDefaultModelChange,
  onSelectedModelIdsChange,
  selectedModelIds,
}: {
  defaultModelId: string;
  models: readonly ChatModel[];
  onDefaultModelChange: (modelId: string) => void;
  onSelectedModelIdsChange: (modelIds: string[]) => void;
  selectedModelIds: readonly string[];
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => new Set(selectedModelIds), [selectedModelIds]);
  const selectedModels = models.filter((model) => selected.has(model.id));

  const toggleModel = (modelId: string) => {
    if (modelId === defaultModelId && selected.has(modelId)) {
      return;
    }

    const next = selected.has(modelId)
      ? selectedModelIds.filter((id) => id !== modelId)
      : [...selectedModelIds, modelId];
    onSelectedModelIdsChange(next);
  };

  return (
    <div
      className="grid gap-4 rounded-xl border border-border/50 bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_220px]"
      data-testid="runtime-model-picker"
    >
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="runtime-model-trigger">
          {t("api.connection.modelsEnabled")}
        </label>
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger asChild>
            <Button
              aria-expanded={open}
              className="w-full justify-between rounded-lg border border-border/60 bg-background px-3 text-left font-normal"
              id="runtime-model-trigger"
              type="button"
              variant="outline"
            >
              <span className="truncate">
                {t("api.connection.modelsEnabledCount", {
                  count: selectedModelIds.length,
                })}
              </span>
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-[min(360px,calc(100vw-3rem))] p-0"
          >
            <Command>
              <CommandInput placeholder={t("api.connection.searchModels")} />
              <CommandList>
                <CommandEmpty>{t("api.connection.noModels")}</CommandEmpty>
                <CommandGroup>
                  {models.map((model) => {
                    const isSelected = selected.has(model.id);
                    const isDefault = model.id === defaultModelId;
                    return (
                      <CommandItem
                        key={model.id}
                        onSelect={() => toggleModel(model.id)}
                        value={`${model.name} ${model.id}`}
                      >
                        <input
                          aria-label={model.name}
                          checked={isSelected}
                          className="size-4 accent-foreground"
                          disabled={isDefault}
                          onChange={() => toggleModel(model.id)}
                          onClick={(event) => event.stopPropagation()}
                          type="checkbox"
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {model.name}
                        </span>
                        {isDefault ? (
                          <CheckIcon className="size-4 text-foreground" />
                        ) : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="runtime-default-model">
          {t("api.connection.defaultModel")}
        </label>
        <select
          className={cn(
            "flex h-9 w-full rounded-lg border border-border/60 bg-background px-3 text-sm outline-none",
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          )}
          id="runtime-default-model"
          onChange={(event) => onDefaultModelChange(event.target.value)}
          value={defaultModelId}
        >
          {selectedModels.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
