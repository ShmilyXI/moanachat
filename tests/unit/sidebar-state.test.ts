import assert from "node:assert/strict";
import test from "node:test";
import { getDefaultSidebarOpen } from "@/lib/chat/sidebar-state";

test("opens the desktop sidebar unless a collapsed preference was saved", () => {
  assert.equal(getDefaultSidebarOpen(undefined), true);
  assert.equal(getDefaultSidebarOpen("true"), true);
  assert.equal(getDefaultSidebarOpen("false"), false);
});
