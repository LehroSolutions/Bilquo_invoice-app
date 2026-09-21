# AGENTS.md — Bilquo (Invoice & Quote Generator)

Operating contract for AI coding agents, with human-in-the-loop checkpoints.

## Identity

Bilquo is a Next.js 16 + React 19 + Tailwind 4 web app for generating
professional invoices, quotes, and receipts with PDF export.
Package manager: **bun** (see `packageManager` field). License: Apache-2.0.

## Command Reference

| Task | Command |
|---|---|
| Install | `bun install` |
| Dev server | `bun run dev` |
| Typecheck | `bun run typecheck` |
| Lint | `bun run lint` |
| Build (production) | `bun run build` |
| Docs (build/check) | `bun run docs:build` / `bun run docs:check` |
| **Full verify (run before declaring done)** | `bun run verify` |

## Verify Contract

`bun run verify` = lint + typecheck + production build. It must pass before
you report success. There is no unit test suite yet — do not claim "tests
pass"; say "verify passes".

## Codebase Map

- `src/` — Next.js app (App Router): pages, components, utilities
- `public/` — static assets
- `scripts/docs.mjs` — documentation pipeline used by `docs:build`/`docs:check`
- `docs/` — generated + hand-written documentation

## Conventions

- TypeScript strict; prefer typed props over `any`.
- Styling is Tailwind utility classes; avoid inline styles.
- Currency/number formatting must stay locale-aware (ZAR default).
- Keep the PDF export path deterministic — no layout-shifting async in export.

## Human-in-the-Loop Checkpoints

Ask the human before:
- Adding any dependency (keep the dep tree minimal — it is deliberately small).
- Changing invoice/receipt PDF output layout or wording.
- Touching `.env*` files or deployment config (`netlify.toml`).

## Danger Zones

- Never commit `.env.local` or any file containing real customer data.
- Never remove or weaken the ESLint config to make lint pass — fix the code.
- `node_modules/` and `.next/` are disposable; never hand-edit them.

---

## Vendor Agent Rules

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

