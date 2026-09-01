# Moana Hallmark UI Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Moana marketing and authentication surfaces into one Venice-inspired Hallmark system with reliable mobile behavior and working existing auth flows.

**Architecture:** Keep the current Next.js App Router and component ownership. Add a semantic token layer, make the marketing shell own its scroll-morph navigation, and keep credentials authentication in the existing server actions while replacing only the visual shell and field controls.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, Canela/Aeonik/Aeonik Fono, Framer Motion, Lenis, Lucide, and Playwright E2E tests.

---

### Task 1: Lock the shared visual system

**Files:**
- Create: `design.md`
- Create: `tokens.css`
- Modify: `app/globals.css`

- [ ] **Step 1: Add semantic tokens and the Hallmark stamp**

Add `--color-paper`, `--color-paper-2`, `--color-ink`, `--color-ink-muted`, `--color-rule`, `--color-accent`, `--color-accent-ink`, auth surface tokens, Canela/Aeonik/Aeonik Fono font tokens, the four-point spacing scale, named easings, and 44/48px control heights to `tokens.css`. Import it from the existing global stylesheet without removing Tailwind directives.

- [ ] **Step 2: Replace global overflow and focus resets**

Change `html` and `body` to `overflow-x: clip`, remove the blanket `outline: none`, and add an immediate `:focus-visible` ring using `var(--color-focus)` with a stable 2px outline slot.

- [ ] **Step 3: Run the typecheck**

Run `pnpm exec tsc --noEmit`. Expected: exit 0.

### Task 2: Match Venice's scroll-morph marketing navigation

**Files:**
- Modify: `components/marketing/marketing-header.tsx`
- Modify: `components/marketing/hero-section.tsx`
- Modify: `components/marketing/marketing-home.tsx`
- Test: `tests/e2e/marketing-home.test.ts`

- [ ] **Step 1: Write failing browser assertions**

Add tests that scroll `.marketing-home` past the morph threshold and assert a compact `data-state="scrolled"` navigation with a mini `Ask anything privately...` input, while asserting the desktop link row is not visible at 375px. Keep the existing prompt-submit assertions.

- [ ] **Step 2: Run the focused tests and verify the failure**

Run `PORT=3011 pnpm exec playwright test tests/e2e/marketing-home.test.ts --workers=1`. Expected: the new state and mobile visibility assertions fail against the current header.

- [ ] **Step 3: Implement the navigation state**

Use one semantic navigation DOM with an initial edge-aligned wordmark/sign-up mode and a scrolled floating pill mode. The scrolled mode contains the mark, a compact input that submits through the existing `moanaDemoPrompt` path, desktop links only above the desktop breakpoint, and a sign-in link. Remove the inline `display` override that currently exposes desktop links on touch widths.

- [ ] **Step 4: Run the focused tests**

Run the same Playwright command. Expected: all marketing tests pass.

### Task 3: Remove mobile overflow and fake chrome tells

**Files:**
- Modify: `components/marketing/composer.tsx`
- Modify: `components/marketing/model-marquee.tsx`
- Modify: `components/marketing/capabilities-section.tsx`
- Modify: `components/marketing/pricing-section.tsx`
- Modify: `components/marketing/developer-section.tsx`
- Modify: `components/marketing/privacy-section.tsx`
- Modify: `components/marketing/marketing-footer.tsx`
- Modify: `components/marketing/marketing-home.tsx`
- Test: `tests/e2e/marketing-home.test.ts`

- [ ] **Step 1: Add width and interaction regression tests**

Add a browser test that visits the page at 320, 375, 414, and 768px and asserts `document.documentElement.scrollWidth === document.documentElement.clientWidth`, primary links remain single-line, and prompt presets can be focused and activated from the keyboard.

- [ ] **Step 2: Run the tests and verify the failure**

Run `PORT=3011 pnpm exec playwright test tests/e2e/marketing-home.test.ts --workers=1`. Expected: the current scrolled navigation and at least one narrow layout assertion fail.

- [ ] **Step 3: Implement responsive and token corrections**

