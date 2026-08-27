# MoanaChat Standalone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a self-contained, locally runnable copy of the Vercel Chatbot template named `moanachat`.

**Architecture:** Keep the upstream Next.js App Router application intact and isolate it in its own repository. Only local project metadata and environment setup are changed during bootstrap; all external integrations remain the template defaults.

**Tech Stack:** Next.js 16, React 19, AI SDK 7, Auth.js 5 beta, Drizzle ORM, PostgreSQL, optional Redis and Vercel Blob, pnpm.

---

### Task 1: Bootstrap Repository Metadata

**Files:**
- Modify: `package.json`
- Create: `docs/superpowers/specs/2026-08-27-moanachat-standalone-design.md`

- [x] Set the package name to `moanachat`.
- [x] Record the standalone architecture and acceptance criteria in the design document.
- [x] Confirm the working tree contains no changes outside this project.

### Task 2: Install and Configure Local Runtime

**Files:**
- Create: `.env.local` with local-only values and without committing credentials

- [x] Install dependencies with the lockfile-defined pnpm command.
- [x] Set a local `AUTH_SECRET` and leave provider credentials unconfigured until the runtime integration phase.
- [x] Confirm `.env.local` is ignored by Git.

### Task 3: Verify the Application Shell

**Files:**
- No source changes expected.

- [x] Start the Next.js development server on an available local port.
- [x] Request the health endpoint and root page and confirm successful HTTP responses.
- [x] Report the exact local URL and the database integration required for Guest login.
