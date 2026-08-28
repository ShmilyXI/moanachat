import assert from "node:assert/strict";
import test from "node:test";
import { isChatMode, shouldPersistChat } from "@/lib/chat/modes";

test("recognizes the two supported chat modes", () => {
  assert.equal(isChatMode("normal"), true);
  assert.equal(isChatMode("temporary"), true);
  assert.equal(isChatMode("private"), false);
});

test("only normal chats are persisted", () => {
  assert.equal(shouldPersistChat("normal"), true);
  assert.equal(shouldPersistChat("temporary"), false);
});