Replace the negative marketing offset and `w-screen` shell with a full-width fixed layer that does not inherit the chat sidebar geometry. Convert marketing colors, fonts, spacing, and radii to semantic tokens. Make preset preview available on `:focus-visible` and tap, keep chip labels `white-space: nowrap`, collapse sticky feature media below 60rem, and replace fake browser dots with a typographic code frame. Add image dimensions and below-fold lazy loading.

- [ ] **Step 4: Run the width and interaction tests**

Run the focused Playwright command. Expected: all marketing tests pass at all four widths.

### Task 4: Build the Venice-inspired authentication portal

**Files:**
- Modify: `app/(auth)/layout.tsx`
- Modify: `app/(auth)/login/page.tsx`
- Modify: `app/(auth)/register/page.tsx`
- Modify: `components/chat/auth-form.tsx`
- Modify: `components/chat/submit-button.tsx`
- Modify: `lib/i18n/locales/en.ts`
- Modify: `lib/i18n/locales/zh.ts`
- Test: `tests/e2e/auth.test.ts`

- [ ] **Step 1: Write failing visual and control assertions**

Add tests for `[data-auth-shell]`, the dark auth surface, the concentric-line background, the 44px email/password fields, a password visibility button with an accessible label, and the existing login/register navigation and validation feedback.

- [ ] **Step 2: Run auth tests and verify the visual assertions fail**

Run `PORT=3011 pnpm exec playwright test tests/e2e/auth.test.ts --workers=1`. Expected: the new auth shell, dark-surface, and password-toggle assertions fail against the current light template.

- [ ] **Step 3: Implement the shared auth shell**

Replace the split preview layout with a centred dark portal that uses the existing Moana mark, a subtle concentric-line pseudo-element, a compact panel, a back-home link, and a footer link between login and register. Keep the current server actions and state feedback unchanged. Add a local password show/hide control with `aria-label` and stable field geometry.

- [ ] **Step 4: Run auth tests**

Run `PORT=3011 pnpm exec playwright test tests/e2e/auth.test.ts --workers=1`. Expected: all auth tests pass in English and Chinese.

### Task 5: Hallmark audit and browser verification

**Files:**
- Modify: `tests/e2e/marketing-home.test.ts`
- Modify: `tests/e2e/auth.test.ts`
- Create or update: `.hallmark/preflight.json`
- Create or update: `.hallmark/log.json`

- [ ] **Step 1: Run code verification**

Run `pnpm exec tsc --noEmit`, `pnpm build`, and `git diff --check`. Expected: each exits 0.

- [ ] **Step 2: Run browser verification**

Run the marketing and auth E2E files at 320, 375, 414, 768, and 1440px. Inspect screenshots for no horizontal overflow, no wrapped clickable labels, correct scroll-morph navigation, and the dark auth panel.

- [ ] **Step 3: Run the Hallmark slop review**

Check the final implementation against the 58 gates, including no raw colors outside the token block, no focus-ring removal, no mobile hover-only interaction, no fake chrome, and no page-level overflow.

### Task 6: Commit and deploy

**Files:**
- Modify: only the files above; leave `.playwright-cli/`, `.superpowers/`, and `output/` untracked.

- [ ] **Step 1: Commit the scoped change**

Run `HUSKY=0 git add design.md tokens.css app/globals.css components/marketing app/'(auth)' components/chat/auth-form.tsx components/chat/submit-button.tsx lib/i18n/locales/en.ts lib/i18n/locales/zh.ts tests/e2e/marketing-home.test.ts tests/e2e/auth.test.ts .hallmark docs/superpowers/plans/2026-09-01-moana-hallmark-ui-design.md && HUSKY=0 git commit -m "refine Moana marketing and auth surfaces"`.

- [ ] **Step 2: Deploy through the existing server stack**

Transfer the committed source to `/opt/moana-stack/moanachat`, back up the previous source tree, rebuild `moana/moanachat:deployed`, and recreate only the `moanachat` service through `/opt/moana-stack/compose.yaml`.

- [ ] **Step 3: Verify the remote release**

Confirm the deployed revision, `running / healthy / restart=0`, `curl -fsS http://127.0.0.1:3001/ping`, and a real browser visit to `https://chat.seay.ai/`, `/login`, and `/register`.
