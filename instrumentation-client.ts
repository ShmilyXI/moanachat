import { initBotId } from "botid/client/core";
import { shouldEnableBotIdClient } from "./lib/bot-protection";

if (
  typeof window !== "undefined" &&
  shouldEnableBotIdClient({
    configured: process.env.NEXT_PUBLIC_BOTID_ENABLED === "1",
    hasWebCrypto: typeof window.crypto?.subtle?.importKey === "function",
    isSecureContext: window.isSecureContext,
  })
) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  initBotId({
    protect: [
      {
        method: "POST",
        path: `${basePath}/api/chat`,
      },
    ],
  });
}
