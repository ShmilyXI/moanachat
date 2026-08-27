# Bilingual Chat UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add browser-detected Chinese/English UI switching to the standalone `moanachat` chat experience, with a locally persisted manual choice.

**Architecture:** A typed translation dictionary in `lib/i18n` will expose locale detection and interpolation helpers. A client-side `LocaleProvider` will sit inside the existing root providers, detect the browser locale after hydration, persist manual changes, and update the document language. Chat components will consume `t()` for static UI copy while preserving user content, model output, API payloads, and backend messages.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Radix-based UI components, Node `node:test` through the existing `tsx` dependency, and Playwright for browser coverage.

---

### Task 1: Build The Locale Runtime And Dictionaries

**Files:**
- Create: `lib/i18n/locales/en.ts`
- Create: `lib/i18n/locales/zh.ts`
- Create: `lib/i18n/index.ts`
- Create: `lib/i18n/index.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Define the typed translation contract and English source dictionary**

Create `lib/i18n/locales/en.ts` with a flat `as const` dictionary. Use stable namespaced keys and include every static string that will be rendered by the chat UI, including language controls, greeting, sidebar/history labels, visibility labels, chat actions, composer placeholders and file errors, message action toasts, tool/reasoning statuses, artifact controls, and accessibility labels. Keep model/provider names and user-authored text out of the dictionary.

```ts
export const en = {
  "language.switcher": "Language",
  "language.english": "English",
  "language.chinese": "Chinese",
  "chat.brand": "Chatbot",
  "chat.greeting.title": "What can I help with?",
  "chat.greeting.description": "Ask a question, write code, or explore ideas.",
  "chat.new": "New chat",
  "chat.deleteAll": "Delete all",
  "chat.deleteAll.title": "Delete all chats?",
  "chat.delete.title": "Are you absolutely sure?",
  "chat.deleteAll.description": "This action cannot be undone. This will permanently delete all your chats and remove them from our servers.",
  "chat.delete.description": "This action cannot be undone. This will permanently delete your chat and remove it from our servers.",
  "chat.cancel": "Cancel",
  "chat.continue": "Continue",
  "chat.delete": "Delete",
  "chat.history": "History",
  "chat.history.today": "Today",
  "chat.history.yesterday": "Yesterday",
  "chat.history.lastWeek": "Last 7 days",
  "chat.history.lastMonth": "Last 30 days",
  "chat.history.older": "Older",
  "chat.history.loading": "Loading...",
  "chat.history.guest": "Login to save and revisit previous chats!",
  "chat.history.empty": "Your conversations will appear here once you start chatting!",
  "chat.sidebar.open": "Open sidebar",
  "chat.visibility.private": "Private",
  "chat.visibility.privateDescription": "Only you can access this chat",
  "chat.visibility.public": "Public",
  "chat.visibility.publicDescription": "Anyone with the link can access this chat",
  "chat.visibility.share": "Share",
  "chat.sidebar.more": "More",
  "chat.header.deploy": "Deploy with Vercel",
  "chat.composer.ask": "Ask anything...",
  "chat.composer.edit": "Edit your message...",
  "chat.composer.editing": "Editing message",
  "chat.composer.searchModels": "Search models...",
  "chat.composer.uploadFiles": "Upload files",
  "chat.composer.supportsTools": "Supports tool use",
  "chat.composer.supportsVision": "Supports vision",
  "chat.composer.supportsReasoning": "Supports reasoning",
  "chat.composer.modelUnavailable": "This model is not available in the demo.",
  "chat.composer.available": "Available",
  "chat.commands.heading": "Commands",
  "chat.commands.new": "Start a new chat",
  "chat.commands.clear": "Clear current chat",
  "chat.commands.rename": "Rename current chat",
  "chat.commands.model": "Change the AI model",
  "chat.commands.theme": "Toggle dark/light mode",
  "chat.commands.delete": "Delete current chat",
  "chat.commands.purge": "Delete all chats",
  "chat.message.copy": "Copy",
  "chat.message.edit": "Edit",
  "chat.message.previousBranch": "Previous branch",
  "chat.message.nextBranch": "Next branch",
  "chat.message.noText": "There's no text to copy!",
  "chat.message.copied": "Copied to clipboard!",
  "chat.message.upvote": "Upvote Response",
  "chat.message.downvote": "Downvote Response",
  "chat.message.upvoting": "Upvoting Response...",
  "chat.message.downvoting": "Downvoting Response...",
  "chat.message.upvoteFailed": "Failed to upvote response.",
  "chat.message.downvoteFailed": "Failed to downvote response.",
  "chat.message.waiting": "Waiting...",
  "chat.message.deny": "Deny",
  "chat.message.allow": "Allow",
  "chat.message.weatherDenied": "Weather lookup was denied.",
  "chat.artifact.errorCreate": "Error creating document:",
  "chat.artifact.errorUpdate": "Error updating document:",
  "chat.artifact.errorAction": "Failed to execute action",
  "chat.artifact.sharedUnsupported": "Viewing files in shared chats is currently not supported.",
  "chat.artifact.forDocument": "for document",
  "chat.artifact.creating": "Creating",
  "chat.artifact.created": "Created",
  "chat.artifact.updating": "Updating",
  "chat.artifact.updated": "Updated",
  "chat.artifact.addingSuggestions": "Adding suggestions",
  "chat.artifact.addedSuggestions": "Added suggestions to",
  "chat.artifact.showChanges": "Show changes",
  "chat.artifact.restore": "Restore",
  "chat.artifact.latest": "Latest",
  "chat.artifact.version": "{{current}} of {{total}}",
  "chat.artifact.fixError": "Fix error",
  "chat.suggestion.label": "Suggestion",
  "chat.console.label": "Console",
  "chat.console.resize": "Resize console",
  "chat.console.initializing": "Initializing...",
  "chat.image.generating": "Generating Image...",
  "chat.tool.parameters": "Parameters",
  "chat.tool.result": "Result",
  "chat.tool.error": "Error",
  "chat.tool.awaitingApproval": "Awaiting Approval",
  "chat.tool.responded": "Responded",
  "chat.tool.running": "Running",
  "chat.tool.pending": "Pending",
  "chat.tool.completed": "Completed",
  "chat.tool.denied": "Denied",
  "chat.reasoning.thinking": "Thinking...",
  "chat.reasoning.fewSeconds": "Thought for a few seconds",
  "chat.reasoning.seconds": "Thought for {{duration}} seconds",
  "chat.scrollToBottom": "Scroll to bottom",
  "chat.delete.success": "Chat deleted",
  "chat.deleteAll.success": "All chats deleted",
  "chat.upload.failedFile": "Failed to upload file, please try again!",
  "chat.upload.failedFiles": "Failed to upload files",
  "chat.upload.failedPastedImages": "Failed to upload pasted image(s)",
  "chat.wait.response": "Please wait for the model to finish its response!",
  "chat.auth.checking": "Checking authentication status, please try again!",
  "chat.auth.guest": "Guest",
  "chat.auth.login": "Login to your account",
  "chat.auth.signOut": "Sign out",
  "chat.theme.toggleDark": "Toggle dark mode",
  "chat.theme.toggleLight": "Toggle light mode",
  "chat.gateway.title": "Activate AI Gateway",
  "chat.gateway.description": "This application requires {{actor}} to activate Vercel AI Gateway.",
  "chat.gateway.you": "you",
  "chat.gateway.owner": "the owner",
  "chat.gateway.activate": "Activate",
} as const;

