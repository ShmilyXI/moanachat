// biome-ignore-all lint/a11y/noNoninteractiveElementInteractions: folder drop targets use native drag events
// biome-ignore-all lint/a11y/noStaticElementInteractions: folder drop targets use native drag events
// biome-ignore-all lint/performance/noJsxPropsBind: folder controls bind handlers to their folder id
"use client";

import { isToday, isYesterday, subMonths, subWeeks } from "date-fns";
import { motion } from "framer-motion";
import {
  CheckIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderPlusIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import useSWRInfinite from "swr/infinite";
import { useLocale } from "@/components/locale-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  useSidebar,
} from "@/components/ui/sidebar";
import type { ChatFolder } from "@/lib/chat/folders";
import { removeChatFromHistory } from "@/lib/chat/history";
import type { Chat } from "@/lib/db/schema";
import { fetcher } from "@/lib/utils";
import { LoaderIcon } from "./icons";
import { ChatItem } from "./sidebar-history-item";

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

export type ChatHistory = {
  chats: Chat[];
  hasMore: boolean;
};

type SidebarHistoryProps = {
  createFolder: (name: string) => string;
  deleteFolder: (folderId: string) => void;
  folders: ChatFolder[];
  moveChatToFolder: (folderId: string, chatId: string) => void;
  renameFolder: (folderId: string, name: string) => void;
  toggleFolder: (folderId: string) => void;
  unfileChat: (chatId: string) => void;
  user: User | undefined;
};

