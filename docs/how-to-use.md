# How to Use Bilquo

Bilquo is a local-first invoice, quote, and receipt studio.

## 1) Install & start

```bash
bun install
bun run dev
```

Open http://localhost:3000

Production:

```bash
bun run build
bun run start
```

## 2) Create a document
1. Choose **Invoice**, **Quote**, or **Receipt**
2. Enter company and client details
3. Add line items, tax, and notes
4. Review the live preview
5. Export PDF

## 3) Drafts & portability
- Drafts autosave in the browser
- Use **Import JSON** / **Export JSON** to move work between machines
- Use **New document** to reset

## 4) Tips
- Upload a logo for branding
- Switch templates (Classic / Modern / Professional)
- Receipt mode can auto-fill amount received

## Related
- [INSTALL.md](../../INSTALL.md)
- [Architecture](./architecture.md)
- [Security](./security.md)
