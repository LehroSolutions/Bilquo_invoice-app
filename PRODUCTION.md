# Production operation

Bilquo runs entirely in the browser for editing, calculation, import and export.
No customer invoice data is sent to an application backend. Browser storage and
downloaded JSON/PDF files contain customer data in plaintext.

## Setup and release

Use Node 24 (minimum 22.14) and Bun 1.3.14:

```powershell
bun install --frozen-lockfile
bun run verify
bun run docs:check
bun run start
```

Verify runs ESLint, TypeScript, the monetary/import regression tests and the
production Next.js build. The nested `marketingvideo/` Git repository is separate
and excluded from the app's lint/type checks. The app has no required environment
variables or credentials. For Node hosting, deploy `.next`, `public`, package
metadata and production dependencies, and run `bun run start` behind TLS.

Netlify configuration publishes `.next` with Next.js framework support; it does
not publish a nonexistent static `out` folder. Verify the framework integration,
security response headers and PDF downloads on the intended host before release.
No host account, publish or deployment is performed by local verification.

## User journey and data lifecycle

Create an invoice, quote or receipt, enter company/client details and line items,
apply discount/tax, and compare preview totals with the PDF. Percentage operations
round the existing minor-unit amounts once. Quantity/rate are capped at 100,000,
documents at 500 items, discounts at 100%, and tax at 100%, keeping totals within
safe integer arithmetic. Explicit zero payment received remains distinct from an
unset payment amount.

JSON imports validate fields, dates, numeric bounds, unique item identifiers and
raster logo data. Logo uploads accept PNG/JPEG/WebP/GIF up to 2 MiB; draft imports
are limited to 5 MiB. PDF export captures fixed-width pages and splits long
documents into multiple A4 pages instead of shrinking an entire document to one
page. A failed export retains the draft and restores controls.

Drafts are restored only after browser storage hydration, expire after 30 days,
and show an error if saving is unavailable. Deleting a stored draft cancels
autosave until a new edit/import. Export JSON for a portable backup, and test a
round trip before clearing browser data. Storage denial does not prevent editing.
Use a private browser profile on shared machines and protect downloaded files.

Before publishing, exercise import/export, invoice/receipt totals, a long PDF,
invalid JSON, storage denial/quota failure, deletion and reload at desktop and
mobile widths. For rollback, retain the previous application build; customer
drafts remain in browser storage and can be restored from JSON backups.
