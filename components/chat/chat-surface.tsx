"use client";

import { usePathname } from "next/navigation";
import { isChatSurfacePath } from "@/lib/chat/routes";
import { ChatShell } from "./shell";

export function ChatSurface() {
  return isChatSurfacePath(usePathname()) ? <ChatShell /> : null;
}
