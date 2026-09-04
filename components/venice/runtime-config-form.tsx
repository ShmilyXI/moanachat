// biome-ignore-all lint/performance/noJsxPropsBind: form handlers are scoped to this page
"use client";

import {
  CheckCircle2Icon,
  DownloadIcon,
  LoaderCircleIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RuntimeModelPicker } from "@/components/venice/runtime-model-picker";
import type { ChatModel } from "@/lib/ai/models";
import type { RuntimeConfigStatus } from "@/lib/ai/runtime-config";

type RuntimeConfigStatusResponse = RuntimeConfigStatus & {
  requiresSignIn?: boolean;
};

type RuntimeConfigModelsResponse = {
  models?: ChatModel[];
};

async function fetchRuntimeStatus(
  url: string
): Promise<RuntimeConfigStatusResponse> {
  const response = await fetch(url, { cache: "no-store" });
  if (response.status === 401) {
    return { configured: false, mode: "gateway", requiresSignIn: true };
  }
  if (!response.ok) {
    throw new Error("Unable to load runtime configuration");
  }
  return response.json();
}

function getResponseError(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null) {
    const { cause, message } = payload as {
      cause?: unknown;
      message?: unknown;
    };
    if (typeof cause === "string" && cause.trim()) {
      return cause;
    }
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return fallback;
}

function getDisplayedBaseUrl(baseUrl: string): string {
  const trimmedBaseUrl = baseUrl.replace(/\/+$/, "");
  return trimmedBaseUrl.endsWith("/v1")
    ? trimmedBaseUrl
    : `${trimmedBaseUrl}/v1`;
}

