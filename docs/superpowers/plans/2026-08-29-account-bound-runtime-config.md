# Account-Bound Runtime Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let signed-in users save one encrypted New API connection to their account and use it across chat, agent, title, model discovery, and studio requests.

**Architecture:** Store one normalized base URL and one AES-256-GCM encrypted API key per user in a dedicated `UserRuntimeConfig` row. The server-only runtime resolver checks the authenticated regular user's row before the existing embedded cookie and `AI_GATEWAY_API_KEY` fallbacks. The API dashboard becomes the account configuration surface, while the current URL bootstrap remains compatible for guests and integrations.

**Tech Stack:** Next.js App Router, NextAuth, Drizzle ORM/PostgreSQL, Node `crypto`, AI SDK 7, SWR, Node test runner with `tsx`, Playwright.

---

## File map

The encryption boundary lives in `lib/ai/runtime-config-crypto.ts` and has no database or browser dependencies. The account row and CRUD operations live in `lib/db/schema.ts` and `lib/db/queries.ts`; the migration is `lib/db/migrations/0002_account_runtime_config.sql` with the generated Drizzle metadata. Runtime precedence remains in `lib/ai/runtime-config.ts`, and the existing provider consumers keep calling its resolver. The HTTP contract stays in `app/api/runtime-config/route.ts`. The dashboard form is isolated in `components/venice/runtime-config-form.tsx`, while `app/(chat)/api-dashboard/page.tsx` only composes the page. Localized copy belongs in `lib/i18n/locales/en.ts` and `lib/i18n/locales/zh.ts`. Unit tests cover crypto and pure precedence; Playwright covers the authenticated dashboard and chat behavior in `tests/e2e/runtime-config.test.ts`.

### Task 1: Add encrypted account configuration primitives

**Files:**
- Create: `lib/ai/runtime-config-crypto.ts`
- Modify: `lib/db/schema.ts`
- Create: `lib/db/migrations/0002_account_runtime_config.sql`
- Create: `lib/db/migrations/meta/0002_snapshot.json`
- Modify: `lib/db/migrations/meta/_journal.json`
- Test: `tests/unit/runtime-config-crypto.test.ts`

- [ ] **Step 1: Write the failing crypto tests**

Create tests that call `encryptRuntimeApiKey("sk-test", "test-secret")`, decrypt the returned payload with the same secret, and assert the original value is restored. Assert that two encryptions of the same key have different IVs. Assert that decrypting with a different secret and decrypting after changing one ciphertext character both throw. Assert that an empty encryption secret throws before encryption.

```ts
test("round trips an API key and uses a fresh IV", () => {
  const first = encryptRuntimeApiKey("sk-test", "test-secret");
  const second = encryptRuntimeApiKey("sk-test", "test-secret");
  assert.equal(decryptRuntimeApiKey(first, "test-secret"), "sk-test");
  assert.notEqual(first.iv, second.iv);
});
```

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run `pnpm exec tsx --test tests/unit/runtime-config-crypto.test.ts`.

Expected result: the test errors because `lib/ai/runtime-config-crypto.ts` and its exports do not exist yet.

- [ ] **Step 3: Implement the encryption module**

Use `createHash`, `createCipheriv`, `createDecipheriv`, and `randomBytes` from `node:crypto`. Derive a 32-byte key from `moana-runtime-config:${secret}` with SHA-256. Use `aes-256-gcm` and a 12-byte IV. Return `{ ciphertext, iv, authTag }` encoded with base64url. Validate the secret before deriving the key, and let authentication-tag failure propagate as a generic decryption error without including plaintext or ciphertext in the error message.

```ts
export type EncryptedRuntimeApiKey = {
  authTag: string;
  ciphertext: string;
  iv: string;
};

export function encryptRuntimeApiKey(
  value: string,
  secret = process.env.AUTH_SECRET
): EncryptedRuntimeApiKey;
export function decryptRuntimeApiKey(
  payload: EncryptedRuntimeApiKey,
  secret = process.env.AUTH_SECRET
): string;
```

