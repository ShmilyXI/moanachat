# Account Model Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let each signed-in account fetch its New API models, enable a subset with a default model, and use that saved set in normal chat and Agentic Chat.

**Architecture:** Store only enabled model IDs and the default ID alongside the encrypted account connection. A server-only model resolver fetches current New API metadata, intersects it with the saved IDs, and exposes the resulting list through `/api/models`; the chat and agent routes use the same resolver for request validation. Extract the existing compact model selector so both chat surfaces share one UI and selection contract.

**Tech Stack:** Next.js App Router, React, SWR, AI SDK `useChat`, Drizzle ORM/PostgreSQL, Zod, Playwright, Node test runner.

---

### Task 1: Persist Account Model Preferences

**Files:**
- Modify: `lib/db/schema.ts:28-39` to add nullable `enabledModelIds` JSON and `defaultModelId` text columns.
- Modify: `lib/ai/runtime-config.ts:7-20,186-230` to carry preferences through runtime resolution.
- Modify: `lib/db/queries.ts:78-145` to read and update preference columns without touching encrypted credentials.
- Create: `lib/db/migrations/0003_account_model_preferences.sql` through Drizzle generation.
- Test: `tests/unit/runtime-config.test.ts` and `tests/unit/runtime-config-api.test.ts`.

- [ ] **Step 1: Write failing preference normalization tests**

Add tests for the pure preference contract:

```ts
test("keeps a valid enabled set and default model", () => {
  assert.deepEqual(
    normalizeRuntimeModelPreferences({
      defaultModelId: "openai/gpt-4.1",
      enabledModelIds: ["openai/gpt-4.1", "deepseek/deepseek-v3"],
    }),
    {
      defaultModelId: "openai/gpt-4.1",
      enabledModelIds: ["openai/gpt-4.1", "deepseek/deepseek-v3"],
    }
  );
});

test("rejects an empty set and a default outside the set", () => {
  assert.throws(
    () =>
      normalizeRuntimeModelPreferences({
        defaultModelId: "missing",
        enabledModelIds: [],
      }),
    /at least one|default/i
  );
});
```

- [ ] **Step 2: Run the preference tests and confirm the red failure**

Run `pnpm exec tsx --test tests/unit/runtime-config.test.ts tests/unit/runtime-config-api.test.ts`.
Expected: FAIL because `normalizeRuntimeModelPreferences` and the preference fields do not exist yet.

- [ ] **Step 3: Add the schema and runtime preference types**

Extend the table and types with nullable preference fields:

```ts
export const userRuntimeConfig = pgTable("UserRuntimeConfig", {
  // existing encrypted connection fields remain unchanged
  defaultModelId: text("defaultModelId"),
  enabledModelIds: json("enabledModelIds").$type<string[]>(),
  // existing timestamps and userId remain unchanged
});

export type RuntimeModelPreferences = {
  enabledModelIds: string[];
  defaultModelId: string;
};
```

Implement `normalizeRuntimeModelPreferences(input: unknown)` in
`lib/ai/runtime-config.ts`. It must trim IDs, remove duplicates, reject an
empty array, and require `defaultModelId` to be in the resulting array. Keep
`undefined` for legacy rows with no saved preferences.

- [ ] **Step 4: Add preference query operations**

Add `updateUserRuntimeModelPreferences({ userId, enabledModelIds, defaultModelId })` to `lib/db/queries.ts`. The query updates only `enabledModelIds`, `defaultModelId`, and `updatedAt`. Include the columns in `getUserRuntimeConfigByUserId` so `getRuntimeConfig()` can return them.

- [ ] **Step 5: Generate and apply the idempotent migration**

Run:

```bash
pnpm exec drizzle-kit generate
pnpm db:migrate
```

Expected migration SQL adds nullable `enabledModelIds` JSON and
`defaultModelId` text columns to `UserRuntimeConfig`; `pnpm db:migrate`
finishes successfully on both a fresh and an existing database.

- [ ] **Step 6: Verify the green unit tests and commit**

Run `pnpm exec tsx --test tests/unit/runtime-config.test.ts tests/unit/runtime-config-api.test.ts` and expect all tests to pass. Commit only the schema, migration, query, runtime type, and unit-test changes with `feat: persist account model preferences`.

### Task 2: Centralize New API Model Filtering

**Files:**
- Modify: `lib/ai/newapi.ts:1-150` to add pure filtering and effective-default helpers.
- Modify: `lib/ai/models.ts:270-300` or the existing selection helper to honor a preferred default before falling back to the first model.
- Test: `tests/unit/newapi.test.ts` and `tests/unit/chat-model-selection.test.ts`.

- [ ] **Step 1: Write failing resolver tests**

Cover legacy rows, enabled intersections, removed models, and default fallback:

```ts
test("filters discovered models to the saved enabled IDs", () => {
  const result = filterRuntimeModels(discoveredModels, [
    "openai/gpt-4.1",
    "removed/model",
  ]);
  assert.deepEqual(result.map((model) => model.id), ["openai/gpt-4.1"]);
});

test("uses the saved default when it is still available", () => {
  assert.equal(
    getRuntimeDefaultModel(filteredModels, "anthropic/claude-3.7"),
    "anthropic/claude-3.7"
  );
});

test("treats undefined preferences as legacy all-enabled behavior", () => {
  assert.deepEqual(filterRuntimeModels(discoveredModels, undefined), discoveredModels);
});
```

- [ ] **Step 2: Run the resolver tests and confirm failure**

Run `pnpm exec tsx --test tests/unit/newapi.test.ts tests/unit/chat-model-selection.test.ts`.
Expected: FAIL because the resolver helpers and preferred-default behavior are not implemented.

- [ ] **Step 3: Implement pure filtering helpers**

Add these exact contracts to `lib/ai/newapi.ts`:

```ts
export function filterRuntimeModels(
  models: readonly ChatModel[],
  enabledModelIds: readonly string[] | undefined
): ChatModel[] {
  if (enabledModelIds === undefined) {
    return [...models];
  }
  const enabled = new Set(enabledModelIds);
  return models.filter((model) => enabled.has(model.id));
}

export function getRuntimeDefaultModel(
  models: readonly ChatModel[],
  preferredModelId: string | undefined
): string | undefined {
  if (preferredModelId && models.some((model) => model.id === preferredModelId)) {
    return preferredModelId;
  }
  return models[0]?.id;
}
```

- [ ] **Step 4: Update `selectChatModel` to prefer the account default**

For embedded mode, keep a requested model when it is in `availableModels`; otherwise use `staticDefaultModelId` when it is in that list; otherwise use the first available model. Preserve gateway validation against `allowedModelIds`.

- [ ] **Step 5: Run resolver tests and commit**

Run the two unit-test files and expect all tests to pass. Commit the pure resolver changes with `feat: centralize enabled model resolution`.

### Task 3: Add Discovery and Preference APIs

**Files:**
- Create: `app/api/runtime-config/models/route.ts` for discovery and preference save.
- Modify: `app/api/runtime-config/route.ts:20-120` to expose saved IDs/default in status and clear them with the connection.
- Modify: `lib/ai/runtime-config.ts:135-148` to serialize IDs/default without credential material.
- Test: `tests/unit/runtime-config-api.test.ts` and `tests/e2e/runtime-config.test.ts`.

- [ ] **Step 1: Add route-level failing contract tests**

Extend the runtime configuration browser fixture so `GET /api/runtime-config` returns `enabledModelIds` and `defaultModelId`, `POST /api/runtime-config/models` returns a discovered model array, and `PUT /api/runtime-config/models` receives only IDs. Assert the request and response bodies never contain the API key on the preference endpoint.

- [ ] **Step 2: Run the focused browser test and confirm the red failure**

Run `PORT=3011 pnpm exec playwright test tests/e2e/runtime-config.test.ts -g "model" --reporter=line`.
Expected: FAIL because the discovery route, preference route, and status fields do not exist.

- [ ] **Step 3: Implement `POST /api/runtime-config/models`**

Require a regular signed-in user. Accept `{ baseUrl?: string, apiKey?: string }`. When both values are supplied, normalize them with `parseEmbeddedRuntimeConfig`; when `apiKey` is omitted, load and decrypt the account's stored key and use the stored base URL. Call `fetchNewApiModels`, return `{ capabilities, models, mode: "embedded" }`, and return `502` with `new_api_models_unavailable` when discovery returns no models. Never persist the supplied key in this route.

- [ ] **Step 4: Implement `PUT /api/runtime-config/models`**

Validate the body with Zod as `{ enabledModelIds: z.array(z.string().min(1)), defaultModelId: z.string().min(1) }`. Normalize the values, load the current account row, decrypt its key, fetch the current remote models, and reject IDs not present in that response with `400`. Call `updateUserRuntimeModelPreferences` and return `{ success: true, enabledModelIds, defaultModelId }`.

- [ ] **Step 5: Include preferences in status and clear behavior**

`GET /api/runtime-config` returns the saved IDs/default when present. `POST /api/runtime-config` clears old model preferences whenever the connection is replaced, so a new endpoint cannot inherit stale IDs. `DELETE /api/runtime-config` removes the row and therefore clears both connection and preferences.

- [ ] **Step 6: Run focused tests and commit**

Run `pnpm exec tsx --test tests/unit/runtime-config-api.test.ts` and the focused runtime browser tests. Expect all to pass. Commit with `feat: add account model discovery APIs`.