export type TranslationKey = keyof typeof en;
```

- [ ] **Step 2: Add the Chinese dictionary with compile-time key parity**

Create `lib/i18n/locales/zh.ts` by importing `TranslationKey` and exporting a `Record<TranslationKey, string>`. Translate every key from `en.ts`, keep placeholders such as `{{duration}}` and `{{actor}}` unchanged, and leave provider names and protocol terms that are proper nouns in their original form.

```ts
import type { TranslationKey } from "./en";

export const zh: Record<TranslationKey, string> = {
  "language.switcher": "语言",
  "language.english": "英文",
  "language.chinese": "中文",
  "chat.brand": "Chatbot",
  "chat.greeting.title": "今天想聊点什么？",
  "chat.greeting.description": "可以提问、写代码，或者一起探索想法。",
  "chat.new": "新建聊天",
  "chat.deleteAll": "删除全部",
  "chat.deleteAll.title": "删除全部聊天？",
  "chat.delete.title": "确定要继续吗？",
  "chat.deleteAll.description": "此操作无法撤销。所有聊天记录都会被永久删除，并从服务器移除。",
  "chat.delete.description": "此操作无法撤销。此聊天会被永久删除，并从服务器移除。",
  "chat.cancel": "取消",
  "chat.continue": "继续",
  "chat.delete": "删除",
  "chat.history": "历史记录",
  "chat.history.today": "今天",
  "chat.history.yesterday": "昨天",
  "chat.history.lastWeek": "最近 7 天",
  "chat.history.lastMonth": "最近 30 天",
  "chat.history.older": "更早",
  "chat.history.loading": "加载中...",
  "chat.history.guest": "登录后即可保存并查看之前的聊天记录！",
  "chat.history.empty": "开始聊天后，你的对话会显示在这里！",
  "chat.sidebar.open": "打开侧边栏",
  "chat.visibility.private": "私密",
  "chat.visibility.privateDescription": "只有你可以访问此聊天",
  "chat.visibility.public": "公开",
  "chat.visibility.publicDescription": "任何拥有链接的人都可以访问此聊天",
  "chat.visibility.share": "分享",
  "chat.sidebar.more": "更多",
  "chat.header.deploy": "使用 Vercel 部署",
  "chat.composer.ask": "随便问点什么...",
  "chat.composer.edit": "编辑你的消息...",
  "chat.composer.editing": "正在编辑消息",
  "chat.composer.searchModels": "搜索模型...",
  "chat.composer.uploadFiles": "上传文件",
  "chat.composer.supportsTools": "支持工具调用",
  "chat.composer.supportsVision": "支持视觉",
  "chat.composer.supportsReasoning": "支持推理",
  "chat.composer.modelUnavailable": "此模型在演示中不可用。",
  "chat.composer.available": "可用",
  "chat.commands.heading": "命令",
  "chat.commands.new": "开始新聊天",
  "chat.commands.clear": "清空当前聊天",
  "chat.commands.rename": "重命名当前聊天",
  "chat.commands.model": "更换 AI 模型",
  "chat.commands.theme": "切换深色/浅色模式",
  "chat.commands.delete": "删除当前聊天",
  "chat.commands.purge": "删除全部聊天",
  "chat.message.copy": "复制",
  "chat.message.edit": "编辑",
  "chat.message.previousBranch": "上一个分支",
  "chat.message.nextBranch": "下一个分支",
  "chat.message.noText": "没有可复制的文本！",
  "chat.message.copied": "已复制到剪贴板！",
  "chat.message.upvote": "赞成回复",
  "chat.message.downvote": "反对回复",
  "chat.message.upvoting": "正在点赞回复...",
  "chat.message.downvoting": "正在点踩回复...",
  "chat.message.upvoteFailed": "点赞回复失败。",
  "chat.message.downvoteFailed": "点踩回复失败。",
  "chat.message.waiting": "等待中...",
  "chat.message.deny": "拒绝",
  "chat.message.allow": "允许",
  "chat.message.weatherDenied": "天气查询已被拒绝。",
  "chat.artifact.errorCreate": "创建文档时出错：",
  "chat.artifact.errorUpdate": "更新文档时出错：",
  "chat.artifact.errorAction": "执行操作失败",
  "chat.artifact.sharedUnsupported": "暂不支持查看共享聊天中的文件。",
  "chat.artifact.forDocument": "针对文档",
  "chat.artifact.creating": "正在创建",
  "chat.artifact.created": "已创建",
  "chat.artifact.updating": "正在更新",
  "chat.artifact.updated": "已更新",
  "chat.artifact.addingSuggestions": "正在添加建议",
  "chat.artifact.addedSuggestions": "已添加建议到",
  "chat.artifact.showChanges": "显示更改",
  "chat.artifact.restore": "恢复",
  "chat.artifact.latest": "最新版本",
  "chat.artifact.version": "第 {{current}} 个，共 {{total}} 个",
  "chat.artifact.fixError": "修复错误",
  "chat.suggestion.label": "建议",
  "chat.console.label": "控制台",
  "chat.console.resize": "调整控制台大小",
  "chat.console.initializing": "正在初始化...",
  "chat.image.generating": "正在生成图像...",
  "chat.tool.parameters": "参数",
  "chat.tool.result": "结果",
  "chat.tool.error": "错误",
  "chat.tool.awaitingApproval": "等待批准",
  "chat.tool.responded": "已响应",
  "chat.tool.running": "运行中",
  "chat.tool.pending": "等待中",
  "chat.tool.completed": "已完成",
  "chat.tool.denied": "已拒绝",
  "chat.reasoning.thinking": "思考中...",
  "chat.reasoning.fewSeconds": "思考了几秒",
  "chat.reasoning.seconds": "思考了 {{duration}} 秒",
  "chat.scrollToBottom": "滚动到底部",
  "chat.delete.success": "聊天已删除",
  "chat.deleteAll.success": "所有聊天已删除",
  "chat.upload.failedFile": "文件上传失败，请重试！",
  "chat.upload.failedFiles": "文件上传失败",
  "chat.upload.failedPastedImages": "粘贴的图片上传失败",
  "chat.wait.response": "请等待模型完成回复！",
  "chat.auth.checking": "正在检查身份验证状态，请重试！",
  "chat.auth.guest": "访客",
  "chat.auth.login": "登录你的账户",
  "chat.auth.signOut": "退出登录",
  "chat.theme.toggleDark": "切换到深色模式",
  "chat.theme.toggleLight": "切换到浅色模式",
  "chat.gateway.title": "激活 AI Gateway",
  "chat.gateway.description": "此应用需要{{actor}}激活 Vercel AI Gateway。",
  "chat.gateway.you": "你",
  "chat.gateway.owner": "所有者",
  "chat.gateway.activate": "激活",
};
```

The final file must contain all keys rather than relying on a runtime merge, so adding a new English key produces a type error until Chinese copy is supplied.

- [ ] **Step 3: Implement locale validation, detection, and interpolation helpers**

Create `lib/i18n/index.ts` with the locale union, project-specific storage key, dictionaries, and pure helpers. Detection must prefer a valid saved value, then the first browser language with a `zh` prefix, then English. Translation must fall back to English and finally the key itself, and replace `{{name}}` placeholders without throwing when a parameter is missing.

```ts
import { en, type TranslationKey } from "./locales/en";
import { zh } from "./locales/zh";