const PAGE_SIZE = 20;

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.createdAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      lastMonth: [],
      lastWeek: [],
      older: [],
      today: [],
      yesterday: [],
    } as GroupedChats
  );
};

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) {
    return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?limit=${PAGE_SIZE}`;
  }

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) {
    return null;
  }

  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

export function SidebarHistory({
  createFolder,
  deleteFolder,
  folders,
  moveChatToFolder,
  renameFolder,
  toggleFolder,
  unfileChat,
  user,
}: SidebarHistoryProps) {
  const { t } = useLocale();
  const { setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const id = pathname?.startsWith("/chat/") ? pathname.split("/")[2] : null;

  const {
    data: paginatedChatHistories,
    setSize,
    isValidating,
    isLoading,
    mutate,
  } = useSWRInfinite<ChatHistory>(
    user ? getChatHistoryPaginationKey : () => null,
    fetcher,
    { fallbackData: [], revalidateOnFocus: false }
  );

  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [folderDraft, setFolderDraft] = useState<{
    id?: string;
    mode: "create" | "rename";
    name: string;
  } | null>(null);
  const [folderDeleteId, setFolderDeleteId] = useState<string | null>(null);
  const [showFolderDeleteDialog, setShowFolderDeleteDialog] = useState(false);

  const hasReachedEnd = paginatedChatHistories
    ? paginatedChatHistories.some((page) => page.hasMore === false)
    : false;

  const hasEmptyChatHistory = paginatedChatHistories
    ? paginatedChatHistories.every((page) => page.chats.length === 0)
    : false;

  const handleDelete = useCallback(async () => {
    const chatToDelete = deleteId;
    const isCurrentChat = pathname === `/chat/${chatToDelete}`;

    setShowDeleteDialog(false);

    await fetch(
      `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/chat?id=${chatToDelete}`,
      { method: "DELETE" }
    );

    await mutate(
      (chatHistories) =>
        removeChatFromHistory(chatHistories, chatToDelete ?? ""),
      { revalidate: false }
    );
    unfileChat(chatToDelete ?? "");

    if (isCurrentChat) {
      router.replace("/");
    }

    toast.success(t("chat.delete.success"));
  }, [deleteId, mutate, pathname, router, t, unfileChat]);

  const handleShowDeleteDialog = useCallback((chatId: string) => {
    setDeleteId(chatId);
    setShowDeleteDialog(true);
  }, []);

  const handleCreateFolder = useCallback(() => {
    setFolderDraft({ mode: "create", name: t("chat.sidebar.newFolder") });
  }, [t]);

  const handleRenameFolder = useCallback((folder: ChatFolder) => {
    setFolderDraft({ id: folder.id, mode: "rename", name: folder.name });
  }, []);

  const handleCancelFolderDraft = useCallback(() => {
    setFolderDraft(null);
  }, []);

  const handleConfirmFolderDraft = useCallback(() => {
    if (!folderDraft?.name.trim()) {
      return;
    }

    if (folderDraft.mode === "create") {
      createFolder(folderDraft.name);
    } else if (folderDraft.id) {
      renameFolder(folderDraft.id, folderDraft.name);
    }

    setFolderDraft(null);
  }, [createFolder, folderDraft, renameFolder]);

  const handleFolderKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleConfirmFolderDraft();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        handleCancelFolderDraft();
      }
    },
    [handleCancelFolderDraft, handleConfirmFolderDraft]
  );

  const handleShowFolderDeleteDialog = useCallback((folderId: string) => {
    setFolderDeleteId(folderId);
    setShowFolderDeleteDialog(true);
  }, []);

  const handleDeleteFolder = useCallback(() => {
    if (!folderDeleteId) {
      return;
    }

    deleteFolder(folderDeleteId);
    setFolderDeleteId(null);
    setShowFolderDeleteDialog(false);
    toast.success(t("chat.folder.delete.success"));
  }, [deleteFolder, folderDeleteId, t]);

  const readDraggedChatId = useCallback(
    (event: React.DragEvent<HTMLElement>) =>
      event.dataTransfer.getData("text/plain") ||
      event.dataTransfer.getData("text/chat-id"),
    []
  );

  const handleFolderDragOver = useCallback(
    (event: React.DragEvent<HTMLElement>, folderId: string) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDragOverFolderId(folderId);
    },
    []
  );

  const handleFolderDrop = useCallback(
    (event: React.DragEvent<HTMLElement>, folderId: string) => {
      event.preventDefault();
      const chatId = readDraggedChatId(event);
      if (chatId) {
        moveChatToFolder(folderId, chatId);
        toast.success(t("chat.folder.move.success"));
      }
      setDragOverFolderId(null);
    },
    [moveChatToFolder, readDraggedChatId, t]
  );

  const handleFolderDragLeave = useCallback(
    (event: React.DragEvent<HTMLElement>, folderId: string) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setDragOverFolderId((current) =>
          current === folderId ? null : current
        );
      }
    },
    []
  );

  const handleUnfiledDragOver = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDragOverFolderId("__unfiled__");
    },
    []
  );

  const handleUnfiledDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      const chatId = readDraggedChatId(event);
      if (chatId) {
        unfileChat(chatId);
        toast.success(t("chat.folder.unfile.success"));
      }
      setDragOverFolderId(null);
    },
    [readDraggedChatId, t, unfileChat]
  );

  const handleViewportEnter = useCallback(() => {
    if (!isValidating && !hasReachedEnd) {
      setSize((size) => size + 1);
    }
  }, [hasReachedEnd, isValidating, setSize]);

  const chatsFromHistory =
    paginatedChatHistories?.flatMap(
      (paginatedChatHistory) => paginatedChatHistory.chats
    ) ?? [];
  const chatsById = new Map(chatsFromHistory.map((chat) => [chat.id, chat]));
  const filedChatIds = new Set(folders.flatMap((folder) => folder.chatIds));
  const unfiledChats = chatsFromHistory.filter(
    (chat) => !filedChatIds.has(chat.id)
  );
  const groupedChats = groupChatsByDate(unfiledChats);

  const renderChatItem = (chat: Chat, testId?: string) => (
    <ChatItem
      chat={chat}
      isActive={chat.id === id}
      key={chat.id}
      onDelete={handleShowDeleteDialog}
      setOpenMobile={setOpenMobile}
      testId={testId}
    />
  );

  const renderFolder = (folder: ChatFolder) => {
    const folderChats = folder.chatIds
      .map((chatId) => chatsById.get(chatId))
      .filter((chat): chat is Chat => Boolean(chat));
    const isEditing =
      folderDraft?.mode === "rename" && folderDraft.id === folder.id;

    return (
      <section
        aria-label={`${t("chat.folder.dropTarget")} ${folder.name}`}
        className={`group/sidebar-folder rounded-lg transition-colors ${
          dragOverFolderId === folder.id
            ? "bg-sidebar-accent/80 ring-1 ring-sidebar-ring/40"
            : ""
        }`}
        data-testid={`chat-folder-${folder.id}`}
        key={folder.id}
        onDragLeave={(event) => handleFolderDragLeave(event, folder.id)}
        onDragOver={(event) => handleFolderDragOver(event, folder.id)}
        onDrop={(event) => handleFolderDrop(event, folder.id)}
      >
        <div className="flex min-h-8 items-center gap-1 px-1">
          <button
            aria-expanded={folder.isExpanded}
            aria-label={`${t("chat.folder.toggle")} ${folder.name}`}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[13px] text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            data-testid={`chat-folder-toggle-${folder.id}`}
            onClick={() => toggleFolder(folder.id)}
            type="button"
          >
            <ChevronDownIcon
              className={`size-3.5 shrink-0 transition-transform ${
                folder.isExpanded ? "" : "-rotate-90"
              }`}
            />
            <FolderIcon className="size-3.5 shrink-0" />
            {isEditing ? (
              <input
                aria-label={t("chat.folder.name")}
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
                data-testid={`chat-folder-name-input-${folder.id}`}
                onChange={(event) =>
                  setFolderDraft((current) =>
                    current ? { ...current, name: event.target.value } : current
                  )
                }
                onClick={(event) => event.stopPropagation()}
                onKeyDown={handleFolderKeyDown}
                value={folderDraft.name}
              />
            ) : (
              <span className="min-w-0 flex-1 truncate">{folder.name}</span>
            )}
          </button>
          <div className="flex shrink-0 items-center gap-0.5">
            {isEditing ? (
              <>
                <button
                  aria-label={t("chat.folder.confirm")}
                  className="rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  data-testid={`chat-folder-confirm-${folder.id}`}
                  onClick={handleConfirmFolderDraft}
                  type="button"
                >
                  <CheckIcon className="size-3.5" />
                </button>
                <button
                  aria-label={t("chat.folder.cancel")}
                  className="rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  data-testid={`chat-folder-cancel-${folder.id}`}
                  onClick={handleCancelFolderDraft}
                  type="button"
                >
                  <XIcon className="size-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  aria-label={`${t("chat.folder.rename")} ${folder.name}`}
                  className="rounded-md p-1 text-sidebar-foreground/45 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  data-testid={`chat-folder-rename-${folder.id}`}
                  onClick={() => handleRenameFolder(folder)}
                  type="button"
                >
                  <PencilIcon className="size-3.5" />
                </button>
                <button
                  aria-label={`${t("chat.folder.delete")} ${folder.name}`}
                  className="rounded-md p-1 text-sidebar-foreground/45 transition-colors hover:bg-destructive/10 hover:text-destructive"
                  data-testid={`chat-folder-delete-${folder.id}`}
                  onClick={() => handleShowFolderDeleteDialog(folder.id)}
                  type="button"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {folder.isExpanded ? (
          <SidebarMenu className="gap-0 pl-3">
            {folderChats.length > 0 ? (
              folderChats.map((chat) => (
                <ChatItem
                  chat={chat}
                  containerTestId={`chat-folder-item-${folder.id}-${chat.id}`}
                  isActive={chat.id === id}
                  key={chat.id}
                  onDelete={handleShowDeleteDialog}
                  setOpenMobile={setOpenMobile}
                  testId={`chat-item-${chat.id}`}
                />
              ))
            ) : (
              <div
                className="px-3 py-1.5 text-[11px] text-sidebar-foreground/40"
                data-testid={`chat-folder-empty-${folder.id}`}
              >
                {t("chat.folder.empty")}
              </div>
            )}
          </SidebarMenu>
        ) : null}
      </section>
    );
  };

  const renderDateGroup = (label: string, chats: Chat[]) =>
    chats.length > 0 ? (
      <div key={label}>
        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
          {label}
        </div>
        {chats.map((chat) => renderChatItem(chat, `chat-unfiled-${chat.id}`))}
      </div>
    ) : null;

  const folderSection = (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden pt-0">
      <div className="flex items-center justify-between px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/45">
        <span>{t("chat.sidebar.folders")}</span>
        <button
          aria-label={t("chat.sidebar.addFolder")}
          className="rounded p-1 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          data-testid="chat-create-folder"
          onClick={handleCreateFolder}
          type="button"
        >
          <FolderPlusIcon className="size-3.5" />
        </button>
      </div>
      <SidebarGroupContent>
        {folderDraft?.mode === "create" ? (
          <div className="mb-1 flex min-h-8 items-center gap-1 rounded-lg bg-sidebar-accent/50 px-1">
            <FolderIcon className="ml-1 size-3.5 shrink-0 text-sidebar-foreground/60" />
            <input
              aria-label={t("chat.folder.name")}
              autoFocus
              className="min-w-0 flex-1 bg-transparent px-1.5 py-1 text-[13px] outline-none"
              data-testid="chat-folder-name-input"
              onChange={(event) =>
                setFolderDraft((current) =>
                  current ? { ...current, name: event.target.value } : current
                )
              }
              onKeyDown={handleFolderKeyDown}
              value={folderDraft.name}
            />
            <button
              aria-label={t("chat.folder.confirm")}
              className="rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              data-testid="chat-folder-confirm"
              onClick={handleConfirmFolderDraft}
              type="button"
            >
              <CheckIcon className="size-3.5" />
            </button>
            <button
              aria-label={t("chat.folder.cancel")}
              className="rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              data-testid="chat-folder-cancel"
              onClick={handleCancelFolderDraft}
              type="button"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        ) : null}
        <div className="flex flex-col gap-0.5" data-testid="chat-folders">
          {folders.map(renderFolder)}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  if (!user) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupContent>
          <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-[13px] text-sidebar-foreground/60">
            {t("chat.history.guest")}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    return (
      <>
        {folderSection}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
            {t("chat.history")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex flex-col gap-0.5 px-1">
              {[44, 32, 28, 64, 52].map((item) => (
                <div
                  className="flex h-8 items-center gap-2 rounded-lg px-2"
                  key={item}
                >
                  <div
                    className="h-3 max-w-(--skeleton-width) flex-1 animate-pulse rounded-md bg-sidebar-foreground/[0.06]"
                    style={
                      {
                        "--skeleton-width": `${item}%`,
                      } as React.CSSProperties
                    }
                  />
                </div>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </>
    );
  }

  if (hasEmptyChatHistory) {
    return (
      <>
        {folderSection}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
            {t("chat.history")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex w-full flex-row items-center justify-center gap-2 px-2 text-[13px] text-sidebar-foreground/60">
              {t("chat.history.empty")}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </>
    );
  }

  return (
    <>
      {folderSection}
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/70">
          {t("chat.history")}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <section
            aria-label={t("chat.folder.unfiledDropTarget")}
            className={`mb-2 rounded-md px-2 py-1 text-[11px] text-sidebar-foreground/45 transition-colors ${
              dragOverFolderId === "__unfiled__" ? "bg-sidebar-accent" : ""
            }`}
            data-testid="chat-unfiled-dropzone"
            onDragOver={handleUnfiledDragOver}
            onDrop={handleUnfiledDrop}
          >
            {t("chat.folder.unfiled")}
          </section>
          <SidebarMenu>
            <div className="flex flex-col gap-4">
              {renderDateGroup(t("chat.history.today"), groupedChats.today)}
              {renderDateGroup(
                t("chat.history.yesterday"),
                groupedChats.yesterday
              )}
              {renderDateGroup(
                t("chat.history.lastWeek"),
                groupedChats.lastWeek
              )}
              {renderDateGroup(
                t("chat.history.lastMonth"),
                groupedChats.lastMonth
              )}
              {renderDateGroup(t("chat.history.older"), groupedChats.older)}
            </div>
          </SidebarMenu>

          <motion.div onViewportEnter={handleViewportEnter} />

          {hasReachedEnd ? null : (
            <div className="mt-1 flex flex-row items-center gap-2 px-4 py-2 text-sidebar-foreground/50">
              <div className="animate-spin">
                <LoaderIcon />
              </div>
              <div className="text-[11px]">{t("chat.history.loading")}</div>
            </div>
          )}
        </SidebarGroupContent>
      </SidebarGroup>

      <AlertDialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("chat.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {t("chat.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        onOpenChange={setShowFolderDeleteDialog}
        open={showFolderDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.folder.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.folder.delete.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("chat.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder}>
              {t("chat.continue")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
