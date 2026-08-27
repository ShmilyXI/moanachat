# MoanaChat Standalone Design

## Goal

Create an independently runnable Next.js chatbot project named `moanachat` from the Vercel Chatbot template. The initial project must remain self-contained and must not depend on another application, shared database, shared authentication, or shared API gateway.

## Architecture

The project remains a standalone Next.js App Router application with the template's existing AI SDK, Auth.js, Drizzle/Postgres, optional Redis, and optional Vercel Blob integrations. Its current model provider and authentication paths remain unchanged until a later integration phase is explicitly designed.

The repository lives at `/Users/xavier.xiao/workshop/moanachat` with its own Git history, package manifest, lockfile, environment file, and development server. No files in another repository are part of this bootstrap.

## Initial Scope

- Clone the upstream `vercel/chatbot` repository.
- Rename the local package to `moanachat` without changing runtime behavior.
- Install the lockfile-defined dependencies with the repository's declared package manager.
- Provide a local environment template without committing credentials.
- Verify that the Next.js development server can start and serve the application shell.

## Out Of Scope

Model gateway changes, single sign-on, user synchronization, billing, quota mapping, shared chat history, reverse proxy rules, and changes to any other project are intentionally deferred.

## Acceptance Criteria

The directory is an independent Git repository with the upstream template as its starting point, `package.json` identifies the project as `moanachat`, dependencies are installed from `pnpm-lock.yaml`, `.env.local` is ignored by Git, and the development server responds successfully on a local port.
