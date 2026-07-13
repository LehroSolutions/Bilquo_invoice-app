# Bilquo Operating Guide

This guide explains how to use Bilquo as an operator, not as a developer.

## What Bilquo Does

Bilquo generates:

- invoices
- quotes
- receipts

The app keeps the document preview in sync with the form so you can review the final output before exporting it.

## Core Workflow

1. Select the document type.
2. Fill in company and client details.
3. Set document metadata such as number, date, currency, and tax.
4. Add line items.
5. Choose a template.
6. Add a logo if needed.
7. Export the PDF.

## Field Behavior

- Invoice mode uses issue date and due date.
- Quote mode uses the same billing fields without receipt-specific payment details.
- Receipt mode asks for invoice reference, payment method, payment reference, and amount received.
- Amount received defaults to the invoice total when you switch to receipt mode.

## Templates

- Modern: clean, card-based preview with a light layout.
- Classic: framed, invoice-style layout with strong borders.
- Professional: split sidebar layout for a more corporate feel.

## Currency Support

Bilquo currently supports:

- USD
- EUR
- GBP
- ZAR
- CAD
- AUD
- INR
- JPY

## PDF Export

Use the export button in the preview panel to generate a PDF copy of the current document.

The export is browser-side only:

- the current preview is rendered to an image
- the image is embedded into a PDF
- the file is downloaded locally

## Data Handling

Bilquo keeps document data in memory while the app is open.

- Refreshing the app resets the working document.
- There is no backend database.
- Uploaded logos are held as in-memory data URLs.

## Running Modes

### Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

To inspect the desktop shell against the live Next dev server, run `npm run electron:dev` in a second terminal while `npm run dev` is still running.

### Static Preview

```bash
npm run build
npm start
```

Then open the local URL printed by the server.

### Desktop Shell

```bash
npm run build:desktop
```

This produces the desktop package for the current OS:

- Windows: `release/Bilquo-<version>-setup.exe`
- macOS: `release/Bilquo-<version>-<arch>.dmg` and `release/Bilquo-<version>-<arch>.zip`
- Linux: `release/Bilquo-<version>-<arch>.AppImage`

Use `npm run build:desktop:win`, `npm run build:desktop:mac`, or `npm run build:desktop:linux` if you want to call a platform directly.

## Practical Tips

- Keep line item descriptions short enough to fit the preview cleanly.
- Use the receipt mode when you need to track payment references and partial payments.
- Upload logos with transparent backgrounds when possible.
- Check the preview before exporting because the PDF uses the rendered layout.
