# bilquo

> Professional Invoice & Quote Generator by Lehro Solutions

Bilquo is a modern, open-source web application designed to streamline the creation of professional invoices, quotes, and payment receipts. Built with Next.js and TypeScript, Bilquo offers a clean, intuitive interface for businesses and freelancers to generate, customize, and export billing documents with ease.

## 🚀 Features

### Core Functionality
- **Three Document Types**: Create invoices, quotes, and receipts from a single interface
- **Real-time Preview**: See your document update instantly as you type
- **PDF Export**: Generate high-quality PDF documents with a single click
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

### Customization Options
- **Multiple Templates**: Choose from Classic, Modern, and Professional design templates
- **Company Branding**: Upload your company logo to appear on all documents
- **Currency Support**: Select from 8 major currencies including USD, EUR, GBP, ZAR, CAD, AUD, INR, and JPY
- **Flexible Line Items**: Add unlimited line items with descriptions, quantities, and rates
- **Tax Configuration**: Set custom tax rates for accurate billing
- **Receipt Capture**: Record received amounts, payment methods, references, and invoice links for clean payment records

### Professional Features
- **Automatic Calculations**: Subtotal, tax, and total amounts calculated in real-time
- **Document Numbering**: Custom document numbering system (INV-001, QUOTE-001, RCPT-001, etc.)
- **Date Management**: Set issue dates, due dates, and payment receipt dates for tracking
- **Notes & Terms**: Add custom notes and payment terms to your documents

## 🛠 Technology Stack

- **Frontend**: Next.js 16 with React 18
- **Language**: TypeScript for type safety and better development experience
- **Styling**: Tailwind CSS for modern, responsive design
- **Icons**: Lucide React for consistent, beautiful icons
- **PDF Generation**: html-to-image + jsPDF for reliable PDF export
- **Development**: Hot reload with Turbopack for fast development

## 📦 Installation

### Prerequisites
- Bun 1.1+ (or Node.js 20+)
- Bun (recommended) or Node.js 20+

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/lehro-solutions/bilquo.git
   cd bilquo
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Run the development server**
   ```bash
   bun run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
bun run build
bun run start
```

## 🎯 Usage Guide

### Creating Your First Invoice

1. **Enter Company Information**
   - Fill in your company details (name, address, email, phone)
   - Upload your company logo (optional but recommended)

2. **Add Client Details**
   - Enter client information for the invoice/quote

3. **Configure Document Settings**
   - Choose between Invoice, Quote, or Receipt
   - Set document number, date, and due date or payment receipt date
   - Select your preferred currency

4. **Add Line Items**
   - Click "Add Item" for each product or service
   - Enter descriptions, quantities, and rates
   - Set the appropriate tax rate

5. **Customize Appearance**
   - Choose from available templates
   - For receipts, record the original invoice number, payment method, payment reference, and amount received
   - Add notes and payment terms

6. **Export Your Document**
   - Review the real-time preview
   - Click "Export PDF" to download your document

## 🏗 Project Structure

```
bilquo/
├── src/
│   └── app/
│       ├── components/
│       │   ├── InvoiceForm.tsx      # Main form component
│       │   ├── InvoicePreview.tsx   # Preview and PDF export
│       │   ├── LogoUploader.tsx     # Logo upload functionality
│       │   └── TemplateSelector.tsx # Template selection
│       ├── types.ts                 # TypeScript type definitions
│       ├── page.tsx                 # Main application page
│       ├── layout.tsx               # Root layout component
│       └── globals.css              # Global styles
├── public/                          # Static assets
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

## 🤝 Contributing

Lehro Solutions welcomes contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `bun test` (when available)
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing code formatting
- Write meaningful commit messages
- Update documentation as needed

## 📄 License

Bilquo is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for more information.

## 🆘 Support

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/lehro-solutions/bilquo/issues)
- **Discussions**: Join community discussions and share ideas
- **Documentation**: Check this README and inline code comments

## 🌟 About Lehro Solutions

Lehro Solutions is committed to creating open-source tools that empower businesses and developers. Bilquo represents our dedication to providing high-quality, accessible software for everyday business needs.

### Our Mission
- Democratize professional business tools
- Foster community-driven development
- Maintain high standards of code quality
- Provide excellent documentation and support

---

**Made with ❤️ by Lehro Solutions**

*If you find Bilquo useful, please consider starring the repository and sharing it with your network!*

## License

Copyright © 2026 Lehro Solutions. Licensed under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE).

## Documentation

Canonical docs hub: [`docs/.docs/index.md`](docs/.docs/index.md)

## Package manager (Bun)

This package is **Bun-first**.

```bash
bun install
bun run dev    # if defined
bun run build  # if defined
bun test       # or: bun run test
```

- Lockfile target: `bun.lock` (generate locally with `bun install`)
- `packageManager` field pins Bun via Corepack-compatible tooling ecosystems
- Node remains a compatibility runtime floor; prefer Bun for install/run/test

See docs for the package-manager decision: search for `ADR-0003` in `docs/.docs/` when present.

## How to use

See [docs/how-to-use.md](docs/how-to-use.md) for the full operator guide.

## Security

See [SECURITY.md](SECURITY.md).

<!-- docs-system:start -->
## Documentation

The current public documentation is available in [`docs/index.html`](docs/index.html). Start with [`docs/current/start-here.md`](docs/current/start-here.md) for scope, current changes, workflows, architecture, security, quality, and contribution guidance.

### Latest public changes

- Local draft recovery
- JSON import and export
- Invoice, quote, and receipt templates with PDF export

Documentation is maintained as canonical Markdown plus generated HTML and JSON counterparts. Run `pnpm docs:build` after changing `docs/current/*.md` and `pnpm docs:check` before a public release.
<!-- docs-system:end -->

## Production operation

See [PRODUCTION.md](PRODUCTION.md) for verified release checks, configuration, data handling, and recovery.