export type Locale = "en" | "zh";
export type TranslationParams = Record<string, string | number>;
export const LOCALE_STORAGE_KEY = "moanachat-locale";
export const translations = { en, zh } as const;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh";
}

export function detectLocale(
  saved: unknown,
  browserLanguages: readonly string[]
): Locale {
  if (isLocale(saved)) return saved;
  return browserLanguages.some((language) => language.toLowerCase().startsWith("zh"))
    ? "zh"
    : "en";
}

export function createTranslator(locale: Locale) {
  return (key: TranslationKey, params: TranslationParams = {}) => {
    const template = translations[locale][key] ?? en[key] ?? key;
    return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
      params[name] === undefined ? match : String(params[name])
    );
  };
}
```

- [ ] **Step 4: Write unit tests for the pure runtime helpers**

Create `lib/i18n/index.test.ts` using `node:test` and `node:assert/strict`. Cover saved `zh` overriding an English browser, Chinese browser detection, English fallback for unknown browser languages, invalid saved values, placeholder replacement, and English/key fallback behavior.

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { createTranslator, detectLocale } from "./index";
import type { TranslationKey } from "./locales/en";

test("saved locale has priority over browser language", () => {
  assert.equal(detectLocale("zh", ["en-US"]), "zh");
});

test("browser Chinese locale is detected", () => {
  assert.equal(detectLocale(null, ["zh-CN", "en-US"]), "zh");
});

test("unknown browser locale falls back to English", () => {
  assert.equal(detectLocale("invalid", ["fr-FR"]), "en");
});

test("translator interpolates values and falls back to English", () => {
  const translate = createTranslator("zh");
  assert.equal(translate("chat.reasoning.seconds", { duration: 3 }), "思考了 3 秒");
  assert.equal(translate("chat.greeting.title"), "今天想聊点什么？");
  assert.equal(
    translate("missing.key" as TranslationKey),
    "missing.key"
  );
});
```

