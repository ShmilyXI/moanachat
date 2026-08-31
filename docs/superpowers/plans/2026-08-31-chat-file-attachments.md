# Chat File Attachments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable image and common document attachments in chat and prepare each file in a format supported by the configured model.

**Architecture:** Share a supported media-type contract between the upload route, chat schema, and browser file picker. Add a server-only file preparation module that downloads stored files, preserves images, converts PDFs to data, and extracts text from text, DOCX, and spreadsheet files before AI SDK conversion. Treat missing model capability metadata as unknown so it cannot disable the attachment control.

**Tech Stack:** Next.js route handlers, AI SDK 7 UI message conversion, Vercel Blob, Mammoth, SheetJS, PDF parsing, Zod, Node test runner, Playwright.

---

### Task 1: Add document-processing dependencies and shared attachment contract

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `lib/chat/attachments.ts`
- Test: `tests/unit/chat-attachments.test.ts`

- [ ] **Step 1: Write the failing tests**

Add tests for the supported MIME allowlist, file-name labeling, and rejection of unsupported types.

- [ ] **Step 2: Run the focused test and verify it fails**

Run `pnpm exec tsx --test tests/unit/chat-attachments.test.ts`.
Expected: FAIL because the shared attachment module does not exist.

- [ ] **Step 3: Add the shared contract and dependencies**

Export the MIME constants, `isSupportedAttachmentType`, and `attachmentLabel` from `lib/chat/attachments.ts`. Add `mammoth`, `pdf-parse`, and `xlsx` as runtime dependencies.

- [ ] **Step 4: Run the focused test and verify it passes**

Run `pnpm exec tsx --test tests/unit/chat-attachments.test.ts`.
Expected: PASS.

- [ ] **Step 5: Commit the focused change**

Run `HUSKY=0 git add package.json pnpm-lock.yaml lib/chat/attachments.ts tests/unit/chat-attachments.test.ts && HUSKY=0 git commit -m "feat: add shared chat attachment contract"`.

### Task 2: Broaden upload and chat validation

**Files:**
- Modify: `app/(chat)/api/files/upload/route.ts`
- Modify: `app/(chat)/api/chat/schema.ts`
- Modify: `components/chat/multimodal-input.tsx`
- Modify: `components/chat/preview-attachment.tsx`
- Test: `tests/unit/chat-schema.test.ts`

- [ ] **Step 1: Write the failing tests**

Cover PDF, DOCX, XLSX, TXT, Markdown, CSV, and JSON message parts, and reject an executable MIME type.

- [ ] **Step 2: Run the focused test and verify it fails**

Run `pnpm exec tsx --test tests/unit/chat-schema.test.ts`.
Expected: FAIL because the schema only accepts JPEG and PNG.

- [ ] **Step 3: Implement the shared validation in the route and schema**

Use the shared MIME allowlist for Zod validation, keep the 5 MB limit, return the Blob content type and safe pathname, and set the browser file input `accept` attribute from the same allowlist. Keep image thumbnails and show a compact extension/type label for documents.

- [ ] **Step 4: Run the focused tests and formatter**

Run `pnpm exec tsx --test tests/unit/chat-schema.test.ts` and `pnpm exec ultracite check app/(chat)/api/files/upload/route.ts app/(chat)/api/chat/schema.ts components/chat/multimodal-input.tsx components/chat/preview-attachment.tsx lib/chat/attachments.ts`.
Expected: PASS with no formatter errors.

- [ ] **Step 5: Commit the focused change**

Run `HUSKY=0 git add app/(chat)/api/files/upload/route.ts app/(chat)/api/chat/schema.ts components/chat/multimodal-input.tsx components/chat/preview-attachment.tsx tests/unit/chat-schema.test.ts && HUSKY=0 git commit -m "feat: accept common chat file attachments"`.

### Task 3: Prepare stored files for model requests

**Files:**
- Create: `lib/ai/file-attachments.ts`
- Modify: `app/(chat)/api/chat/route.ts`
- Modify: `app/(chat)/api/agent/route.ts`
- Test: `tests/unit/file-attachments.test.ts`

