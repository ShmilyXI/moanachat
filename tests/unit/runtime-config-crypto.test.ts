import { strict as assert } from "node:assert/strict";
import { test } from "node:test";
import {
  decryptRuntimeApiKey,
  encryptRuntimeApiKey,
} from "@/lib/ai/runtime-config-crypto";

test("round trips an API key and uses a fresh IV", () => {
  const first = encryptRuntimeApiKey("sk-test", "test-secret");
  const second = encryptRuntimeApiKey("sk-test", "test-secret");

  assert.equal(decryptRuntimeApiKey(first, "test-secret"), "sk-test");
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.ciphertext, second.ciphertext);
  assert.notEqual(first.authTag, second.authTag);
});

test("rejects an API key encrypted with a different secret", () => {
  const payload = encryptRuntimeApiKey("sk-test", "test-secret");

  assert.throws(
    () => decryptRuntimeApiKey(payload, "another-secret"),
    (error: unknown) => {
      assert(error instanceof Error);
      assert.equal(error.message, "Unable to decrypt runtime API key");
      assert.equal(error.message.includes(payload.ciphertext), false);
      return true;
    }
  );
});

test("rejects a tampered ciphertext without exposing the payload", () => {
  const payload = encryptRuntimeApiKey("sk-test", "test-secret");
  const tampered = {
    ...payload,
    ciphertext: `${payload.ciphertext}A`,
  };

  assert.throws(
    () => decryptRuntimeApiKey(tampered, "test-secret"),
    (error: unknown) => {
      assert(error instanceof Error);
      assert.equal(error.message, "Unable to decrypt runtime API key");
      assert.equal(error.message.includes(tampered.ciphertext), false);
      return true;
    }
  );
});

test("rejects an empty encryption secret", () => {
  assert.throws(
    () => encryptRuntimeApiKey("sk-test", ""),
    /Runtime config encryption secret is required/
  );
});
