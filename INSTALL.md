# Install and run

Use Node 24 and Bun 1.3.14 from this Git root:

```powershell
bun install --frozen-lockfile
bun run verify
bun run dev
```

For the production server run `bun run build`, then `bun run start`.
No environment variables or credentials are required. See [PRODUCTION.md](PRODUCTION.md)
for hosting, browser draft retention, JSON backup/restore and PDF verification.