- [ ] **Step 4: Add the account configuration table to the schema**

Define `userRuntimeConfig` in `lib/db/schema.ts` with `userId` as a primary-key UUID foreign key to `user.id` using `onDelete: "cascade"`, required `baseUrl`, `encryptedApiKey`, `iv`, and `authTag` text columns, plus `createdAt` and `updatedAt` timestamps. Export `UserRuntimeConfig` from `InferSelectModel`.

- [ ] **Step 5: Generate and inspect the idempotent migration**

Run `pnpm exec drizzle-kit generate --name account-runtime-config`. Ensure the generated SQL creates `UserRuntimeConfig` with the user foreign key and no destructive statements. Keep the generated `0002_account_runtime_config.sql`, `meta/0002_snapshot.json`, and journal entry. Run `pnpm exec drizzle-kit check` and confirm it reports no schema drift.

- [ ] **Step 6: Run the crypto tests and typecheck**

Run `pnpm exec tsx --test tests/unit/runtime-config-crypto.test.ts` and `pnpm exec tsc --noEmit`.

Expected result: all crypto tests pass and TypeScript reports no errors.

- [ ] **Step 7: Commit the primitives**

Run `git add lib/ai/runtime-config-crypto.ts lib/db/schema.ts lib/db/migrations/0002_account_runtime_config.sql lib/db/migrations/meta/0002_snapshot.json lib/db/migrations/meta/_journal.json tests/unit/runtime-config-crypto.test.ts && git commit -m "feat: add encrypted account runtime config"`.

### Task 2: Add account CRUD and runtime precedence

**Files:**
- Modify: `lib/db/queries.ts`
- Modify: `lib/ai/runtime-config.ts`
- Modify: `tests/unit/runtime-config.test.ts`

- [ ] **Step 1: Write failing precedence tests**

Add a pure resolver test with account, cookie, and gateway candidates that proves account configuration wins. Add tests proving an invalid account payload falls back to the cookie and a missing account falls back to the gateway key. Keep the existing URL normalization and cookie tests unchanged.

```ts
test("prefers the authenticated account configuration", () => {
  assert.deepEqual(
    resolveRuntimeConfigSources({
      account: { apiKey: "account-key", baseUrl: "https://account.example" },
      cookie: { apiKey: "cookie-key", baseUrl: "https://cookie.example" },
      gatewayApiKey: "gateway-key",
    }),
    {
      apiKey: "account-key",
      baseUrl: "https://account.example",
      mode: "embedded",
    }
  );
});
```

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run `pnpm exec tsx --test tests/unit/runtime-config.test.ts`.

Expected result: the new test errors because the pure source resolver is not exported yet.

- [ ] **Step 3: Add account configuration CRUD queries**

In `lib/db/queries.ts`, add `getUserRuntimeConfigByUserId`, `upsertUserRuntimeConfig`, and `deleteUserRuntimeConfig` using the new table and `userId` predicates. The upsert must set all encrypted fields and `updatedAt`, and the read query must select only the fields needed by the runtime resolver. Wrap database errors in `ChatbotError("bad_request:database", { cause })` like the surrounding queries.

- [ ] **Step 4: Add pure source precedence and account lookup**

Export `resolveRuntimeConfigSources` from `lib/ai/runtime-config.ts`. It accepts optional account and cookie configurations plus a gateway key, returns account first, then cookie, then gateway, and never returns a partially populated embedded configuration. Update `getRuntimeConfig()` to lazily import `auth` and the account query, load only regular-user configuration, decrypt it with `AUTH_SECRET`, and pass the result through the pure resolver. A missing or undecryptable row is treated as absent. Guest sessions skip the account query.

- [ ] **Step 5: Run the focused tests and typecheck**