### Task 4: Make `/api/models`, Chat, and Agent Use Enabled Models

**Files:**
- Modify: `app/(chat)/api/models/route.ts:1-70` to filter embedded models and return `defaultModelId`.
- Modify: `app/(chat)/api/chat/route.ts:126-150` to validate against the filtered set.
- Modify: `app/(chat)/api/agent/route.ts:60-84` to use the same filtered set.
- Modify: `lib/ai/runtime-config.ts:186-230` to return account preferences to server consumers.
- Test: `tests/unit/chat-model-selection.test.ts`, `tests/unit/newapi.test.ts`, and `tests/e2e/newapi-embedded.test.ts`.

- [ ] **Step 1: Write failing filtered-response tests**

Add assertions that an embedded `/api/models` response contains only enabled IDs and its `defaultModelId` is the saved default. Add chat and agent request tests that submit a disabled ID and expect it to resolve to the saved default.

- [ ] **Step 2: Run the tests and confirm failure**

Run `pnpm exec tsx --test tests/unit/chat-model-selection.test.ts tests/unit/newapi.test.ts` and the focused embedded browser test. Expected: FAIL because the routes currently expose/use every discovered model and do not return an account default.

- [ ] **Step 3: Filter the embedded model response**

In `/api/models`, fetch all current New API models, call `filterRuntimeModels(models, runtimeConfig.enabledModelIds)`, return `502` if a saved non-empty set has no current intersection, and return:

```ts
{
  capabilities: getCapabilitiesForModels(availableModels),
  defaultModelId: getRuntimeDefaultModel(
    availableModels,
    runtimeConfig.defaultModelId
  ),
  mode: "embedded",
  models: availableModels,
}
```

- [ ] **Step 4: Validate chat and agent requests with the same set**

Both routes fetch, filter, and pass the filtered list to `selectChatModel`. Use `runtimeConfig.defaultModelId` as the preferred fallback. Keep the existing unavailable response when the filtered list is empty.

- [ ] **Step 5: Run route tests and commit**

Run the unit tests and `PORT=3011 pnpm exec playwright test tests/e2e/newapi-embedded.test.ts`. Expect all to pass. Commit with `feat: enforce account model selections in chat routes`.

### Task 5: Extract a Shared Model Selector and Wire Normal Chat

**Files:**
- Create: `components/chat/model-selector-compact.tsx` by extracting the current `PureModelSelectorCompact` and its option/group helpers from `components/chat/multimodal-input.tsx:858-1040`.
- Modify: `components/chat/multimodal-input.tsx:40-55,858-1040` to import the shared selector and remove the duplicate implementation.
- Modify: `hooks/use-active-chat.tsx:87-136` to initialize and recover the current model using `modelsData.defaultModelId`.
- Test: `tests/e2e/model-selector.test.ts` and `tests/e2e/newapi-embedded.test.ts`.

- [ ] **Step 1: Add a failing normal-chat default test**

Extend the embedded browser test so the mocked `/api/models` response contains two enabled models and `defaultModelId: "openai/gpt-4.1"`; after page load assert the selector displays `GPT 4.1` without a manual click.

- [ ] **Step 2: Run the test and confirm failure**

Run `PORT=3011 pnpm exec playwright test tests/e2e/newapi-embedded.test.ts -g "default" --reporter=line`.
Expected: FAIL because `useActiveChat` currently initializes from the static default and only falls back to the first dynamic model.

- [ ] **Step 3: Extract the selector with a stable interface**

Export:

```ts
export function ModelSelectorCompact({
  selectedModelId,
  onModelChange,
}: {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
})
```

Keep the existing popover, search, capability icons, and `chat-model` cookie behavior. Its model source remains `/api/models`, which now already contains only enabled models.

- [ ] **Step 4: Apply the account default in `useActiveChat`**

When the current ID is absent from the returned list, call `selectChatModel` with `modelsData.defaultModelId ?? DEFAULT_CHAT_MODEL` as the preferred fallback. Preserve an explicitly selected model while it remains enabled.

- [ ] **Step 5: Run selector tests and commit**

Run the model selector and embedded tests. Expect all to pass. Commit with `refactor: share runtime model selector`.

### Task 6: Add Model Selection to Agentic Chat

**Files:**
- Modify: `app/(chat)/chat/agent/page.tsx:1-190` to load `/api/models`, track `selectedModelId`, render the shared selector, and send the selected ID.
- Modify: `tests/e2e/newapi-embedded.test.ts` or create `tests/e2e/agent-model-selector.test.ts` to assert the agent request body.

- [ ] **Step 1: Write the failing Agentic Chat selection test**