export function RuntimeConfigForm() {
  const { t } = useLocale();
  const { data, error, isLoading, mutate } =
    useSWR<RuntimeConfigStatusResponse>(
      "/api/runtime-config",
      fetchRuntimeStatus,
      { revalidateOnFocus: false }
    );
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [modelCount, setModelCount] = useState<number | null>(null);
  const [discoveredModels, setDiscoveredModels] = useState<ChatModel[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [defaultModelId, setDefaultModelId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const displayedBaseUrl = data?.baseUrl
    ? getDisplayedBaseUrl(data.baseUrl)
    : "";

  useEffect(() => {
    if (data?.configured && displayedBaseUrl) {
      setBaseUrl(displayedBaseUrl);
    }
    if (!data) {
      return;
    }

    const enabledModelIds = data.enabledModelIds ?? [];
    setSelectedModelIds(enabledModelIds);
    setDefaultModelId(data.defaultModelId ?? enabledModelIds[0] ?? "");
  }, [data, displayedBaseUrl]);

  const save = async () => {
    const trimmedBaseUrl = baseUrl.trim();
    const trimmedApiKey = apiKey.trim();
    if (!trimmedBaseUrl || !trimmedApiKey) {
      setFeedback(t("api.connection.invalid"));
      return;
    }

    setIsSaving(true);
    setFeedback(t("api.connection.saving"));
    setModelCount(null);
    try {
      const response = await fetch("/api/runtime-config", {
        body: JSON.stringify({
          apiKey: trimmedApiKey,
          baseUrl: trimmedBaseUrl,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          getResponseError(payload, t("api.connection.saveFailed"))
        );
      }

      setApiKey("");
      setDiscoveredModels([]);
      setSelectedModelIds([]);
      setDefaultModelId("");
      setFeedback(t("api.connection.verifying"));
      const modelsResponse = await fetch("/api/models", { cache: "no-store" });
      const modelsPayload =
        (await modelsResponse.json()) as RuntimeConfigModelsResponse;
      if (!modelsResponse.ok) {
        throw new Error(
          getResponseError(modelsPayload, t("api.connection.verifyFailed"))
        );
      }

      setModelCount(modelsPayload.models?.length ?? 0);
      setFeedback(t("api.connection.saved"));
      await mutate();
      window.dispatchEvent(new Event("moana-runtime-config-ready"));
    } catch (saveError) {
      setFeedback(
        saveError instanceof Error
          ? saveError.message
          : t("api.connection.saveFailed")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const discoverModels = async () => {
    const trimmedBaseUrl = baseUrl.trim();
    const trimmedApiKey = apiKey.trim();
    if (!trimmedBaseUrl || (!data?.configured && !trimmedApiKey)) {
      setFeedback(t("api.connection.invalid"));
      return;
    }

    setIsDiscovering(true);
    setFeedback(t("api.connection.fetchingModels"));
    try {
      const body: { apiKey?: string; baseUrl: string } = {
        baseUrl: trimmedBaseUrl,
      };
      if (trimmedApiKey) {
        body.apiKey = trimmedApiKey;
      }

      const response = await fetch("/api/runtime-config/models", {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json()) as RuntimeConfigModelsResponse & {
        error?: string;
      };
      if (!response.ok || !payload.models?.length) {
        throw new Error(
          getResponseError(payload, t("api.connection.discoveryFailed"))
        );
      }

      const { models = [] } = payload;
      const discoveredIds = new Set(models.map((model) => model.id));
      const savedIds = (data?.enabledModelIds ?? []).filter((id) =>
        discoveredIds.has(id)
      );
      const nextSelectedIds = savedIds.length
        ? savedIds
        : models.map((model) => model.id);
      const savedDefault = data?.defaultModelId;
      const nextDefaultModelId =
        savedDefault && nextSelectedIds.includes(savedDefault)
          ? savedDefault
          : (nextSelectedIds[0] ?? "");

      setDiscoveredModels(models);
      setSelectedModelIds(nextSelectedIds);
      setDefaultModelId(nextDefaultModelId);
      setModelCount(models.length);
      setFeedback(t("api.connection.modelsFetched", { count: models.length }));
    } catch (discoverError) {
      setFeedback(
        discoverError instanceof Error
          ? discoverError.message
          : t("api.connection.discoveryFailed")
      );
    } finally {
      setIsDiscovering(false);
    }
  };

  const saveModelSelection = async () => {
    if (selectedModelIds.length === 0) {
      setFeedback(t("api.connection.selectAtLeastOneModel"));
      return;
    }

    const nextDefaultModelId = selectedModelIds.includes(defaultModelId)
      ? defaultModelId
      : (selectedModelIds[0] ?? "");
    if (!nextDefaultModelId) {
      setFeedback(t("api.connection.selectAtLeastOneModel"));
      return;
    }

    setIsSavingPreferences(true);
    setFeedback(t("api.connection.savingModelSelection"));
    try {
      const response = await fetch("/api/runtime-config/models", {
        body: JSON.stringify({
          defaultModelId: nextDefaultModelId,
          enabledModelIds: selectedModelIds,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const payload = (await response.json()) as {
        defaultModelId?: string;
        enabledModelIds?: string[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(
          getResponseError(
            payload,
            t("api.connection.saveModelSelectionFailed")
          )
        );
      }

      setDefaultModelId(payload.defaultModelId ?? nextDefaultModelId);
      setSelectedModelIds(payload.enabledModelIds ?? selectedModelIds);
      setFeedback(t("api.connection.modelSelectionSaved"));
      await mutate();
      window.dispatchEvent(new Event("moana-runtime-config-ready"));
    } catch (saveError) {
      setFeedback(
        saveError instanceof Error
          ? saveError.message
          : t("api.connection.saveModelSelectionFailed")
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const clear = async () => {
    setIsSaving(true);
    setFeedback(null);
    setModelCount(null);
    try {
      const response = await fetch("/api/runtime-config", { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(
          getResponseError(payload, t("api.connection.clearFailed"))
        );
      }
      setBaseUrl("");
      setApiKey("");
      setDiscoveredModels([]);
      setSelectedModelIds([]);
      setDefaultModelId("");
      setFeedback(t("api.connection.cleared"));
      await mutate();
      window.dispatchEvent(new Event("moana-runtime-config-ready"));
    } catch (clearError) {
      setFeedback(
        clearError instanceof Error
          ? clearError.message
          : t("api.connection.clearFailed")
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    save();
  };

  const handleClear = () => {
    clear();
  };

  const isConfigured = data?.configured === true;
  const showForm = Boolean(data && !data.requiresSignIn);

  return (
    <section className="mx-auto w-full max-w-5xl px-5 py-6 md:px-10 md:py-8">
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-medium">
              {t("api.connection.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("api.connection.description")}
            </p>
          </div>
          {isConfigured ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2Icon className="size-3.5" />
              {t("api.connection.configured")}
            </div>
          ) : data && showForm ? (
            <div className="text-xs text-muted-foreground">
              {t("api.connection.unconfigured")}
            </div>
          ) : null}
        </div>

        {isLoading ? (
          <p className="mt-5 text-sm text-muted-foreground">
            {t("api.connection.loading")}
          </p>
        ) : null}
        {error ? (
          <p className="mt-5 text-sm text-destructive">
            {t("api.connection.loadFailed")}
          </p>
        ) : null}
        {data?.requiresSignIn ? (
          <p className="mt-5 text-sm text-muted-foreground">
            {t("api.connection.signInRequired")}
          </p>
        ) : null}

        {showForm ? (
          <form
            className="mt-6 grid gap-4 md:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="runtime-base-url">
                {t("api.connection.baseUrl")}
              </label>
              <Input
                disabled={isSaving}
                id="runtime-base-url"
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder={t("api.connection.baseUrlPlaceholder")}
                value={baseUrl}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="runtime-api-key">
                {t("api.connection.apiKey")}
              </label>
              <Input
                autoComplete="new-password"
                disabled={isSaving}
                id="runtime-api-key"
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={t("api.connection.apiKeyPlaceholder")}
                type="password"
                value={apiKey}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 md:col-span-2">
              <Button
                className="gap-2 rounded-lg"
                disabled={isSaving}
                type="submit"
              >
                {isSaving ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <SaveIcon className="size-4" />
                )}
                {isSaving
                  ? t("api.connection.saving")
                  : t("api.connection.save")}
              </Button>
              {isConfigured ? (
                <Button
                  className="gap-2 rounded-lg"
                  disabled={isSaving}
                  onClick={handleClear}
                  type="button"
                  variant="outline"
                >
                  <Trash2Icon className="size-4" />
                  {t("api.connection.clear")}
                </Button>
              ) : null}
              <Button
                className="gap-2 rounded-lg"
                disabled={isSaving || isDiscovering || isSavingPreferences}
                onClick={discoverModels}
                type="button"
                variant="outline"
              >
                {isDiscovering ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <DownloadIcon className="size-4" />
                )}
                {isDiscovering
                  ? t("api.connection.fetchingModels")
                  : t("api.connection.getModels")}
              </Button>
              {feedback ? (
                <span className="text-sm text-muted-foreground">
                  {feedback}
                </span>
              ) : null}
            </div>
            {isConfigured && data.baseUrl ? (
              <p className="text-xs text-muted-foreground md:col-span-2">
                {t("api.connection.current", { baseUrl: displayedBaseUrl })}
              </p>
            ) : null}
            {modelCount === null ? null : (
              <p className="text-xs text-muted-foreground md:col-span-2">
                {t("api.connection.modelCount", { count: modelCount })}
              </p>
            )}
            {discoveredModels.length > 0 ? (
              <div className="space-y-3 md:col-span-2">
                <RuntimeModelPicker
                  defaultModelId={defaultModelId}
                  models={discoveredModels}
                  onDefaultModelChange={setDefaultModelId}
                  onSelectedModelIdsChange={setSelectedModelIds}
                  selectedModelIds={selectedModelIds}
                />
                <Button
                  className="gap-2 rounded-lg"
                  disabled={isSaving || isDiscovering || isSavingPreferences}
                  onClick={saveModelSelection}
                  type="button"
                >
                  {isSavingPreferences ? (
                    <LoaderCircleIcon className="size-4 animate-spin" />
                  ) : (
                    <SaveIcon className="size-4" />
                  )}
                  {isSavingPreferences
                    ? t("api.connection.savingModelSelection")
                    : t("api.connection.saveModelSelection")}
                </Button>
              </div>
            ) : null}
          </form>
        ) : null}
      </div>
    </section>
  );
}
