import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";

/**
 * 'unsafe-inline' is required in production: the App Router inlines the RSC
 * flight payload into a <script> tag, and Next.js only attaches nonces to
 * dynamically rendered pages — forcing dynamic rendering for a fully
 * client-side app would cost more than it buys. 'unsafe-eval' is scoped to
 * development because React evaluates code to reconstruct server-side error
 * stacks in the browser; neither React nor Next uses eval in production.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  // Tailwind emits a stylesheet, but html-to-image also clones the invoice
  // into a <style> element and the preview uses inline style attributes.
  "style-src 'self' 'unsafe-inline'",
  // data: for the uploaded logo, blob: for the canvas the PDF export renders.
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  // ws:/wss: is the dev server's hot-reload socket, never needed in production.
  `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // No-op for a static export; effective wherever Next serves responses.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
