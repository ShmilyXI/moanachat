import assert from "node:assert/strict";
import test from "node:test";
import { removeChatFromHistory } from "@/lib/chat/history";
import { getDefaultSidebarOpen } from "@/lib/chat/sidebar-state";

test("opens the desktop sidebar unless a collapsed preference was saved", () => {
  assert.equal(getDefaultSidebarOpen(undefined), true);
  assert.equal(getDefaultSidebarOpen("true"), true);
  assert.equal(getDefaultSidebarOpen("false"), false);
});

test("removes a deleted chat from every loaded history page", () => {
  const histories = [
    {
      chats: [
        { id: "first", title: "First" },
        { id: "deleted", title: "Deleted" },
      ],
      hasMore: true,
    },
    {
      chats: [{ id: "deleted", title: "Deleted duplicate" }],
      hasMore: false,
    },
  ];

  assert.deepEqual(removeChatFromHistory(histories, "deleted"), [
    { chats: [{ id: "first", title: "First" }], hasMore: true },
    { chats: [], hasMore: false },
  ]);
});