The test must use a real Chinese dictionary value for the interpolation assertion and must also assert the final key fallback shown above.

- [ ] **Step 5: Add the focused unit-test command and run it**

Add this script to `package.json` without changing the existing Playwright `test` script:

```json
"test:unit": "tsx --test lib/i18n/index.test.ts"
```

Run `pnpm run test:unit`. Expected result is a passing test run with no TypeScript or module-resolution errors.

- [ ] **Step 6: Commit the locale runtime**

```bash
git add lib/i18n package.json
git commit -m "feat: add bilingual locale runtime"
```

If the repository hook still fails because `corepack` is absent, record the failure and use `HUSKY=0` only for this commit, as was done for the approved design document.

### Task 2: Provide The Global Locale Context And Switcher

**Files:**
- Create: `components/locale-provider.tsx`
- Create: `components/chat/language-switcher.tsx`
- Modify: `app/layout.tsx`
- Modify: `components/chat/app-sidebar.tsx`

- [ ] **Step 1: Implement the client LocaleProvider and hook**

Create `components/locale-provider.tsx` with a client context that exposes `locale`, `setLocale`, and `t`. Initialize to English for server rendering, run browser/local-storage detection in an effect after hydration, and update `document.documentElement.lang` whenever the locale changes. Wrap storage reads/writes in `try/catch` so private browsing or blocked storage does not break chat rendering.

```tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createTranslator,
  detectLocale,
  LOCALE_STORAGE_KEY,
  type Locale,
  type TranslationKey,
  type TranslationParams,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    } catch {
      // Preference storage is optional.
    }
    setLocaleState(
      detectLocale(
        saved,
        Array.from(new Set([navigator.language, ...navigator.languages]))
      )
    );
  }, []);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      // Preference storage is optional.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t: createTranslator(locale) }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
```

- [ ] **Step 2: Mount LocaleProvider without changing auth or theme order**

In `app/layout.tsx`, keep the existing `ThemeProvider`, `SessionProvider`, and `TooltipProvider` behavior, and place `LocaleProvider` around the existing provider tree so both the chat and shared client components can call `useLocale`.

```tsx
<LocaleProvider>
  <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
    <SessionProvider basePath={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth`}>
      <TooltipProvider>{children}</TooltipProvider>
    </SessionProvider>
  </ThemeProvider>
</LocaleProvider>
```

- [ ] **Step 3: Add an accessible sidebar language switcher**

Create `components/chat/language-switcher.tsx` with the existing `DropdownMenu`, `SidebarMenuButton`, and lucide `LanguagesIcon`. Render it as a compact sidebar menu item with `data-testid="language-switcher"`; include English and Chinese menu items with `data-testid="language-option-en"` and `data-testid="language-option-zh"`. Use `t()` for the control label and visible language names, mark the active option with the existing check icon, and preserve collapsed-sidebar behavior.

- [ ] **Step 4: Place the switcher in the sidebar footer**

Update `components/chat/app-sidebar.tsx` to render `<LanguageSwitcher />` before the existing user navigation in `SidebarFooter`. Keep the guest sidebar usable and keep all existing delete/new-chat behavior unchanged while converting its visible labels and success toast to `t()`.

- [ ] **Step 5: Verify context and switcher behavior in the browser**

Run `pnpm run check` and open the local app. Confirm the switcher is present for both guest and authenticated sidebar states, selecting either option updates visible labels immediately, and the root HTML `lang` attribute changes with the selection.

- [ ] **Step 6: Commit the provider and switcher**

```bash
git add components/locale-provider.tsx components/chat/language-switcher.tsx app/layout.tsx components/chat/app-sidebar.tsx
git commit -m "feat: add chat language switcher"
```

### Task 3: Translate Sidebar, Header, And Chat Navigation Surfaces

**Files:**
- Modify: `components/chat/sidebar-history.tsx`
- Modify: `components/chat/sidebar-history-item.tsx`
- Modify: `components/chat/sidebar-user-nav.tsx`
- Modify: `components/chat/chat-header.tsx`
- Modify: `components/chat/visibility-selector.tsx`
- Modify: `components/chat/slash-commands.tsx`

- [ ] **Step 1: Replace sidebar history literals with locale keys**

Use `useLocale()` in `sidebar-history.tsx` for guest instructions, history headings, date buckets, loading text, delete confirmation copy, and delete-success toast. Keep date grouping logic and SWR keys unchanged. In `sidebar-history-item.tsx`, translate the More, Share, Private, Public, and Delete labels while leaving each chat title untouched.

- [ ] **Step 2: Translate account and theme menu actions**

Use `t()` in `sidebar-user-nav.tsx` for loading, Guest, authentication-status toast, login/sign-out actions, and the dark/light mode action. Compute the mode key before rendering so the English and Chinese strings remain exact and the existing click handlers do not change.

- [ ] **Step 3: Translate header and visibility controls**

Use `t()` in `chat-header.tsx` for the sidebar tooltip and Vercel deployment button. Refactor the module-level `visibilities` array in `visibility-selector.tsx` into a render-time `getVisibilities(t)` function that returns the two typed entries for `private` and `public`, so labels and descriptions react to locale changes without moving hook calls into a module initializer.

- [ ] **Step 4: Make slash-command descriptions locale-aware without changing actions**

Keep command `name` and `action` values stable for keyboard matching. Replace the module-level English `description` values with translation keys and expose a `getSlashCommands(t)` function. Have `multimodal-input.tsx` call that function for filtering and rendering, while command execution continues to use the same action strings. Translate the menu heading `Commands`.

- [ ] **Step 5: Run type and lint checks for navigation changes**

Run `pnpm run check` and `pnpm exec tsc --noEmit`. Expected result is no lint or type errors and no changes to request URLs, navigation paths, or authentication callbacks.

- [ ] **Step 6: Commit navigation translations**

```bash
git add components/chat/sidebar-history.tsx components/chat/sidebar-history-item.tsx components/chat/sidebar-user-nav.tsx components/chat/chat-header.tsx components/chat/visibility-selector.tsx components/chat/slash-commands.tsx
git commit -m "feat: translate chat navigation"
```

### Task 4: Translate Composer, Messages, Tools, And Artifact UI

**Files:**
- Modify: `components/chat/greeting.tsx`
- Modify: `components/chat/suggested-actions.tsx`
- Modify: `components/chat/multimodal-input.tsx`
- Modify: `components/chat/messages.tsx`
- Modify: `components/chat/message.tsx`
- Modify: `components/chat/message-actions.tsx`
- Modify: `components/chat/shell.tsx`
- Modify: `components/chat/artifact-actions.tsx`
- Modify: `components/chat/document.tsx`
- Modify: `components/chat/image-editor.tsx`
- Modify: `components/chat/console.tsx`
- Modify: `components/chat/preview.tsx`
- Modify: `components/chat/suggestion.tsx`
- Modify: `components/chat/toolbar.tsx`
- Modify: `components/chat/version-footer.tsx`
- Modify: `components/ai-elements/conversation.tsx`
- Modify: `components/ai-elements/message.tsx`
- Modify: `components/ai-elements/prompt-input.tsx`
- Modify: `components/ai-elements/reasoning.tsx`
- Modify: `components/ai-elements/tool.tsx`

- [ ] **Step 1: Translate empty state, suggestions, and composer controls**

Use `useLocale()` in `greeting.tsx`, `suggested-actions.tsx`, and `multimodal-input.tsx`. Translate the greeting, composer placeholders, edit/cancel status, slash-command notices, upload failures, pasted-image status, model search and availability labels, capability tooltips, and wait-for-response toast. Keep the four canonical suggestion payloads in `lib/constants.ts` unchanged for model behavior; render a translated display label alongside the original payload so switching language never changes the request sent by a suggestion click.

- [ ] **Step 2: Translate message actions and approval/error states**

Use `t()` in `messages.tsx`, `message.tsx`, and `message-actions.tsx` for scroll accessibility, waiting text, copy/vote toasts, action tooltips, Deny/Allow controls, weather-denied text, and document error prefixes. Do not translate message parts, tool arguments, document titles, or model responses. Keep the existing `reason: "User denied weather lookup"` protocol value unchanged.

- [ ] **Step 3: Translate generic AI element defaults with context-aware labels**

Use `useLocale()` in the client components where default UI text is rendered. In `conversation.tsx`, translate empty-state defaults, the scroll/download accessibility labels, and leave caller-supplied `title`, `description`, `filename`, and formatted message content untouched. In `message.tsx`, translate branch navigation labels and action tooltips. In `prompt-input.tsx`, translate upload labels, validation error messages, and submit/stop `aria-label` values. In `reasoning.tsx`, translate Thinking and duration text using the `{{duration}}` parameter. In `tool.tsx`, make status labels and Parameters/Result/Error headings derive from `t()` inside render-time functions rather than module-level hook calls.

- [ ] **Step 4: Translate artifact, console, and gateway surfaces**

Use `t()` in `artifact-actions.tsx`, `document.tsx`, `image-editor.tsx`, `console.tsx`, `preview.tsx`, `version-footer.tsx`, and `shell.tsx` for action tooltips, document progress text, shared-chat errors, restore/latest controls, console labels, image generation status, the Chatbot preview label, AI Gateway dialog copy, and related toasts. Preserve action descriptions used for identity checks by storing a stable action key or comparing the existing English identifier separately from its rendered translation.

- [ ] **Step 5: Exercise both locales through the existing app shell**

Run `pnpm run check` and `pnpm exec tsc --noEmit`. Open a guest chat, switch to Chinese, open the model selector, slash-command menu, account menu, and visibility menu, then switch back to English. Confirm dynamic chat titles, message text, model names, and document names remain unchanged while static controls update.

- [ ] **Step 6: Commit chat-surface translations**

```bash
git add components/chat components/ai-elements
git commit -m "feat: translate chat surfaces"
```

### Task 5: Add End-To-End Locale Regression Coverage And Final Verification

**Files:**
- Modify: `tests/e2e/chat.test.ts`

- [ ] **Step 1: Add browser-language detection coverage**

In `tests/e2e/chat.test.ts`, add a locale test that uses `page.addInitScript` to expose `navigator.language` and `navigator.languages` as `zh-CN` values before navigating to `/`. Assert the greeting is Chinese and `document.documentElement.lang` is `zh`.

```ts
test("follows a Chinese browser locale", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "language", { configurable: true, value: "zh-CN" });
    Object.defineProperty(navigator, "languages", { configurable: true, value: ["zh-CN", "en-US"] });
  });
  await page.goto("/");
  await expect(page.getByText("今天想聊点什么？")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
});
```

- [ ] **Step 2: Add manual-switch and persistence coverage**

Add a test that clears `localStorage`, loads the chat, clicks `data-testid="language-switcher"`, selects `data-testid="language-option-zh"`, asserts Chinese greeting and `lang="zh"`, reloads and asserts the Chinese choice persists, then selects English and asserts the English greeting and `lang="en"`.

- [ ] **Step 3: Keep existing English selectors stable**

Run the existing model-selector and chat tests in their default English context. If a translated placeholder or label changes a selector, update that selector to use the new locale test id or an explicit English assertion only where the test requires English. Do not weaken message-send, stop-generation, model-selection, or API error coverage.

- [ ] **Step 4: Run the complete verification set**

Run the following commands from `/Users/xavier.xiao/workshop/moanachat`:

```bash
pnpm run test:unit
pnpm run check
pnpm exec tsc --noEmit
pnpm test
```

Expected result is a passing unit suite, clean lint/type checks, and passing Playwright tests. The Playwright run may require the existing local Postgres and development server setup; report any environment-only failure separately from code failures.

- [ ] **Step 5: Inspect the final diff and commit tests**

Run `git diff --check` and `git status --short`, confirm only the planned locale files and chat components changed, then commit:

```bash
git add tests/e2e/chat.test.ts tests/pages/chat.ts
git commit -m "test: cover bilingual chat switching"
```

Use `HUSKY=0` only if the repository hook still cannot run because `corepack` is unavailable, and report that limitation in the final verification summary.
