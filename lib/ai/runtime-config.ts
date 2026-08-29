import { cookies } from "next/headers";

export const RUNTIME_CONFIG_COOKIE = "moana-runtime-config";
export const RUNTIME_CONFIG_MAX_AGE = 7 * 24 * 60 * 60;
export const MAX_RUNTIME_CONFIG_VALUE_LENGTH = 2048;

export type RuntimeConfig = {
  mode: "embedded" | "gateway";
  baseUrl?: string;
  apiKey?: string;
};

export type RuntimeConfigCandidate = Pick<
  RuntimeConfig,
  "apiKey" | "baseUrl"
>;

type RuntimeConfigSources = {
  account?: RuntimeConfigCandidate;
  cookie?: RuntimeConfigCandidate;
  gatewayApiKey?: unknown;
};

type RuntimeConfigValues = {
  apiKey?: unknown;
  apiBase?: unknown;
  baseUrl?: unknown;
};

function readValue(input: unknown, key: string): unknown {
  if (input instanceof URLSearchParams) {
    return input.get(key) ?? undefined;
  }

  if (input instanceof URL) {
    return input.searchParams.get(key) ?? undefined;
  }

  if (typeof input === "object" && input !== null) {
    return (input as RuntimeConfigValues)[key as keyof RuntimeConfigValues];
  }
}

function validateString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Runtime ${field} must be a string`);
  }

  if (value.length > MAX_RUNTIME_CONFIG_VALUE_LENGTH) {
    throw new Error(
      `Runtime ${field} must be at most ${MAX_RUNTIME_CONFIG_VALUE_LENGTH} characters`
    );
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Runtime ${field} must not be empty`);
  }

  return trimmed;
}

export function normalizeBaseUrl(value: unknown): string {
  const raw = validateString(value, "base URL");
  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch (error) {
    throw new Error("Runtime base URL is invalid", { cause: error });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Runtime base URL must use http or https");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Runtime base URL must not contain credentials");
  }

  if (parsed.search || parsed.hash) {
    throw new Error("Runtime base URL must not contain a query or fragment");
  }

  let pathname = parsed.pathname.replace(/\/+$/, "");
  if (pathname.endsWith("/v1")) {
    pathname = pathname.slice(0, -3).replace(/\/+$/, "");
  }

  return `${parsed.origin}${pathname}`;
}

export function normalizeApiKey(value: unknown): string {
  return validateString(value, "API key");
}

export function parseEmbeddedRuntimeConfig(input: unknown): RuntimeConfig {
  const baseUrl = readValue(input, "baseUrl") ?? readValue(input, "apiBase");
  const apiKey = readValue(input, "apiKey");

  return {
    apiKey: normalizeApiKey(apiKey),
    baseUrl: normalizeBaseUrl(baseUrl),
    mode: "embedded",
  };
}

export const parseRuntimeConfig = parseEmbeddedRuntimeConfig;

export function encodeRuntimeConfig(config: RuntimeConfig): string {
  if (config.mode !== "embedded" || !config.baseUrl || !config.apiKey) {
    throw new Error("Only embedded runtime configurations can be stored");
  }

  const validated = parseEmbeddedRuntimeConfig(config);
  return encodeURIComponent(
    JSON.stringify({ apiKey: validated.apiKey, baseUrl: validated.baseUrl })
  );
}

export function decodeRuntimeConfig(value: string): RuntimeConfig {
  const decoded = decodeURIComponent(value);
  return parseEmbeddedRuntimeConfig(JSON.parse(decoded));
}

function isCompleteCandidate(
  candidate: RuntimeConfigCandidate | undefined
): candidate is Required<RuntimeConfigCandidate> {
  return Boolean(
    candidate?.baseUrl?.trim() && candidate.apiKey?.trim()
  );
}

export function resolveRuntimeConfigSources({
  account,
  cookie,
  gatewayApiKey,
}: RuntimeConfigSources): RuntimeConfig {
  if (isCompleteCandidate(account)) {
    return { ...account, mode: "embedded" };
  }

  if (isCompleteCandidate(cookie)) {
    return { ...cookie, mode: "embedded" };
  }

  const trimmedGatewayKey =
    typeof gatewayApiKey === "string" ? gatewayApiKey.trim() : "";

  return trimmedGatewayKey
    ? { apiKey: trimmedGatewayKey, mode: "gateway" }
    : { mode: "gateway" };
}

export function resolveRuntimeConfig(
  cookieValue: string | undefined,
  gatewayApiKey = process.env.AI_GATEWAY_API_KEY
): RuntimeConfig {
  let cookie: RuntimeConfigCandidate | undefined;
  if (cookieValue) {
    try {
      cookie = decodeRuntimeConfig(cookieValue);
    } catch {
      // An invalid or stale embedded cookie should not prevent standalone use.
    }
  }

  return resolveRuntimeConfigSources({ cookie, gatewayApiKey });
}

export async function getRuntimeConfig(): Promise<RuntimeConfig> {
  const [{ auth }, { getUserRuntimeConfigByUserId }, { decryptRuntimeApiKey }] =
    await Promise.all([
      import("@/app/(auth)/auth"),
      import("@/lib/db/queries"),
      import("@/lib/ai/runtime-config-crypto"),
    ]);
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);

  let account: RuntimeConfigCandidate | undefined;
  if (session?.user?.type === "regular" && session.user.id) {
    try {
      const stored = await getUserRuntimeConfigByUserId({
        userId: session.user.id,
      });
      if (stored) {
        account = {
          apiKey: decryptRuntimeApiKey({
            authTag: stored.authTag,
            ciphertext: stored.encryptedApiKey,
            iv: stored.iv,
          }),
          baseUrl: stored.baseUrl,
        };
      }
    } catch {
      // Invalid account data should fall back to legacy runtime sources.
    }
  }

  let cookie: RuntimeConfigCandidate | undefined;
  const cookieValue = cookieStore.get(RUNTIME_CONFIG_COOKIE)?.value;
  if (cookieValue) {
    try {
      cookie = decodeRuntimeConfig(cookieValue);
    } catch {
      // An invalid or stale embedded cookie should not prevent standalone use.
    }
  }

  return resolveRuntimeConfigSources({
    account,
    cookie,
    gatewayApiKey: process.env.AI_GATEWAY_API_KEY,
  });
}
