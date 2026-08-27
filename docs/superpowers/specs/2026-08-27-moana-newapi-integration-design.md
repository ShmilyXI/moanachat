# Moanachat New API Integration Design

## Goal

Allow Moanachat to run in two modes without splitting the chat UI:

- When opened from New API, use the New API server address, the current user's API key, and the models available to that key.
- When opened independently, preserve the existing Vercel AI Gateway behavior and environment-based configuration.

## Current Constraints

New API already has a Chat Preset mechanism. An HTTPS preset is rendered in an authenticated iframe and supports `{address}` and `{key}` placeholders. The current implementation obtains the first enabled user token, but it does not create a token automatically and it does not inject a model array.

Moanachat is a Next.js App Router application. Its chat route runs on the server, its provider is currently hard-wired to `gateway.languageModel`, and its model allow-list is a static module constant. The application also has its own NextAuth session and Postgres database. New API authentication cookies are not a shared session mechanism for Moanachat.

## Chosen Architecture

Keep Moanachat as an independently deployed Next.js service. New API remains the account, token, quota, billing, and model-permission system. New API's existing Chat Preset opens Moanachat in an iframe and supplies a bootstrap URL containing `baseUrl` and `apiKey`.

Moanachat adds a runtime configuration module with two provider modes. The embedded mode is selected when a valid New API bootstrap configuration is present. The standalone mode is the fallback when no bootstrap configuration is present and continues to use `AI_GATEWAY_API_KEY` and the existing Vercel AI Gateway provider.

The initial bootstrap flow is:

1. New API resolves `{address}` and `{key}` in the configured Chat Preset URL.
2. Moanachat preserves those query parameters through its guest-auth redirect when necessary.
3. A client bootstrap component posts the parameters to a Moanachat route.
4. The route validates the URL and key, stores the runtime configuration in an HttpOnly, SameSite cookie, and returns a sanitized response.
5. The client removes the bootstrap parameters from the visible URL after the cookie is accepted.
6. Server-side chat and title generation read the runtime cookie and construct an OpenAI-compatible provider for `${baseUrl}/v1`.

The raw API key is intentionally accepted for the first integration because it matches the existing New API Chat Preset contract. A one-time launch ticket that never exposes the real key remains a follow-up security hardening change.

## Provider Interface

The provider module exposes a small runtime interface rather than making callers understand where credentials came from:

- `getRuntimeConfig()` resolves embedded cookie configuration first and standalone environment configuration second.
- `getLanguageModel(modelId)` returns a model from the New API OpenAI-compatible provider in embedded mode or the existing AI Gateway provider in standalone mode.
- `getTitleModel()` follows the same mode selection and uses an available New API model when the configured static title model is not present.

The OpenAI-compatible adapter uses a server-only API key. The browser never sends the New API key to the chat route as a request body field.

## Model Discovery

Moanachat's `/api/models` route keeps the current standalone response behavior. In embedded mode it calls `GET {baseUrl}/v1/models` with `Authorization: Bearer {apiKey}`, normalizes the OpenAI model records into the existing `ChatModel` shape, and returns the available model IDs plus conservative capability defaults.

The chat POST route uses the same server-side discovery path to validate `selectedChatModel`. If the saved model is not available in the current New API token's list, the route selects the first available model. If discovery fails in embedded mode, the request fails with the existing chat error response rather than silently sending a request to another provider.

The client model selector treats embedded models as selectable dynamic models. In standalone mode it continues to show the existing curated model list and the current demo behavior.

## Authentication and Persistence

Moanachat's existing NextAuth and chat-history database remain unchanged. Embedded access does not imply shared login or shared chat history. If the New API user has no Moanachat session, the existing guest-auth flow still creates one.

The runtime cookie is scoped to Moanachat, HttpOnly, and SameSite. It is cleared by the existing sign-out path and is never rendered into the page as a public environment variable. The bootstrap route rejects malformed URLs, empty keys, unsupported schemes, and oversized values.

The bootstrap URL is still observable during the first page request. Production deployments should place a short-lived, model-limited token in the preset until the one-time ticket exchange is implemented. New API's current key lifecycle and model restrictions remain the authority for relay access.

## Error Handling

Standalone mode retains the current AI Gateway activation and provider error messages.

Embedded mode reports a configuration error when the bootstrap payload is malformed, a model list cannot be loaded, or no model is available to the token. A missing or disabled New API token is still surfaced by New API's existing Chat Preset page before Moanachat opens.

The model list is not cached across users. A short request-local fetch is preferred so token model restrictions and quota changes take effect without a stale global cache.

## Scope

This change modifies Moanachat only, except for the administrator adding one Chat Preset entry in New API. It does not add automatic New API token creation, SSO, shared user IDs, shared chat history, a new New API Go route, or single-binary packaging.

## Acceptance Criteria

- Opening Moanachat without bootstrap parameters continues to use the existing Vercel AI Gateway path.
- Opening Moanachat from a New API Chat Preset stores the supplied address and key in a server-only session cookie.
- Embedded chat requests reach New API's `/v1/chat/completions` with the configured user key.
- Embedded model discovery reads New API's `/v1/models` and the selector shows only models returned for that key.
- A model unavailable to the current New API key cannot be selected successfully through the chat POST route.
- New API's existing dashboard, token, quota, and billing pages continue to work unchanged.
- Tests cover bootstrap parsing and validation, standalone fallback, model-list normalization, dynamic default selection, and the request provider choice.
