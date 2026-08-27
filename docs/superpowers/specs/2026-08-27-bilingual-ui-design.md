# MoanaChat Bilingual UI Design

## Goal

Add a Chinese and English language switcher to the standalone `moanachat` chat application. The first visit follows the browser language, while an explicit user choice is remembered locally for later visits. This change remains self-contained and does not share locale configuration with Moana.

## Scope

All user-facing text in the chat experience is included in the first pass. This covers the chat empty state, sidebar navigation and actions, chat header controls, composer controls, delete confirmations, loading and error messages, and other common notices rendered by the chat UI. Model output, user-authored messages, developer documentation, and server logs remain unchanged.

## Architecture

The app will use a small client-side `LocaleProvider` rather than introducing a routing-based i18n framework. A typed translation key set will back separate English and Chinese dictionaries under `lib/i18n`. Components will read the active locale and a `t(key)` function from the provider, keeping translation lookup consistent and making missing keys visible during development.

`app/layout.tsx` will wrap the existing providers with `LocaleProvider`. The provider will start with English during server rendering, then determine the client locale after hydration. The selection priority is a valid locally saved value, then a browser language whose tag starts with `zh`, and finally English. A manual switch updates the provider state, persists the choice under a project-specific local-storage key, and synchronizes `document.documentElement.lang` with `zh` or `en`.

The switcher will live at the bottom of the chat sidebar and expose the current language as an accessible control. It will offer only Chinese and English, retain the existing sidebar layout, and not alter the URL or authentication flow.

## Data Flow

On mount, the provider reads the saved locale and browser language without allowing storage or malformed values to break rendering. It exposes the locale and translation function to descendants. When the user selects another language, descendants re-render from the corresponding dictionary and the HTML language attribute is updated. Translation keys are static; dynamic names, chat content, and model responses are passed through as-is.

## Fallback And Errors

An invalid saved locale is ignored and replaced by browser detection. If a key is absent from the active dictionary, the English value is used, and the key itself is used as the final fallback so the UI remains usable. Storage access failures are non-fatal because language preference is an enhancement, not a prerequisite for chat functionality.

## Verification

Unit coverage will exercise locale detection precedence, invalid values, and the translation fallback. A component-level check will verify that switching changes visible labels, persists the choice, and updates the root HTML `lang` attribute. The project build and lint checks will run after integration, followed by a browser check in both languages that covers initial browser detection, manual switching, and a reload.

## Out Of Scope

URL locale segments, server-side translation of model content, additional languages, Moana integration, and translation of backend or developer-facing text are deferred to a separate change.
