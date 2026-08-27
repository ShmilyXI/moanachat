# Moanachat New API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a New API embedded runtime to Moanachat while keeping standalone Vercel AI Gateway operation unchanged.

**Architecture:** A server-only runtime configuration module resolves an embedded New API configuration cookie before falling back to the existing Gateway environment. A bootstrap API route receives `baseUrl` and `apiKey` from the New API Chat Preset, while a model discovery module normalizes New API's `/v1/models` response for both the selector and chat route validation. The first version keeps Moanachat's own authentication and database and does not add SSO or automatic New API token creation.

**Tech Stack:** Next.js App Router, AI SDK 7, `@ai-sdk/openai-compatible`, NextAuth, SWR, Node test runner with `tsx`, Playwright.

---

### Task 1: Add Runtime Configuration and Bootstrap Storage

**Files:**
- Create: `lib/ai/runtime-config.ts`
- Create: `app/api/runtime-config/route.ts`
- Create: `components/runtime-config-bootstrap.tsx`
- Modify: `proxy.ts:25-32`
- Modify: `app/layout.tsx:1-80`
- Test: `tests/unit/runtime-config.test.ts`

- [ ] **Step 1: Write failing pure-function tests**

Add tests for parsing the two supported query names (`baseUrl`/`apiKey` and `apiBase`/`apiKey`), normalizing one trailing `/v1`, accepting only `http` and `https`, rejecting empty or oversized values, and returning the standalone fallback when no embedded cookie exists.

- [ ] **Step 2: Run the focused test and verify it fails**

Run `pnpm exec tsx --test tests/unit/runtime-config.test.ts`.

Expected result: the test fails because `lib/ai/runtime-config.ts` does not exist.

- [ ] **Step 3: Implement the runtime configuration module**

Define `RuntimeConfig` with `mode: "embedded" | "gateway"`, `baseUrl?: string`, and `apiKey?: string`. Export pure parsing/normalization helpers for tests and a server-only `getRuntimeConfig()` that reads the encoded `moana-runtime-config` cookie first, then `AI_GATEWAY_API_KEY` for standalone mode. Reject unsupported URL schemes, credentials in the URL, empty keys, and values above 2048 characters.

- [ ] **Step 4: Implement the bootstrap route and client bootstrap**

Create `POST /api/runtime-config` accepting `{ baseUrl: string; apiKey: string }`, validate it through the runtime module, set an encoded HttpOnly cookie with `sameSite: "lax"`, `secure` based on production mode, `path: "/"`, and a seven-day max age, and return only `{ success: true, mode: "embedded" }`. Add a client component that reads `baseUrl`/`apiBase` and `apiKey` from the current URL, posts them once, then removes those parameters with `history.replaceState`.

- [ ] **Step 5: Preserve bootstrap parameters during guest auth**

Change `proxy.ts` to include `request.nextUrl.search` when building `redirectUrl`, while retaining the existing path safety check in the guest route. Mount the client bootstrap component inside the existing providers in `app/layout.tsx`.

- [ ] **Step 6: Run the focused test and typecheck**

Run `pnpm exec tsx --test tests/unit/runtime-config.test.ts` and `pnpm exec tsc --noEmit`.

Expected result: all runtime configuration tests pass and TypeScript reports no errors.

- [ ] **Step 7: Commit the task**

Run `git add lib/ai/runtime-config.ts app/api/runtime-config/route.ts components/runtime-config-bootstrap.tsx proxy.ts app/layout.tsx tests/unit/runtime-config.test.ts && git commit -m "feat: add embedded runtime configuration"`.

### Task 2: Add New API OpenAI-Compatible Provider and Model Discovery

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Create: `lib/ai/newapi.ts`
- Modify: `lib/ai/providers.ts:1-33`
- Modify: `lib/ai/models.ts:1-167`
- Test: `tests/unit/newapi-models.test.ts`

- [ ] **Step 1: Add the provider dependency**

Run `pnpm add @ai-sdk/openai-compatible` and keep the package version compatible with the existing AI SDK 7 dependency.

- [ ] **Step 2: Write failing model normalization tests**

Cover an OpenAI model response with `data` records, preserve IDs containing `/`, use the record ID as the display name when no name exists, derive a provider label from the first ID segment, and return an empty list for malformed or missing `data`.

- [ ] **Step 3: Implement New API model discovery**

Create `lib/ai/newapi.ts` with `fetchNewApiModels(config)`, which requests `${baseUrl}/v1/models` using `Authorization: Bearer ${apiKey}`, checks `response.ok`, validates the JSON shape, and returns normalized `ChatModel[]`. Add `getNewApiModelIds(config)` as a set-producing helper for server-side selection validation. Keep the fetch request-local and do not cache credentials or user-specific model lists globally.

- [ ] **Step 4: Implement provider selection**

Update `lib/ai/providers.ts` so `getLanguageModel(modelId)` reads `getRuntimeConfig()`. In embedded mode construct `createOpenAICompatible({ name: "new-api", baseURL: `${config.baseUrl}/v1`, apiKey: config.apiKey })` and return `provider(modelId)`. In gateway mode retain the current `gateway.languageModel(modelId)` path. Apply the same selection to `getTitleModel()` and fall back to the first discovered New API model if the static title model is unavailable.

