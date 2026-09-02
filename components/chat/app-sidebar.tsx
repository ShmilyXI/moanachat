"use client";

import {
  Grid2X2Icon,
  MessageSquareIcon,
  PanelLeftIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { useCallback } from "react";
import { LanguageSwitcher } from "@/components/chat/language-switcher";
import { SidebarHistory } from "@/components/chat/sidebar-history";
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
import { useChatFolders } from "@/hooks/use-chat-folders";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function AppSidebar({ user }: { user: User | undefined }) {
  const { t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const {
    createFolder,
    deleteFolder,
    folders,
    moveChatToFolder,
    renameFolder,
    toggleFolder,
    unfileChat,
  } = useChatFolders();

  const closeMobile = useCallback(() => {
    setOpenMobile(false);
  }, [setOpenMobile]);

  const handleToggleSidebar = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const logoHref = pathname && pathname !== "/" ? pathname : "/";

  const handleSearch = useCallback(() => {
    router.push("/search");
  }, [router]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="pb-0 pt-3">
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-row items-center justify-between">
            <div className="group/logo relative flex items-center justify-center">
              <SidebarMenuButton
                asChild
                className="h-9 min-w-0 flex-1 justify-start gap-2 px-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:!px-0 group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:group-hover/logo:opacity-0"
                tooltip={t("chat.brand")}
              >
                <Link
                  data-testid="chat-brand"
                  href={logoHref}
                  onClick={closeMobile}
                >
                  <MessageSquareIcon className="size-4 text-sidebar-foreground/50" />
                  <span className="font-serif text-base italic tracking-tight group-data-[collapsible=icon]:hidden">
                    Moana
                  </span>
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
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="h-9 rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  tooltip={t("chat.nav.chat")}
                >
                  <Link href="/" onClick={closeMobile}>
                    <MessageSquareIcon className="size-4" />
                    <span className="text-[13px]">{t("chat.nav.chat")}</span>
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
        <SidebarHistory
          createFolder={createFolder}
          deleteFolder={deleteFolder}
          folders={folders}
          moveChatToFolder={moveChatToFolder}
          renameFolder={renameFolder}
          toggleFolder={toggleFolder}
          unfileChat={unfileChat}
          user={user}
        />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border pt-2 pb-3">
        <LanguageSwitcher />
        {user ? <SidebarUserNav user={user} /> : null}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
