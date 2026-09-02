import assert from "node:assert/strict";
import test from "node:test";
import {
  loadStoredFolderPreferences,
  persistFolderPreferences,
} from "@/hooks/use-chat-folders";
import {
  addChatToFolder,
  type ChatFolderPreferences,
  createFolder,
  deleteFolder,
  emptyFolderPreferences,
  normalizeFolderPreferences,
  removeChatFromFolders,
  renameFolder,
  toggleFolder,
} from "@/lib/chat/folders";

test("normalizes legacy folder labels and removes duplicate memberships", () => {
  const preferences = normalizeFolderPreferences(
    JSON.stringify([
      "Ideas",
      "Ideas",
      {
        chatIds: ["chat-1", "chat-1", "missing"],
        id: "work",
        isExpanded: false,
        name: "Work",
      },
    ]),
    new Set(["chat-1"])
  );

  assert.deepEqual(preferences, {
    folders: [
      {
        chatIds: [],
        id: "legacy-0",
        isExpanded: true,
        name: "Ideas",
      },
      {
        chatIds: [],
        id: "legacy-1",
        isExpanded: true,
        name: "Ideas",
      },
      {
        chatIds: ["chat-1"],
        id: "work",
        isExpanded: false,
        name: "Work",
      },
    ],
    version: 1,
  });
});

test("keeps folder updates immutable and assigns a chat to one folder", () => {
  const initial: ChatFolderPreferences = {
    folders: [createFolder("Ideas", "ideas"), createFolder("Work", "work")],
    version: 1,
  };

  const filed = addChatToFolder(initial, "ideas", "chat-1");
  const moved = addChatToFolder(filed, "work", "chat-1");

  assert.deepEqual(initial.folders[0]?.chatIds, []);
  assert.deepEqual(filed.folders[0]?.chatIds, ["chat-1"]);
  assert.deepEqual(moved.folders[0]?.chatIds, []);
  assert.deepEqual(moved.folders[1]?.chatIds, ["chat-1"]);
});

test("renames, toggles, removes memberships, and deletes folders", () => {
  const initial: ChatFolderPreferences = {
    folders: [
      { chatIds: ["chat-1"], id: "ideas", isExpanded: true, name: "Ideas" },
      { chatIds: ["chat-2"], id: "work", isExpanded: true, name: "Work" },
    ],
    version: 1,
  };

  const renamed = renameFolder(initial, "ideas", "Projects");
  const collapsed = toggleFolder(renamed, "ideas");
  const unfiled = removeChatFromFolders(collapsed, "chat-1");
  const deleted = deleteFolder(unfiled, "work");

  assert.equal(deleted.folders.length, 1);
  assert.deepEqual(deleted.folders[0], {
    chatIds: [],
    id: "ideas",
    isExpanded: false,
    name: "Projects",
  });
});

test("invalid stored values fall back to empty preferences", () => {
  assert.deepEqual(
    normalizeFolderPreferences("not-json"),
    emptyFolderPreferences()
  );
  assert.deepEqual(
    normalizeFolderPreferences({ folders: [], version: 2 }),
    emptyFolderPreferences()
  );
});

test("reads and writes folder preferences through the browser storage key", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  const preferences = {
    folders: [createFolder("Ideas", "ideas")],
    version: 1 as const,
  };

  persistFolderPreferences(storage, preferences);
  assert.deepEqual(loadStoredFolderPreferences(storage), preferences);

  values.set("moanachat-folders", "bad-json");
  assert.deepEqual(
    loadStoredFolderPreferences(storage),
    emptyFolderPreferences()
  );
});