- [ ] **Step 5: Expose embedded models from `/api/models`**

Keep the current standalone response shape. When runtime mode is embedded, return `{ mode: "embedded", models, capabilities, defaultModelId }`, with all capability flags false unless explicitly known. When the New API request fails, return a non-2xx response with a stable JSON error instead of exposing provider credentials.

- [ ] **Step 6: Run focused tests and typecheck**

Run `pnpm exec tsx --test tests/unit/newapi-models.test.ts` and `pnpm exec tsc --noEmit`.

Expected result: model normalization tests pass and the provider code typechecks.

- [ ] **Step 7: Commit the task**

Run `git add package.json pnpm-lock.yaml lib/ai/newapi.ts lib/ai/providers.ts lib/ai/models.ts tests/unit/newapi-models.test.ts app/'(chat)'/api/models/route.ts && git commit -m "feat: add New API model provider"`.

### Task 3: Make Chat Requests and Defaults Runtime-Aware

**Files:**
- Modify: `app/(chat)/api/chat/route.ts:17-21,97-100,197-203,280-303`
- Modify: `hooks/use-active-chat.tsx:69-75`
- Modify: `components/chat/multimodal-input.tsx:794-840`
- Test: `tests/unit/chat-model-selection.test.ts`

- [ ] **Step 1: Write failing selection tests**

Test that embedded mode selects the first New API model when the saved model is missing, retains a saved model returned by `/api/models`, and keeps the existing static default in standalone mode.

- [ ] **Step 2: Add a shared model selection helper**

Implement a pure helper that accepts `{ mode, requestedModelId, availableModels, staticDefaultModelId }` and returns the requested model when allowed, otherwise the first available embedded model, otherwise the static default. Use this helper in the server route and the client provider.

- [ ] **Step 3: Validate models in the chat POST route**

Resolve runtime config after authentication. In embedded mode fetch the New API model list before selecting `chatModel`; return the existing offline chat response when no models can be discovered. Pass the selected runtime model to `getLanguageModel`, and keep standalone static allow-list validation unchanged.

- [ ] **Step 4: Synchronize the client default and selector**

Load `/api/models` in `ActiveChatProvider`, replace the initial static model only when embedded data is available and the current model is not in that list, and mark embedded dynamic models as selectable in the model selector. Keep standalone curated and demo behavior unchanged.

- [ ] **Step 5: Run focused tests and typecheck**

Run `pnpm exec tsx --test tests/unit/chat-model-selection.test.ts` and `pnpm exec tsc --noEmit`.

Expected result: selection tests pass and the chat route/UI changes typecheck.

- [ ] **Step 6: Commit the task**

Run `git add app/'(chat)'/api/chat/route.ts hooks/use-active-chat.tsx components/chat/multimodal-input.tsx tests/unit/chat-model-selection.test.ts lib/ai/models.ts && git commit -m "feat: support runtime New API models in chat"`.

### Task 4: Preserve Standalone and Embedded Regression Coverage

**Files:**
- Modify: `tests/e2e/model-selector.test.ts`
- Modify: `tests/e2e/chat.test.ts`
- Create: `tests/e2e/newapi-embedded.test.ts`
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Add an embedded-mode browser fixture**

Use Playwright request routing to mock `POST /api/runtime-config`, `GET /api/models`, and `POST /api/chat`. Open the app with `?baseUrl=http%3A%2F%2Fnewapi.test&apiKey=sk-test`, assert the bootstrap query is removed, assert the model selector contains the mocked New API model, and assert sending a message uses that model.

- [ ] **Step 2: Protect standalone behavior**

Keep the existing model selector assertions for the static curated models and add a standalone API test that `/api/models` still returns the current capability map when no embedded cookie is present.

- [ ] **Step 3: Document both launch modes**

Add `MOANACHAT` configuration comments to `.env.example` and document the New API Chat Preset URL template plus the standalone environment variables in `README.md`. State that the first version expects an enabled New API token and does not provide SSO or automatic token creation.

- [ ] **Step 4: Run affected Playwright tests**

Run `pnpm exec playwright test tests/e2e/model-selector.test.ts tests/e2e/chat.test.ts tests/e2e/newapi-embedded.test.ts`.

Expected result: standalone and embedded browser flows pass.

- [ ] **Step 5: Commit the task**

Run `git add tests/e2e/model-selector.test.ts tests/e2e/chat.test.ts tests/e2e/newapi-embedded.test.ts .env.example README.md && git commit -m "test: cover standalone and embedded chat modes"`.

### Task 5: Final Verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Run unit tests**

Run `pnpm exec tsx --test tests/unit/*.test.ts`.

- [ ] **Step 2: Run typecheck and lint**

Run `pnpm exec tsc --noEmit` and `pnpm exec ultracite check`.

- [ ] **Step 3: Run the production build**

Run `pnpm run build` with the existing local environment, recording any missing external provider or database prerequisites separately from code failures.

- [ ] **Step 4: Review the final diff**

Run `git diff --check`, `git status --short`, and `git log --oneline -8`. Confirm that only the integration files and their tests changed and that no API key or local credential is tracked.
