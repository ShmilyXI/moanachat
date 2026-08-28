import { strict as assert } from "node:assert/strict";
import { test } from "node:test";

import {
  isBotIdConfigured,
  isSecureRequest,
  shouldEnableBotIdClient,
} from "@/lib/bot-protection";
import nextConfig from "../../next.config";

test("does not inject BotID rewrites for a self-hosted build", () => {
  assert.equal(nextConfig.env?.NEXT_PUBLIC_BOTID_ENABLED, "0");
  assert.equal(nextConfig.rewrites, undefined);
});

test("requires a secure browser context before starting BotID", () => {
  assert.equal(
    shouldEnableBotIdClient({
      configured: true,
      hasWebCrypto: true,
      isSecureContext: false,
    }),
    false
  );
  assert.equal(
    shouldEnableBotIdClient({
      configured: true,
      hasWebCrypto: true,
      isSecureContext: true,
    }),
    true
  );
  assert.equal(
    shouldEnableBotIdClient({
      configured: true,
      hasWebCrypto: false,
      isSecureContext: true,
    }),
    false
  );
});

test("enables BotID only for Vercel or an explicit opt-in", () => {
  assert.equal(isBotIdConfigured(undefined, undefined), false);
  assert.equal(isBotIdConfigured("1", undefined), true);
  assert.equal(isBotIdConfigured(undefined, "1"), true);
  assert.equal(isBotIdConfigured("0", "1"), false);
});

test("recognizes forwarded HTTPS requests", () => {
  assert.equal(
    isSecureRequest(
      new Request("http://localhost/api/chat", {
        headers: { "x-forwarded-proto": "https" },
      })
    ),
    true
  );
  assert.equal(
    isSecureRequest(new Request("http://localhost/api/chat")),
    false
  );
});
