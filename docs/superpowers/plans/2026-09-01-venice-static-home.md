# Venice Static Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the empty root route with a static Venice-inspired AI landing page while preserving existing chat routes.

**Architecture:** Keep the marketing page isolated from the chat layout by using a new route group and focused components under `components/marketing`. Use server-rendered static content with local client-only behavior limited to the visual composer controls and mobile navigation.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS 4, Motion, Lucide React, remote MP4/WebP media, CSS font fallbacks.

---

### Task 1: Create marketing route and page shell

**Files:**
- Create: `app/(marketing)/page.tsx`
- Create: `app/(marketing)/layout.tsx`
- Create: `components/marketing/marketing-home.tsx`

- [ ] **Step 1: Write the failing route smoke test**

Add an end-to-end assertion in `tests/e2e/marketing-home.test.ts` that opens `/` and expects the `Ask anything` heading and `Sign up` link.

- [ ] **Step 2: Run the test and verify it fails**

Run `pnpm exec playwright test tests/e2e/marketing-home.test.ts`. It should fail because the current root page returns `null`.

- [ ] **Step 3: Implement the route shell**

Render `MarketingHome` from `app/(marketing)/page.tsx`; keep the route group layout free of the chat sidebar and add a `main` landmark around the marketing content.

- [ ] **Step 4: Run the route test and verify it passes**

Run `pnpm exec playwright test tests/e2e/marketing-home.test.ts` and confirm the new root content is found.

### Task 2: Build hero composer and responsive navigation

**Files:**
- Create: `components/marketing/hero-section.tsx`
- Create: `components/marketing/composer.tsx`
- Create: `components/marketing/marketing-header.tsx`
- Modify: `components/marketing/marketing-home.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add semantic hero assertions**

Extend the marketing e2e test to assert the `Chat message input`, all five prompt buttons, and the `/sign-up` href.

- [ ] **Step 2: Implement hero visuals**

Use the Venice wave video as an absolutely positioned, muted, looping background with `object-cover`, add a bottom stucco fade, render a centered composer with paperclip and arrow-up Lucide icons, and use horizontal overflow for prompt pills on narrow screens.

- [ ] **Step 3: Implement desktop and mobile header states**

Render the wordmark, desktop nav links, sign-up button, and a compact mobile menu button. Keep menu behavior static for this version while preserving accessible labels.

- [ ] **Step 4: Verify responsive layout**

Run the e2e test at 1280px and 375px viewports and assert no horizontal document overflow at 375px.

### Task 3: Add static content sections

**Files:**
- Create: `components/marketing/model-marquee.tsx`
- Create: `components/marketing/capabilities-section.tsx`
- Create: `components/marketing/pricing-section.tsx`
- Create: `components/marketing/developer-section.tsx`
- Create: `components/marketing/privacy-section.tsx`
- Create: `components/marketing/marketing-footer.tsx`
- Modify: `components/marketing/marketing-home.tsx`

- [ ] **Step 1: Add section-level assertions**

Extend the e2e test to assert the model heading, `Text Generation`, `Simple pricing. No surprises.`, `One API for Everything`, `AI that respects your privacy`, and footer copyright text.

- [ ] **Step 2: Implement model marquee and capability cards**

Render repeated provider names in a clipped horizontal track and five responsive capability cards. Use remote WebP/MP4/audio assets where available, with neutral placeholders if a media request fails.

- [ ] **Step 3: Implement pricing, API, privacy, and footer sections**

Create static cards and code panel using the observed sea/stucco palette, restrained borders, shadows, 8px-or-less control radii, and responsive grid rules.

- [ ] **Step 4: Verify complete page content**

Run `pnpm exec playwright test tests/e2e/marketing-home.test.ts` and inspect the page screenshot at desktop and mobile sizes.

### Task 4: Quality verification

**Files:**
- Modify: `app/globals.css` only if visual QA finds global leakage or overflow.

- [ ] **Step 1: Run static checks**

Run `pnpm exec tsc --noEmit` and `pnpm run check`.

- [ ] **Step 2: Run browser verification**

Start the app with `pnpm dev`, open `/` in Playwright, capture desktop and 375px screenshots, verify the hero video loads, confirm no console errors introduced by the marketing page, and scroll through all sections.

- [ ] **Step 3: Run the existing targeted chat test**

Run `pnpm exec playwright test tests/e2e/chat.test.ts` to confirm the existing chat workflow remains unaffected.

- [ ] **Step 4: Review the diff**

Run `git diff --stat` and `git diff --check`; ensure only marketing files, the approved route, and the focused e2e test are changed.
