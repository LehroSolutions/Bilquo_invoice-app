# Bilquo

Bilquo is a Next.js invoice, quote, and receipt generator that can run as a web app or be packaged into desktop installers for Windows, macOS, and Linux.

## What It Is Built On

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- `html-to-image` and `jsPDF` for PDF export
- Electron for the packaged desktop shell

## Run It Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build The Static App

```bash
npm run build
npm start
```

`npm start` serves the exported `out` folder with the same static file server used by the desktop shell.

## Build The Desktop Package

```bash
npm run build:desktop
```

That command packages the app for the current platform.

- Windows: `release/Bilquo-<version>-setup.exe`
- macOS: `release/Bilquo-<version>-<arch>.dmg` and `release/Bilquo-<version>-<arch>.zip`
- Linux: `release/Bilquo-<version>-<arch>.AppImage`

Use the explicit platform scripts if you are building from CI or want to target a specific OS:

```bash
npm run build:desktop:win
npm run build:desktop:mac
npm run build:desktop:linux
```

## Documentation

- [Operating guide](docs/README.md)
- [Architecture guide](docs/ARCHITECTURE.md)

## Repository Layout

- `src/app/` contains the Next.js app, UI, and invoice data model.
- `desktop/` contains the Electron entrypoint and the static file server.
- `docs/` contains the operator and architecture references.
