# Account-Bound Runtime Provider Configuration

## Context

The standalone app currently resolves a provider from an embedded runtime cookie or from `AI_GATEWAY_API_KEY`. The embedded cookie can be initialized through URL parameters, but there is no in-app configuration surface. When neither source is available, chat requests fall through to the Vercel AI Gateway path and fail with a generic error in a self-hosted environment.

The new configuration flow must bind a New API endpoint and API key to a signed-in account. Guests keep the existing temporary URL bootstrap behavior. The API key must stay server-only after submission and must not be returned by status endpoints, model endpoints, logs, or rendered UI.

## Design

### Storage and encryption

Add a one-to-one `UserRuntimeConfig` table keyed by `userId`. The row stores the normalized provider base URL and an encrypted API key payload together with its encryption metadata and update timestamp. The foreign key cascades with the user so account deletion cannot leave provider credentials behind.

Encrypt the API key with AES-256-GCM. Derive the 256-bit encryption key from the existing `AUTH_SECRET` using a domain-separated SHA-256 derivation, generate a fresh random IV for every save, and persist the IV, authentication tag, and ciphertext as encoded strings. Decryption failure is treated as a missing configuration and never exposes the stored value. The application must fail clearly at startup or save time if the secret required to encrypt an account key is unavailable.

### Runtime resolution

Extend the server-only runtime resolver so it first checks the authenticated regular user's account configuration. A valid account row produces embedded mode and the decrypted key. If no account configuration exists, the resolver falls back to the existing embedded runtime cookie and then to `AI_GATEWAY_API_KEY`, preserving current URL bootstrap and deployment behavior for guests and legacy links.

All existing consumers continue to call the same resolver. The resolver obtains the current session through a lazy server import to avoid an authentication module cycle. The provider factory, chat route, agent route, title generation, model discovery, and media routes therefore use the account configuration without duplicating user lookup logic.

### Configuration API

`POST /api/runtime-config` validates and normalizes the base URL and API key. A signed-in regular user gets an encrypted upsert in the user's row and a response containing only `{ success, mode, baseUrl }`. A guest or unauthenticated request keeps the existing temporary Cookie bootstrap behavior and returns the same key-free response, so shared links and integrations remain compatible.

`GET /api/runtime-config` requires a signed-in regular user and returns configuration status with the normalized base URL and a boolean indicating whether a key is present. It never returns the key or encrypted payload. `DELETE /api/runtime-config` removes the account row for a regular user and clears any legacy runtime cookie; for a guest it only clears the temporary cookie.

After saving, the client calls `/api/models` using the new server-side configuration. A successful response confirms connectivity and supplies the discovered model count. A failed response leaves the saved configuration intact but displays the provider error and keeps the user on the configuration page so it can be corrected.

### User interface

Add a connection settings section to the existing API dashboard. The form contains a New API base URL field and a password-style API key field, with save and clear actions. The page loads status on entry, shows the configured host without revealing the key, disables duplicate submissions, and reports validation, connectivity, and persistence outcomes inline.

The existing runtime bootstrap component remains available for deep links and integrations. When a signed-in user arrives with `baseUrl` and `apiKey` parameters, its request is handled by the same account-bound `POST /api/runtime-config` endpoint. Once accepted, the parameters are removed from the address bar as they are today.

### Error behavior

When no account configuration, embedded cookie, or Gateway key is available, chat and agent requests return a dedicated provider-not-configured response. The client renders a localized message with a direct link to `/api-dashboard`. Provider authentication and model discovery failures retain their response detail without exposing the submitted key.

### Testing and acceptance

Unit coverage will exercise encryption round trips, invalid or tampered payload handling, account configuration precedence, and key omission from serialized responses. Route coverage will verify regular-user authorization, guest Cookie compatibility, upsert and delete behavior, and account isolation.

Browser coverage will open the API dashboard, save a mocked New API configuration, verify the model refresh and configured status, clear the configuration, and confirm that an unconfigured chat points to the dashboard instead of showing the generic error. Existing URL bootstrap and embedded model tests must remain green.

The migration must be idempotent and included in the normal Drizzle migration sequence. Completion means a regular account can configure New API once, navigate to a new chat, select a discovered model, and receive a response without putting provider credentials in the browser after save.

## Scope boundaries

This change supports one New API-compatible provider configuration per account. It does not add multiple provider profiles, team-level sharing, API key rotation history, billing, or token usage reporting. The existing token dashboard remains out of scope.
