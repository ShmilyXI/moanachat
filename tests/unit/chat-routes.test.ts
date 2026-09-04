import assert from "node:assert/strict";
import test from "node:test";
import {
  extractChatId,
  isChatSurfacePath,
  isPublicAssetPath,
  isPublicAuthPath,
} from "@/lib/chat/routes";

test("does not treat product pages as chat surfaces", () => {
  assert.equal(isChatSurfacePath("/"), false);
  assert.equal(isChatSurfacePath("/chat"), true);
  assert.equal(isChatSurfacePath("/chat/123"), true);
  assert.equal(isChatSurfacePath("/chat/agent"), false);
  assert.equal(isChatSurfacePath("/chat/classic"), false);
  assert.equal(isChatSurfacePath("/studio/image"), false);
});

test("extracts ids only from persisted chat URLs", () => {
  assert.equal(extractChatId("/chat"), null);
  assert.equal(extractChatId("/chat/123"), "123");
  assert.equal(extractChatId("/chat/agent"), null);
  assert.equal(extractChatId("/chat/classic"), null);
  assert.equal(extractChatId("/feed"), null);
});

test("allows local visual assets through the auth proxy", () => {
  assert.equal(isPublicAssetPath("/images/demo-thumbnail.png"), true);
  assert.equal(isPublicAssetPath("/preview.png"), true);
  assert.equal(isPublicAssetPath("/api/chat"), false);
});

test("keeps authentication pages reachable for every session state", () => {
  assert.equal(isPublicAuthPath("/login"), true);
  assert.equal(isPublicAuthPath("/register"), true);
  assert.equal(isPublicAuthPath("/sign-up"), true);
  assert.equal(isPublicAuthPath("/"), false);
});
