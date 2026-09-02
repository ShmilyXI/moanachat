# Chat Folder Organization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Venice-style local chat folders with persistent browser state, drag-and-drop chat filing, inline folder management, and synchronized deletion.

**Architecture:** Keep chat history fetched from the existing paginated `/api/history` flow. Add a small pure folder-preferences module for versioned localStorage data and membership operations, let `AppSidebar` own that state, and pass folder data plus callbacks through `SidebarHistory` to `ChatItem`. Use native HTML5 drag events so no dependency or server API is needed.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind utility classes, existing shadcn sidebar/dialog primitives, `localStorage`, Playwright, and Node test runner.

---

### Task 1: Add pure folder state helpers

**Files:**
- Create: `lib/chat/folders.ts`
- Test: `tests/unit/chat-folders.test.ts`

- [ ] **Step 1: Write failing tests for normalization and membership operations**

Cover legacy string arrays, malformed JSON, duplicate memberships, adding a
folder, renaming, toggling expansion, moving a chat between folders, removing a
chat, and deleting a folder while retaining its chat ids as unfiled.

- [ ] **Step 2: Run the focused unit test and verify it fails for missing helpers**

Run `pnpm exec tsx --test tests/unit/chat-folders.test.ts`.

Expected result: the test fails because `lib/chat/folders.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure helpers**

Define `ChatFolder`, `ChatFolderPreferences`, `FOLDER_STORAGE_KEY`,
`createFolder`, `normalizeFolderPreferences`, `addChatToFolder`,
`removeChatFromFolders`, `renameFolder`, `toggleFolder`, and
`deleteFolder`. Keep helpers immutable and make `normalizeFolderPreferences`
accept unknown localStorage values plus the currently known chat ids.

- [ ] **Step 4: Run the focused unit test and verify it passes**

Run `pnpm exec tsx --test tests/unit/chat-folders.test.ts`.

Expected result: all folder helper tests pass.

### Task 2: Lift folder preferences into the sidebar

**Files:**
- Create: `hooks/use-chat-folders.ts`
- Modify: `components/chat/app-sidebar.tsx`
- Modify: `lib/i18n/locales/en.ts`
- Modify: `lib/i18n/locales/zh.ts`

- [ ] **Step 1: Add the hook contract test**

Add a small unit-level test for the persistence adapter that mocks a storage
object, loads invalid data as an empty preference payload, and verifies writes
use `FOLDER_STORAGE_KEY`.

- [ ] **Step 2: Run the hook test and verify it fails**

Run `pnpm exec tsx --test tests/unit/chat-folders.test.ts`.

Expected result: the new persistence assertions fail because the hook and
adapter are not implemented.

- [ ] **Step 3: Implement `useChatFolders`**

Load the versioned payload on mount, expose `folders`, `createFolder`,
`renameFolder`, `toggleFolder`, `deleteFolder`, `moveChatToFolder`, and
`removeChatFromFolders`, and persist every state transition. Catch storage read
and write errors without breaking the in-memory state.

- [ ] **Step 4: Replace the current string-only folder state in `AppSidebar`**

Remove the existing `folders: string[]` localStorage code. Render the folder
header and pass the hook state and callbacks to `SidebarHistory`. Keep the
existing new-chat, search, delete-all, and mobile-close handlers unchanged.

- [ ] **Step 5: Add translation keys for folder actions and drag feedback**

Add English and Chinese labels for folder rename, confirm, cancel, delete,
delete confirmation, drag-to-folder, unfiled chats, and empty-folder states.

- [ ] **Step 6: Run type checking and the focused tests**

Run `pnpm exec tsc --noEmit` and `pnpm exec tsx --test tests/unit/chat-folders.test.ts`.

Expected result: both commands exit successfully.

### Task 3: Render folders and support chat drag-and-drop

**Files:**
- Modify: `components/chat/sidebar-history.tsx`
- Modify: `components/chat/sidebar-history-item.tsx`

- [ ] **Step 1: Add failing DOM tests for folder grouping and drag callbacks**

Extend the chat Playwright suite with a fixture that seeds `moanachat-folders`,
opens `/chat/agent`, verifies a filed chat is nested under its folder, and
verifies an unfiled chat remains in the chat section. Add a test that dispatches
drag events from a chat item to a folder and checks the folder membership after
reload.

- [ ] **Step 2: Run the new Playwright tests and verify they fail**

Run `PORT=3011 ./node_modules/.bin/playwright test tests/e2e/chat.test.ts -g "folder|drag" --reporter=line`.

Expected result: the tests fail because the current sidebar has no folder
drop targets and chat items are not draggable.

- [ ] **Step 3: Extend `SidebarHistory` props and flatten loaded chats once**

Accept the folder list and folder mutation callbacks from `AppSidebar`. Build a
chat lookup from all loaded pages, render folder sections before the existing
date groups, and filter filed chats out of the unfiled groups.

- [ ] **Step 4: Render Venice-style folder rows**

Add an expandable row with a caret, folder name, rename button, and delete
button. Show an inline input with confirm and cancel actions while renaming or
creating. Apply a drag-over class to the row and expose an accessible drop
label. Render filed `ChatItem` children when expanded and an empty-folder
message when there are none.

- [ ] **Step 5: Add an unfiled drop target**

Render a compact `Unfiled` drop zone above date groups. Dropping a chat there
removes its membership from every folder without deleting the chat.

- [ ] **Step 6: Make `ChatItem` draggable and preserve existing actions**

Set `draggable` on the chat link, write only the chat id to
`dataTransfer`, handle drag start/end, and pass the existing delete and mobile
callbacks through unchanged. Keep the current visibility menu and navigation.

- [ ] **Step 7: Run the folder and drag tests**

Run `PORT=3011 ./node_modules/.bin/playwright test tests/e2e/chat.test.ts -g "folder|drag" --reporter=line`.

Expected result: all new folder grouping and drag tests pass.

### Task 4: Synchronize rename and delete interactions

**Files:**
- Modify: `components/chat/sidebar-history.tsx`
- Modify: `components/chat/sidebar-history-item.tsx`
- Modify: `components/chat/app-sidebar.tsx`
- Test: `tests/e2e/chat.test.ts`

- [ ] **Step 1: Add failing tests for folder deletion and chat deletion cleanup**

Verify deleting a folder leaves its chat visible in the unfiled section, and
verify deleting a filed chat removes its id from localStorage after the server
delete request succeeds.

- [ ] **Step 2: Run the tests and verify the expected failures**

Run `PORT=3011 ./node_modules/.bin/playwright test tests/e2e/chat.test.ts -g "delete folder|delete filed chat" --reporter=line`.

Expected result: the tests fail because folder deletion and local membership
cleanup are not wired.

- [ ] **Step 3: Add folder confirmation state and deletion handling**

Use the existing `AlertDialog` primitive for folder deletion. Confirming calls
the folder hook, leaves the chats unfiled, and shows the existing toast style.

- [ ] **Step 4: Remove deleted chat ids after server deletion**

After `SidebarHistory`'s existing DELETE request and SWR mutation succeed,
invoke `removeChatFromFolders(chatId)`. Preserve the current redirect for the
active chat and current delete confirmation dialog.

- [ ] **Step 5: Run the focused delete tests**

Run `PORT=3011 ./node_modules/.bin/playwright test tests/e2e/chat.test.ts -g "delete folder|delete filed chat" --reporter=line`.

Expected result: both deletion tests pass.

### Task 5: Full verification and delivery review

**Files:**
- Modify: `tests/e2e/chat.test.ts` only if selectors need final stabilization

- [ ] **Step 1: Run unit tests, type checking, and formatting**

Run `pnpm exec tsx --test tests/unit/chat-folders.test.ts`,
`pnpm exec tsc --noEmit`, and
`pnpm exec ultracite check lib/chat/folders.ts hooks/use-chat-folders.ts components/chat/app-sidebar.tsx components/chat/sidebar-history.tsx components/chat/sidebar-history-item.tsx tests/unit/chat-folders.test.ts tests/e2e/chat.test.ts`.

- [ ] **Step 2: Run the complete focused chat test file**

Run `PORT=3011 ./node_modules/.bin/playwright test tests/e2e/chat.test.ts --reporter=line`.

Record any failures caused by the existing marketing-home overlay separately
from folder functionality.

- [ ] **Step 3: Inspect the diff and verify unrelated work is untouched**

Run `git diff --check` and `git status --short`. Confirm only the folder
feature files and the approved specification/plan are staged.

- [ ] **Step 4: Commit the implementation**

Run `HUSKY=0 git add lib/chat/folders.ts hooks/use-chat-folders.ts components/chat/app-sidebar.tsx components/chat/sidebar-history.tsx components/chat/sidebar-history-item.tsx lib/i18n/locales/en.ts lib/i18n/locales/zh.ts tests/unit/chat-folders.test.ts tests/e2e/chat.test.ts` followed by
`HUSKY=0 git commit -m "feat: organize chats into local folders"`.
