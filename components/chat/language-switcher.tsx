"use client";

import { LanguagesIcon } from "lucide-react";
import { useCallback } from "react";
import { useLocale } from "@/components/locale-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { Locale } from "@/lib/i18n";
import { CheckCircleFillIcon } from "./icons";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  const selectEnglish = useCallback(() => setLocale("en"), [setLocale]);
  const selectChinese = useCallback(() => setLocale("zh"), [setLocale]);

  const options: Array<{
    value: Locale;
    label: string;
    onSelect: () => void;
  }> = [
    { label: t("language.english"), onSelect: selectEnglish, value: "en" },
    { label: t("language.chinese"), onSelect: selectChinese, value: "zh" },
  ];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="h-8 rounded-lg text-sidebar-foreground/70 transition-colors duration-150 hover:text-sidebar-foreground"
              data-testid="language-switcher"
              tooltip={t("language.switcher")}
            >
              <LanguagesIcon className="size-4" />
              <span className="truncate text-[13px]">
                {locale === "zh"
                  ? t("language.chinese")
                  : t("language.english")}
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top">
            {options.map((option) => (
              <DropdownMenuItem
                className="cursor-pointer justify-between gap-4 text-[13px]"
                data-testid={`language-option-${option.value}`}
                key={option.value}
                onSelect={option.onSelect}
              >
                <span>{option.label}</span>
                {locale === option.value ? <CheckCircleFillIcon /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