Run `pnpm exec tsx --test tests/unit/runtime-config.test.ts tests/unit/runtime-config-crypto.test.ts` and `pnpm exec tsc --noEmit`.

Expected result: precedence, fallback, crypto, and existing runtime tests pass.

- [ ] **Step 6: Commit the resolver layer**

Run `git add lib/db/queries.ts lib/ai/runtime-config.ts tests/unit/runtime-config.test.ts && git commit -m "feat: resolve runtime config from user accounts"`.

### Task 3: Add account-aware configuration API and explicit provider errors

**Files:**
- Modify: `app/api/runtime-config/route.ts`
- Modify: `lib/errors.ts`
- Modify: `lib/i18n/locales/en.ts`
- Modify: `lib/i18n/locales/zh.ts`
- Modify: `app/(chat)/api/chat/route.ts`
- Modify: `app/(chat)/api/agent/route.ts`
- Test: `tests/unit/runtime-config-api.test.ts`

- [ ] **Step 1: Write failing response-shape tests**

Add pure tests for `serializeRuntimeConfigStatus`, which returns `configured`, `mode`, and `baseUrl` but never includes `apiKey`, `encryptedApiKey`, `iv`, or `authTag`. Add a test for the `not_configured:chat` error code and localized message keys.

- [ ] **Step 2: Run the focused tests and verify the expected failure**

Run `pnpm exec tsx --test tests/unit/runtime-config-api.test.ts`.

Expected result: the test errors because the status serializer and provider-not-configured error code do not exist yet.

- [ ] **Step 3: Implement regular-user upsert and guest-compatible POST**

In `POST /api/runtime-config`, parse through `parseEmbeddedRuntimeConfig`. For a regular session, encrypt the parsed key and call the account upsert query. For a guest or unauthenticated request, keep the existing seven-day HttpOnly cookie behavior. Return only `{ success: true, mode: "embedded", baseUrl }` in both paths. Never log the payload.

- [ ] **Step 4: Implement status and delete handlers**

Add `GET /api/runtime-config` for regular users. Return `{ configured: boolean, mode, baseUrl? }` and omit all key material. Add `DELETE /api/runtime-config` to delete the regular user's row and clear the runtime cookie; for guests it only clears the cookie. Return 401 for a regular-user-only status request without a regular session.

- [ ] **Step 5: Add the explicit provider-not-configured error**

Extend `ErrorType` and `getMessageByErrorCode` with `not_configured`. Add `not_configured:chat` handling with a 503 status and localized client copy directing the user to `/api-dashboard`. After `getRuntimeConfig()` in the chat and agent routes, return that error when gateway mode has no API key. Keep the existing credit-card error separate.

- [ ] **Step 6: Run focused tests and typecheck**

Run `pnpm exec tsx --test tests/unit/runtime-config-api.test.ts tests/unit/runtime-config.test.ts tests/unit/runtime-config-crypto.test.ts` and `pnpm exec tsc --noEmit`.

Expected result: all API contract tests pass and TypeScript reports no errors.

- [ ] **Step 7: Commit the API layer**

Run `git add app/api/runtime-config/route.ts lib/errors.ts lib/i18n/locales/en.ts lib/i18n/locales/zh.ts app/'(chat)'/api/chat/route.ts app/'(chat)'/api/agent/route.ts tests/unit/runtime-config-api.test.ts && git commit -m "feat: add account runtime config API"`.

### Task 4: Add the account configuration dashboard

**Files:**
- Create: `components/venice/runtime-config-form.tsx`
- Modify: `app/(chat)/api-dashboard/page.tsx`
- Modify: `lib/i18n/locales/en.ts`
- Modify: `lib/i18n/locales/zh.ts`
- Test: `tests/e2e/runtime-config.test.ts`

- [ ] **Step 1: Write the failing browser test**

