"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addChatToFolder,
  addFolder,
  type ChatFolder,
  type ChatFolderPreferences,
  emptyFolderPreferences,
  FOLDER_STORAGE_KEY,
  createFolder as makeFolder,
  normalizeFolderPreferences,
  removeChatFromFolders,
  deleteFolder as removeFolder,
  toggleFolder as toggleFolderState,
  renameFolder as updateFolderName,
} from "@/lib/chat/folders";

export type FolderStorage = Pick<Storage, "getItem" | "setItem">;

function getBrowserStorage(): FolderStorage | undefined {
  if (typeof window === "undefined") {
    return;
  }

  try {
    return window.localStorage;
  } catch {
    // Storage can be unavailable in privacy-restricted contexts.
  }
}

export function loadStoredFolderPreferences(
  storage = getBrowserStorage()
): ChatFolderPreferences {
  if (!storage) {
    return emptyFolderPreferences();
  }

  try {
    return normalizeFolderPreferences(storage.getItem(FOLDER_STORAGE_KEY));
  } catch {
    return emptyFolderPreferences();
  }
}

export function persistFolderPreferences(
  storage: FolderStorage | undefined,
  preferences: ChatFolderPreferences
) {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Folder state remains usable for the current session.
  }
}

function createFolderId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `folder-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useChatFolders() {
  const [preferences, setPreferences] = useState(emptyFolderPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setPreferences(loadStoredFolderPreferences());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      persistFolderPreferences(getBrowserStorage(), preferences);
    }
  }, [isLoaded, preferences]);

  const updatePreferences = useCallback(
    (update: (current: ChatFolderPreferences) => ChatFolderPreferences) => {
      setPreferences(update);
    },
    []
  );

  const createFolder = useCallback(
    (name: string) => {
      const folder: ChatFolder = makeFolder(name, createFolderId());
      updatePreferences((current) => addFolder(current, folder));
      return folder.id;
    },
    [updatePreferences]
  );

  const renameFolder = useCallback(
    (folderId: string, name: string) => {
      updatePreferences((current) => updateFolderName(current, folderId, name));
    },
    [updatePreferences]
  );

  const toggleFolder = useCallback(
    (folderId: string) => {
      updatePreferences((current) => toggleFolderState(current, folderId));
    },
    [updatePreferences]
  );

  const deleteFolder = useCallback(
    (folderId: string) => {
      updatePreferences((current) => removeFolder(current, folderId));
    },
    [updatePreferences]
  );

  const moveChatToFolder = useCallback(
    (folderId: string, chatId: string) => {
      updatePreferences((current) =>
        addChatToFolder(current, folderId, chatId)
      );
    },
    [updatePreferences]
  );

  const unfileChat = useCallback(
    (chatId: string) => {
      updatePreferences((current) => removeChatFromFolders(current, chatId));
    },
    [updatePreferences]
  );

  return {
    createFolder,
    deleteFolder,
    folders: preferences.folders,
    isLoaded,
    moveChatToFolder,
    renameFolder,
    toggleFolder,
    unfileChat,
  };
}
