import assert from "node:assert/strict";
import test from "node:test";
import { createTranslator, detectLocale } from "./index";
import type { TranslationKey } from "./locales/en";

test("saved locale has priority over browser language", () => {
  assert.equal(detectLocale("zh", ["en-US"]), "zh");
});

test("browser Chinese locale is detected", () => {
  assert.equal(detectLocale(null, ["zh-CN", "en-US"]), "zh");
});

test("unknown browser locale falls back to English", () => {
  assert.equal(detectLocale("invalid", ["fr-FR"]), "en");
});

test("translator interpolates values and falls back to the key", () => {
  const translate = createTranslator("zh");

  assert.equal(
    translate("chat.reasoning.seconds", { duration: 3 }),
    "思考了 3 秒"
  );
  assert.equal(translate("chat.greeting.title"), "今天想聊点什么？");
  assert.equal(translate("missing.key" as TranslationKey), "missing.key");
});