Create a Playwright test that registers a unique regular user through `/register`, opens `/api-dashboard`, mocks `GET /api/models` with one New API model, fills the Base URL and API Key fields, saves, and asserts the page shows the configured base URL and discovered model count. Then reload the page with `GET /api/runtime-config` mocked as configured and assert the key input is blank. Click clear and assert the page returns to the unconfigured state. The test must also assert that the intercepted runtime-config response body does not contain the submitted key. Use a second browser context with a different registered user to request the real status endpoint and assert that user sees `configured: false`, proving the row is account-scoped.

- [ ] **Step 2: Run the browser test and verify the expected failure**

Run `PORT=3011 pnpm exec playwright test tests/e2e/runtime-config.test.ts --project=e2e`.

Expected result: the test fails because the dashboard has no configuration fields or save action yet.

- [ ] **Step 3: Implement the form component**

Create a client component using SWR for `GET /api/runtime-config` and local state for `baseUrl`, `apiKey`, submission state, and inline feedback. On save, `POST` the two fields, then request `/api/models` and report the discovered model count. Clear the key input after a successful save, dispatch `moana-runtime-config-ready`, and revalidate status. On clear, call `DELETE`, clear local state, dispatch the same event, and show the unconfigured state. Treat a 401 status as a sign-in prompt rather than a failed provider connection. Use existing `Input`, `Button`, and lucide icons.

- [ ] **Step 4: Mount the form and add localized copy**

Keep `ApiDashboardPage` as a client page only if required by the component boundary; otherwise render `RuntimeConfigForm` inside the existing page. Add translations for the section title, description, base URL label and placeholder, API key label and placeholder, save, clear, saving, verifying, configured, unconfigured, model count, sign-in required, invalid input, connection failure, and save success. Keep the existing API quick-start cards and token dashboard scope unchanged.

- [ ] **Step 5: Run the browser test, static checks, and typecheck**

Run `PORT=3011 pnpm exec playwright test tests/e2e/runtime-config.test.ts --project=e2e`, `pnpm exec tsc --noEmit`, and `pnpm run check`.

Expected result: the configuration flow passes and the static checks report no errors.

- [ ] **Step 6: Commit the dashboard**

Run `git add components/venice/runtime-config-form.tsx app/'(chat)'/api-dashboard/page.tsx lib/i18n/locales/en.ts lib/i18n/locales/zh.ts tests/e2e/runtime-config.test.ts && git commit -m "feat: add account runtime config dashboard"`.

### Task 5: Verify account propagation and regressions

**Files:**
- Modify: `tests/e2e/newapi-embedded.test.ts`
- Modify: `tests/e2e/api.test.ts`
- Modify: `tests/unit/*.test.ts` only when a focused regression assertion is required.

- [ ] **Step 1: Add account-bound model and chat assertions**

Extend the browser fixture so a saved account configuration causes `/api/models` to return the mocked embedded model after a dashboard save and causes the subsequent chat request to use that model. Assert the API response bodies never contain the submitted key. Add an unconfigured regular-user chat assertion that the error toast contains `/api-dashboard`.

- [ ] **Step 2: Run affected browser tests**

Run `PORT=3011 pnpm exec playwright test tests/e2e/runtime-config.test.ts tests/e2e/newapi-embedded.test.ts tests/e2e/api.test.ts --project=e2e`.

Expected result: account-bound, URL-bootstrap, and standalone chat scenarios pass.

- [ ] **Step 3: Run the full verification suite**

Run `pnpm exec tsx --test tests/unit/*.test.ts`, `pnpm exec tsc --noEmit`, `pnpm run check`, `pnpm run build`, and `PORT=3011 pnpm test`.

Expected result: all unit tests pass, the production build completes, and all browser tests pass with no provider key tracked in Git.

- [ ] **Step 4: Review the final diff**

Run `git diff --check`, `git status --short`, and `git diff --stat`. Confirm the only source changes are account configuration, dashboard, error messaging, migrations, and tests; keep existing untracked browser artifacts out of commits.