Mock `/api/models` with two enabled models and intercept `/api/agent`. Select the second model, send a prompt, and assert:

```ts
expect(agentBody?.selectedChatModel).toBe("anthropic/claude-3.7");
```

- [ ] **Step 2: Run the test and confirm failure**

Run `PORT=3011 pnpm exec playwright test tests/e2e/agent-model-selector.test.ts --reporter=line`.
Expected: FAIL because Agentic Chat currently has no model selector and omits `selectedChatModel` from its request body.

- [ ] **Step 3: Wire model state and selector**

Use SWR on `/api/models`, initialize `selectedModelId` from `defaultModelId` or the first returned model, render `ModelSelectorCompact` in the composer footer, and update the transport body:

```ts
body: {
  id,
  messages: currentMessages,
  selectedChatModel: selectedModelId,
}
```

Disable sending until the model list is available when the provider is embedded.

- [ ] **Step 4: Run Agentic Chat tests and commit**

Run the new test and the existing agent tests. Expect all to pass. Commit with `feat: let Agentic Chat choose enabled models`.

### Task 7: Build the API Dashboard Multi-Select Flow

**Files:**
- Create: `components/venice/runtime-model-picker.tsx` for the model multi-select and default selector.
- Modify: `components/venice/runtime-config-form.tsx:18-220` to fetch models, hydrate saved preferences, save IDs/default, and render loading/error states.
- Modify: `lib/i18n/locales/en.ts` and `lib/i18n/locales/zh.ts` with discovery, selection, default, and validation copy.
- Test: `tests/e2e/runtime-config.test.ts`.

- [ ] **Step 1: Add failing dashboard interaction coverage**

Extend the mocked dashboard test to intercept `POST /api/runtime-config/models` with three models, click `Get models`, assert all three checkboxes are checked, uncheck one, choose a default, click `Save model selection`, and assert the `PUT /api/runtime-config/models` body contains exactly the remaining IDs and default ID.

- [ ] **Step 2: Run the dashboard test and confirm failure**

Run `PORT=3011 pnpm exec playwright test tests/e2e/runtime-config.test.ts -g "model selection" --reporter=line`.
Expected: FAIL because the dashboard has no discovery action or model picker.

- [ ] **Step 3: Implement the picker component**

Use the existing Popover and Command primitives. Each model row contains a native checkbox with `checked={selectedIds.has(model.id)}` and a separate default radio/select control. The component accepts discovered models, selected IDs, default ID, and change callbacks. It must prevent unchecking the current default until another default is selected and expose `data-testid="runtime-model-picker"`.

- [ ] **Step 4: Implement discovery and preference state in the form**

Add `discoveredModels`, `selectedModelIds`, `defaultModelId`, `isDiscovering`, and `isSavingPreferences` state. The discovery handler posts the current base URL and optional key to `/api/runtime-config/models`; on success it sets every returned ID as selected, then replaces that set with the saved IDs intersected with the response when saved preferences exist. The save handler rejects an empty set, sends `PUT /api/runtime-config/models`, and refreshes status. Keep the existing connection save behavior and clear the picker when the connection is cleared.

- [ ] **Step 5: Add localized UI copy and states**

Add English and Chinese strings for `Get models`, `Fetching models`, `Save model selection`, `Models enabled`, `Default model`, `Select at least one model`, `Model discovery failed`, and `Model selection saved`. Show the discovery button beside the API fields, disable it while saving/fetching, and keep the API key input empty after a successful connection save.

- [ ] **Step 6: Run dashboard tests and commit**

Run the focused runtime configuration browser tests and expect them to pass. Commit with `feat: add account model selection dashboard`.

### Task 8: Full Verification and Delivery

**Files:**
- Modify only test fixtures or localized copy if verification reveals a real contract mismatch.
- Do not stage `.playwright-cli/`, `.superpowers/`, `output/`, or unrelated existing worktree changes.

- [ ] **Step 1: Run all unit tests**

Run `pnpm exec tsx --test tests/unit/*.test.ts` and require all tests to pass.

- [ ] **Step 2: Run static checks**

Run `pnpm exec tsc --noEmit` and `pnpm run check`; require zero errors.

- [ ] **Step 3: Run the production build and migration**

Run `pnpm run build`; require migration completion, successful compilation, and route generation.

- [ ] **Step 4: Run the full browser suite**

Run `PORT=3011 pnpm test`; require all existing and new browser tests to pass, including account isolation and both chat surfaces sending their selected model IDs.

- [ ] **Step 5: Inspect the final diff and commit**

Run `git diff --check`, `git status --short`, and `git diff --stat`. Verify no API key appears in response fixtures, rendered text, or committed files. Commit only feature files and tests with `feat: support account model selection across chat surfaces`.
