import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bilquo | Invoice, Quote & Receipt Generator',
  description:
    'Professional invoice, quote, and receipt generator by Lehro Solutions - create, customize, and export with ease',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
