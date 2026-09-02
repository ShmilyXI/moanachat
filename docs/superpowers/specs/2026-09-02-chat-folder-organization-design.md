# Chat Folder Organization Design

## Goal

Make the chat sidebar behave like the reference Venice sidebar while keeping
folder state in the current browser only. Users can create, rename, expand,
collapse, and delete folders, drag chat history items into folders, and delete
individual chats without losing folder state consistency.

## Scope and Constraints

- Folder metadata and chat membership are persisted in `localStorage`.
- Chat records remain sourced from the existing `/api/history` endpoint.
- No database migration or new server endpoint is required.
- Folder deletion keeps its chats and returns them to the unfiled chat list.
- Chat deletion removes the chat from the server and from every local folder.
- Existing navigation, visibility controls, mobile sidebar behavior, and new
  chat actions remain unchanged.

## State Model

Use a versioned local preference payload under `moanachat-folders`:

```ts
type ChatFolder = {
  id: string;
  name: string;
  chatIds: string[];
  isExpanded: boolean;
};

type ChatFolderPreferences = {
  version: 1;
  folders: ChatFolder[];
};
```

The client normalizes malformed or legacy values, removes duplicate chat ids,
and ignores memberships for chats that are not present in the loaded history.
Each chat belongs to at most one folder. Moving a chat replaces its previous
folder membership.

## Component and Data Flow

`AppSidebar` owns the folder preference state and persistence, because it owns
the folder controls and remains mounted while chat routes change. It passes
the folder list and callbacks to `SidebarHistory`.

`SidebarHistory` flattens the paginated history once, renders folders before
the unfiled chat groups, and passes drag/delete/rename callbacks to
`ChatItem`. It keeps the existing pagination and server delete flow.

`ChatItem` becomes an HTML5 draggable link. The drag payload contains only the
chat id. Folder rows are drop targets and expose a highlighted state while a
chat is dragged over them. A small unfiled drop target lets users remove a chat
from its folder without deleting the chat.

## Interaction Details

- Add folder creates an expanded folder with an inline name field.
- Folder rename uses inline editing with confirm and cancel actions.
- Folder caret toggles `isExpanded` and persists immediately.
- Folder delete asks for confirmation, then removes only the folder metadata.
- A folder row shows its contained chats when expanded.
- Unfiled chats remain grouped by date using the existing labels.
- Chat rename keeps the existing chat-title update flow and updates the local
  list after success.
- Chat delete keeps the existing confirmation dialog and removes the chat id
  from all folders after the server deletion succeeds.
- Dragging over a folder changes its background and announces the drop target;
  dropping persists the new membership and clears the drag state.

## Error Handling

`localStorage` read and write failures leave the in-memory UI usable. Invalid
stored JSON falls back to an empty folder list. Server chat deletion keeps its
current toast and error behavior; local membership is only removed after the
existing delete request completes.

## Verification

Add unit coverage for folder preference normalization and membership updates.
Add Playwright coverage for creating and renaming a folder, dragging a chat
into and out of a folder, deleting a folder without deleting its chat, and
deleting a chat while it is filed. Run focused UI tests, type checking, and
format checks before delivery.
