export const FOLDER_STORAGE_KEY = "moanachat-folders";
export const FOLDER_PREFERENCES_VERSION = 1 as const;

export type ChatFolder = {
  id: string;
  name: string;
  chatIds: string[];
  isExpanded: boolean;
};

export type ChatFolderPreferences = {
  version: typeof FOLDER_PREFERENCES_VERSION;
  folders: ChatFolder[];
};

export function emptyFolderPreferences(): ChatFolderPreferences {
  return {
    folders: [],
    version: FOLDER_PREFERENCES_VERSION,
  };
}

export function createFolder(
  name: string,
  id: string,
  isExpanded = true
): ChatFolder {
  return {
    chatIds: [],
    id,
    isExpanded,
    name: name.trim() || "New folder",
  };
}

function parseFolderInput(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function uniqueId(preferred: string, usedIds: Set<string>, fallback: string) {
  let id = preferred || fallback;
  let suffix = 1;

  while (usedIds.has(id)) {
    id = `${fallback}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);
  return id;
}

export function normalizeFolderPreferences(
  value: unknown,
  knownChatIds?: Iterable<string>
): ChatFolderPreferences {
  const parsed = parseFolderInput(value);
  const rawFolders = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        "version" in parsed &&
        parsed.version === FOLDER_PREFERENCES_VERSION &&
        "folders" in parsed &&
        Array.isArray(parsed.folders)
      ? parsed.folders
      : null;

  if (!rawFolders) {
    return emptyFolderPreferences();
  }

  const allowedChatIds = knownChatIds ? new Set(knownChatIds) : null;
  const usedFolderIds = new Set<string>();
  const assignedChatIds = new Set<string>();
  const folders: ChatFolder[] = [];

  rawFolders.forEach((rawFolder, index) => {
    const legacyName = typeof rawFolder === "string" ? rawFolder : null;
    const record =
      rawFolder && typeof rawFolder === "object"
        ? (rawFolder as Record<string, unknown>)
        : null;
    const name = legacyName ?? record?.name;

    if (typeof name !== "string" || !name.trim()) {
      return;
    }

    const preferredId = typeof record?.id === "string" ? record.id : "";
    const id = uniqueId(preferredId, usedFolderIds, `legacy-${index}`);
    const rawChatIds = Array.isArray(record?.chatIds) ? record.chatIds : [];
    const chatIds = rawChatIds.filter((chatId): chatId is string => {
      if (typeof chatId !== "string" || assignedChatIds.has(chatId)) {
        return false;
      }

      if (allowedChatIds && !allowedChatIds.has(chatId)) {
        return false;
      }

      assignedChatIds.add(chatId);
      return true;
    });

    folders.push({
      chatIds,
      id,
      isExpanded: record?.isExpanded !== false,
      name: name.trim(),
    });
  });

  return {
    folders,
    version: FOLDER_PREFERENCES_VERSION,
  };
}

export function addFolder(
  preferences: ChatFolderPreferences,
  folder: ChatFolder
): ChatFolderPreferences {
  return {
    ...preferences,
    folders: [
      ...preferences.folders,
      { ...folder, chatIds: [...folder.chatIds] },
    ],
  };
}

export function addChatToFolder(
  preferences: ChatFolderPreferences,
  folderId: string,
  chatId: string
): ChatFolderPreferences {
  return {
    ...preferences,
    folders: preferences.folders.map((folder) => ({
      ...folder,
      chatIds:
        folder.id === folderId
          ? [...folder.chatIds.filter((id) => id !== chatId), chatId]
          : folder.chatIds.filter((id) => id !== chatId),
    })),
  };
}

export function removeChatFromFolders(
  preferences: ChatFolderPreferences,
  chatId: string
): ChatFolderPreferences {
  return {
    ...preferences,
    folders: preferences.folders.map((folder) => ({
      ...folder,
      chatIds: folder.chatIds.filter((id) => id !== chatId),
    })),
  };
}

export function renameFolder(
  preferences: ChatFolderPreferences,
  folderId: string,
  name: string
): ChatFolderPreferences {
  const nextName = name.trim();

  if (!nextName) {
    return preferences;
  }

  return {
    ...preferences,
    folders: preferences.folders.map((folder) =>
      folder.id === folderId ? { ...folder, name: nextName } : folder
    ),
  };
}

export function toggleFolder(
  preferences: ChatFolderPreferences,
  folderId: string
): ChatFolderPreferences {
  return {
    ...preferences,
    folders: preferences.folders.map((folder) =>
      folder.id === folderId
        ? { ...folder, isExpanded: !folder.isExpanded }
        : folder
    ),
  };
}

export function deleteFolder(
  preferences: ChatFolderPreferences,
  folderId: string
): ChatFolderPreferences {
  return {
    ...preferences,
    folders: preferences.folders.filter((folder) => folder.id !== folderId),
  };
}
