# Account Model Selection

## Context

The account-bound New API connection is already stored server-side and the
application can discover models from the configured `/v1/models` endpoint.
The current model selector, however, treats every discovered model as
available. Users need to decide which models appear in chat, and the same
selection must drive both normal chat and Agentic Chat.

The feature must preserve the existing account isolation and credential
handling rules. A model choice belongs to the signed-in account, while the
API key remains encrypted and server-only. The browser may receive model
metadata and IDs, but never the key or its encrypted representation.

## Design

### Account model preferences

Extend the one-to-one `UserRuntimeConfig` row with an enabled model ID list
and an optional default model ID. Only model IDs are persisted. Names,
capabilities, provider labels, and other metadata continue to come from the
latest New API discovery response so renamed or removed models do not leave
stale metadata in the database.

Rows created before this change have no model preferences. Until the account
saves a selection, all models returned by New API are considered enabled and
the first discovered model is the effective default. This keeps existing
accounts working without a data backfill.

### Discovery and save flow

The API dashboard keeps the existing base URL and API key fields. A
`Get models` action sends the currently entered values to a server endpoint
that calls the configured OpenAI-compatible `/v1/models` endpoint. The
endpoint requires a signed-in regular account, validates the URL and key, and
returns the complete discovered model metadata. It does not save the key or
the model selection as a side effect.

The dashboard renders the discovered models in a multi-select dropdown or
equivalent list. After a successful discovery all returned models are checked
by default. Each row shows the model name and the existing capability hints.
The user can uncheck models and chooses one checked model as the default.
Saving the model preferences sends only the enabled IDs and default ID to a
separate account endpoint. The server uses the already stored encrypted key
and base URL for this preference-only save, so changing model choices after a
previous save does not require displaying or re-entering the key. If the
connection fields have changed, the user saves the connection first and then
discovers the new model list.

At least one model must remain enabled. The default model must be a member of
the enabled set. The page reports discovery errors without overwriting the
last saved preferences, and reports preference-save errors without exposing
credentials.

### Runtime model response

`GET /api/models` remains the single model source for client surfaces. In
embedded mode it discovers the current models from New API, intersects them
with the account's enabled ID list when one exists, and returns only the
enabled models plus `defaultModelId`, capabilities, and mode. Models that no
longer exist are omitted. If the saved list becomes empty after this
intersection, the response is an unavailable configuration error rather than
silently re-enabling an old model.

For legacy rows without saved preferences, the endpoint returns the full
discovered list and uses the first model as the default. Gateway mode keeps
the existing curated model behavior.

### Chat and Agentic Chat behavior

Normal chat and Agentic Chat consume the same `/api/models` response and show
the same enabled model set. A new chat initializes with the account's
`defaultModelId`. Existing chat pages keep their current model choice while
it remains enabled, and fall back to the account default when it is removed.
The current model ID continues to be sent as `selectedChatModel` in both
request bodies.

The chat and agent routes validate the requested model against the same
account-filtered discovery result before creating a provider. A missing or
disabled ID is replaced by the effective default; if no enabled model is
available, the route returns the localized provider configuration error and
does not call New API for completion.

### API boundaries and security

Use a dedicated discovery endpoint for requests containing a newly entered
API key and a preference endpoint for saving IDs against an existing account
configuration. Both endpoints require a regular signed-in user. Guest URL
bootstrap remains unchanged and continues to use its temporary HttpOnly
cookie; guest sessions do not persist model preferences.

The discovery response is limited to normalized model metadata already safe
for the model selector. Request logs, route errors, serialized account
status, and browser-rendered content must not contain the API key.

### UI states

The dashboard shows the connection status first. Before discovery, the model
selection control is unavailable. During discovery, the action is disabled
and shows progress. After discovery, all models are checked and the enabled
count is visible. Saving preferences disables the control until completion.
If a saved model disappears from a later discovery response, it is shown as
unavailable and excluded from the next saved set. Clearing the connection
also clears the saved model preferences.

### Testing and acceptance

Unit tests cover preference normalization, default selection, legacy no-
preference behavior, intersection with discovered models, and rejection of an
empty enabled set or a default outside that set.

Route tests cover authenticated discovery, preference-only save using the
stored encrypted connection, account isolation, guest rejection, and omission
of key material from every response.

Browser tests cover fetching a mocked model list from the dashboard, the
default-all-checked state, unchecking and saving a subset, selecting a
default, reloading the page, and using the saved models in both normal and
Agentic Chat request bodies. A second account must not see the first
account's selection. Existing chat, bootstrap, search, and runtime
configuration tests remain green.

## Scope boundaries

This change supports one enabled-model set and one default model per regular
account. It does not add provider profiles, team sharing, model aliases,
usage limits, billing, token dashboards, or model metadata editing.
