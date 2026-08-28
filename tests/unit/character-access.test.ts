import assert from "node:assert/strict";
import test from "node:test";
import { canUseCharacter } from "@/lib/chat/character-access";

test("allows public characters and the owner's private character", () => {
  assert.equal(
    canUseCharacter({ userId: "owner", visibility: "private" }, "owner"),
    true
  );
  assert.equal(
    canUseCharacter({ userId: "owner", visibility: "public" }, "visitor"),
    true
  );
});

test("rejects another user from a private character", () => {
  assert.equal(
    canUseCharacter({ userId: "owner", visibility: "private" }, "visitor"),
    false
  );
});
