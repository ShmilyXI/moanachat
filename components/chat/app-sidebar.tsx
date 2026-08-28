"use client";

import {
  BotIcon,
  FolderPlusIcon,
  Grid2X2Icon,
  ImageIcon,
  MessageSquareIcon,
  PanelLeftIcon,
  PenSquareIcon,
  RssIcon,
  SearchIcon,
  TrashIcon,
  UsersRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { LanguageSwitcher } from "@/components/chat/language-switcher";
import {
  getChatHistoryPaginationKey,
  SidebarHistory,
} from "@/components/chat/sidebar-history";
import { SidebarUserNav } from "@/components/chat/sidebar-user-nav";
import { useLocale } from "@/components/locale-provider";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const { t } = useLocale();
  const router = useRouter();
  const { isMobile, setOpenMobile, toggleSidebar } = useSidebar();
  const { mutate } = useSWRConfig();
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [folders, setFolders] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("moanachat-folders");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFolders(
            parsed.filter((value): value is string => typeof value === "string")
          );
        }
      }
    } catch {
      // Folder labels are optional local preferences.
    }
  }, []);

  const closeMobile = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleNewChat = useCallback(() => {
    setOpenMobile(false);
    router.push("/");
  }, [router, setOpenMobile]);

  const handleShowDeleteAllDialog = useCallback(() => {
    setShowDeleteAllDialog(true);
  }, []);

  const handleSearch = useCallback(() => {
    router.push("/search");
  }, [router]);

  const handleAddFolder = useCallback(() => {
    const nextLabel = `${t("chat.sidebar.newFolder")} ${folders.length + 1}`;
    const nextFolders = [...folders, nextLabel];
    setFolders(nextFolders);
    try {
      window.localStorage.setItem(
        "moanachat-folders",
        JSON.stringify(nextFolders)
      );
    } catch {
      // Folder labels remain usable for the current session.
    }
  }, [folders, t]);

  const handleDeleteAll = useCallback(() => {
    setShowDeleteAllDialog(false);
    router.replace("/");
    mutate(unstable_serialize(getChatHistoryPaginationKey), [], {
      revalidate: false,
    });

    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
      method: "DELETE",
    });

    toast.success(t("chat.deleteAll.success"));
  }, [mutate, router, t]);

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-0 pt-3">
          <SidebarMenu>
            <SidebarMenuItem className="flex flex-row items-center justify-between">
              <div className="group/logo relative flex items-center justify-center">
                <SidebarMenuButton
                  asChild
                  className="size-8 !px-0 items-center justify-center group-data-[collapsible=icon]:group-hover/logo:opacity-0"
                  tooltip={t("chat.brand")}
                >
                  <Link href="/" onClick={closeMobile}>
                    <MessageSquareIcon className="size-4 text-sidebar-foreground/50" />
                  </Link>
                </SidebarMenuButton>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      className="pointer-events-none absolute inset-0 size-8 opacity-0 group-data-[collapsible=icon]:pointer-events-auto group-data-[collapsible=icon]:group-hover/logo:opacity-100"
                      onClick={handleToggleSidebar}
                    >
                      <PanelLeftIcon className="size-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent className="hidden md:block" side="right">
                    {t("chat.sidebar.open")}
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <SidebarTrigger className="text-sidebar-foreground/60 transition-colors duration-150 hover:text-sidebar-foreground" />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="pt-1">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-9 rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    onClick={handleSearch}
                    tooltip={t("chat.sidebar.search")}
                  >
                    <SearchIcon className="size-4" />
                    <span className="text-[13px]">
                      {t("chat.sidebar.search")}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {(
                  [
                    { href: "/", icon: MessageSquareIcon, key: "chat" },
                    { href: "/chat/agent", icon: BotIcon, key: "agent" },
                    { href: "/studio/image", icon: ImageIcon, key: "studio" },
                    { href: "/feed", icon: RssIcon, key: "feed" },
                  ] as const
                ).map(({ href, icon: Icon, key }) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      asChild
                      className="h-9 rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      tooltip={t(`chat.nav.${key}` as const)}
                    >
                      <Link href={href} onClick={closeMobile}>
                        <Icon className="size-4" />
                        <span className="text-[13px]">
                          {t(`chat.nav.${key}` as const)}
                        </span>
                        {key === "agent" && !isMobile ? (
                          <span className="ml-auto rounded-full bg-violet-200 px-1.5 py-0.5 text-[10px] font-medium text-violet-800 dark:bg-violet-300/20 dark:text-violet-200">
                            {t("chat.new")}
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-9 rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    tooltip={t("chat.nav.characters")}
                  >
                    <Link href="/character-chat" onClick={closeMobile}>
                      <UsersRoundIcon className="size-4" />
                      <span className="text-[13px]">
                        {t("chat.nav.characters")}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="h-9 rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    tooltip={t("chat.nav.api")}
                  >
                    <Link href="/api-dashboard" onClick={closeMobile}>
                      <Grid2X2Icon className="size-4" />
                      <span className="text-[13px]">{t("chat.nav.api")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="pt-0">
            <SidebarGroupContent>
              <div className="flex items-center justify-between px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden">
                <span>{t("chat.sidebar.folders")}</span>
                <button
                  aria-label={t("chat.sidebar.addFolder")}
                  className="rounded p-1 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  onClick={handleAddFolder}
                  type="button"
                >
                  <FolderPlusIcon className="size-3.5" />
                </button>
              </div>
              {folders.length > 0 ? (
                <SidebarMenu className="group-data-[collapsible=icon]:hidden">
                  {folders.map((folder) => (
                    <SidebarMenuItem key={folder}>
                      <SidebarMenuButton className="h-8 rounded-lg text-[13px] text-sidebar-foreground/60">
                        <FolderPlusIcon className="size-3.5" />
                        <span className="truncate">{folder}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              ) : null}
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="pt-0">
            <div className="flex items-center justify-between px-2 pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/45 group-data-[collapsible=icon]:hidden">
              <span>{t("chat.sidebar.chats")}</span>
              <PenSquareIcon className="size-3.5" />
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className="h-8 rounded-lg border border-sidebar-border text-[13px] text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    onClick={handleNewChat}
                    tooltip={t("chat.new")}
                  >
                    <PenSquareIcon className="size-4" />
                    <span className="font-medium">{t("chat.new")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {user ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      className="rounded-lg text-sidebar-foreground/40 transition-colors duration-150 hover:bg-destructive/10 hover:text-destructive"
                      onClick={handleShowDeleteAllDialog}
                      tooltip={t("chat.deleteAll")}
                    >
                      <TrashIcon className="size-4" />
                      <span className="text-[13px]">{t("chat.deleteAll")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup className="pt-0 group-data-[collapsible=icon]:hidden">
            <SidebarGroupContent>
              <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 px-3 py-3 text-xs text-sidebar-foreground/70">
                <p className="font-medium text-sidebar-foreground">
                  {t("chat.sidebar.characters")}
                </p>
                <p className="mt-1 leading-relaxed">
                  {t("chat.sidebar.charactersEmpty")}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                  <Link
                    className="underline underline-offset-2 hover:text-sidebar-foreground"
                    href="/character-chat/public"
                  >
                    {t("chat.sidebar.browseCharacters")}
                  </Link>
                  <Link
                    className="underline underline-offset-2 hover:text-sidebar-foreground"
                    href="/character-chat"
                  >
                    {t("chat.sidebar.createCharacter")}
                  </Link>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarHistory user={user} />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border pt-2 pb-3">
          <LanguageSwitcher />
          {user ? <SidebarUserNav user={user} /> : null}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <AlertDialog
        onOpenChange={setShowDeleteAllDialog}
        open={showDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.deleteAll.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.deleteAll.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("chat.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll}>
              {t("chat.deleteAll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