- [ ] **Step 1: Write the failing tests**

Test that text files become bounded text parts with filename context, DOCX and XLSX become text, PDFs become data-backed file parts, images remain file parts, and malformed/oversized content returns a readable preparation error.

- [ ] **Step 2: Run the focused test and verify it fails**

Run `pnpm exec tsx --test tests/unit/file-attachments.test.ts`.
Expected: FAIL because the preparation module does not exist.

- [ ] **Step 3: Implement `prepareMessagesForModel`**

Fetch Blob URLs server-side, use `pdf-parse` for PDF fallback text or data conversion, use Mammoth for DOCX raw text, use SheetJS for XLS/XLSX sheet text, decode text formats directly, cap extracted text before inserting it into a model message, and preserve image file parts. Convert prepared messages before `streamText` in both chat routes.

- [ ] **Step 4: Run the focused tests and route tests**

Run `pnpm exec tsx --test tests/unit/file-attachments.test.ts tests/unit/chat-routes.test.ts`.
Expected: PASS.

- [ ] **Step 5: Commit the focused change**

Run `HUSKY=0 git add lib/ai/file-attachments.ts app/(chat)/api/chat/route.ts app/(chat)/api/agent/route.ts tests/unit/file-attachments.test.ts && HUSKY=0 git commit -m "feat: prepare document attachments for models"`.

### Task 4: Fix capability handling and attachment control state

**Files:**
- Modify: `lib/ai/models.ts`
- Modify: `lib/ai/newapi.ts`
- Modify: `components/chat/multimodal-input.tsx`
- Test: `tests/unit/newapi-models.test.ts`
- Test: `tests/e2e/model-selector.test.ts`

- [ ] **Step 1: Write the failing tests**

Cover capability metadata from New API architecture/top-level fields and verify the attachment button remains enabled when capability metadata is absent, while an explicit `vision: false` model is still recognized as unsupported for image input.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run `pnpm exec tsx --test tests/unit/newapi-models.test.ts` and `pnpm exec playwright test tests/e2e/model-selector.test.ts`.
Expected: the new capability and button assertions fail against the current two-state behavior.

- [ ] **Step 3: Implement unknown capability semantics**

Normalize all supported New API capability locations, add an explicit known/unknown signal without changing existing tool and reasoning behavior, and make the attachment button disabled only while not ready or when the selected model is explicitly known not to support image input. Text documents remain available for all language models.

- [ ] **Step 4: Run focused tests and type checks**

Run `pnpm exec tsx --test tests/unit/newapi-models.test.ts`, `pnpm exec playwright test tests/e2e/model-selector.test.ts`, and `pnpm exec tsc --noEmit`.
Expected: PASS.

- [ ] **Step 5: Commit the focused change**

Run `HUSKY=0 git add lib/ai/models.ts lib/ai/newapi.ts components/chat/multimodal-input.tsx tests/unit/newapi-models.test.ts tests/e2e/model-selector.test.ts && HUSKY=0 git commit -m "fix: keep attachments available for unknown model capabilities"`.

### Task 5: Verify the complete attachment flow

**Files:**
- Test: `tests/e2e/chat-attachments.test.ts`

- [ ] **Step 1: Add the browser regression flow**

Mock `/api/models`, `/api/files/upload`, and `/api/chat`, select a model with incomplete capability metadata, use the file chooser with a PDF and image fixture, and assert the preview and outgoing message parts contain the selected media types.

- [ ] **Step 2: Run the browser regression test**

Run `pnpm exec playwright test tests/e2e/chat-attachments.test.ts`.
Expected: PASS.

- [ ] **Step 3: Run the full verification suite**

Run `pnpm exec ultracite check`, `pnpm exec tsc --noEmit`, `pnpm exec tsx --test tests/unit/*.test.ts`, and the relevant Playwright tests.
Expected: PASS with no untagged debug instrumentation.

- [ ] **Step 4: Review the final diff and report the local URL**

Run `git diff --check` and `git status --short`. Keep unrelated pre-existing changes untouched and report the running local server URL after checking `/ping`.
