export function isBotIdConfigured(
  configuredValue = process.env.BOTID_ENABLED,
  vercelValue = process.env.VERCEL
): boolean {
  if (configuredValue === "0") {
    return false;
  }

  return configuredValue === "1" || vercelValue === "1";
}

export function shouldEnableBotIdClient({
  configured,
  hasWebCrypto,
  isSecureContext,
}: {
  configured: boolean;
  hasWebCrypto: boolean;
  isSecureContext: boolean;
}): boolean {
  return configured && isSecureContext && hasWebCrypto;
}

export function isSecureRequest(request: Request): boolean {
  const forwardedProtocol = request.headers
    .get("x-forwarded-proto")
    ?.split(",", 1)[0]
    ?.trim();
  const protocol = forwardedProtocol || new URL(request.url).protocol;

  return protocol === "https" || protocol === "https:";
}
