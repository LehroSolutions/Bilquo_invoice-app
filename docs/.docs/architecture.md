# Bilquo Architecture

  ## Intent
  Local-first commercial document studio for invoices, quotes, and receipts.

  ## Runtime shape
  - Domain: **Billing / document generation**
  - Primary stack: Next.js, React, TypeScript, Tailwind CSS, jsPDF
  - Key entrypoints:
- `src/app/page.tsx`
- `src/app/components/InvoiceForm.tsx`
- `src/app/components/InvoicePreview.tsx`

  ## Boundaries
  - Validate inputs at trust boundaries.
  - Keep authorization explicit near data access.
  - Prefer recoverable errors over silent failure.
  - Keep side effects isolated and observable.

  ## Related
  - [Design System](./design-system.md)
  - [Security](./security.md)
  - [ADR-0001](./adr-0001-docs-system.md)
  - [Roadmap](./roadmap.md)
