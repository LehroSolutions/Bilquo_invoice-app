'use client';

import React, { useEffect, useRef, useState } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { ReceiptIcon } from './components/icons';
import {
  CurrencyCode,
  DiscountType,
  DocumentType,
  InvoiceData,
  LineItem,
  TemplateType,
  computeTotals,
  currencies,
  defaultBilquoData,
} from './types';

const DRAFT_KEY = 'bilquo.draft.v1';
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNonNegNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Hardened import: every field is validated before it can touch app state. */
function sanitizeImported(raw: unknown): InvoiceData {
  if (!raw || typeof raw !== 'object') return defaultBilquoData;
  const candidate = raw as Partial<InvoiceData> & Record<string, unknown>;
  const lineItems: LineItem[] = Array.isArray(candidate.lineItems)
    ? candidate.lineItems.slice(0, 500).map((item, i) => {
        const li = (item ?? {}) as unknown as Record<string, unknown>;
        return {
          id: asString(li.id, `imported-${i}`),
          description: asString(li.description).slice(0, 2000),
          quantity: asNonNegNumber(li.quantity, 0),
          rate: asNonNegNumber(li.rate, 0),
        };
      })
    : defaultBilquoData.lineItems;
  const docType: DocumentType =
    candidate.documentType === 'quote' || candidate.documentType === 'receipt'
      ? candidate.documentType
      : 'invoice';
  const template: TemplateType =
    candidate.template === 'classic' || candidate.template === 'professional'
      ? candidate.template
      : 'modern';
  const discountType: DiscountType =
    candidate.discountType === 'fixed' ? 'fixed' : 'percent';
  const currency: CurrencyCode = currencies.some((c) => c.code === candidate.currency)
    ? (candidate.currency as CurrencyCode)
    : 'USD';
  return {
    documentType: docType,
    documentNumber: asString(candidate.documentNumber, defaultBilquoData.documentNumber).slice(0, 100),
    date: asString(candidate.date).slice(0, 10),
    dueDate: asString(candidate.dueDate).slice(0, 10),
    invoiceReference: asString(candidate.invoiceReference).slice(0, 200),
    amountReceived: asNonNegNumber(candidate.amountReceived, 0),
    paymentMethod: asString(candidate.paymentMethod, 'Bank transfer').slice(0, 100),
    paymentReference: asString(candidate.paymentReference).slice(0, 200),
    receivedBy: asString(candidate.receivedBy).slice(0, 200),
    company: {
      name: asString(candidate.company?.name).slice(0, 300),
      address: asString(candidate.company?.address).slice(0, 1000),
      email: asString(candidate.company?.email).slice(0, 320),
      phone: asString(candidate.company?.phone).slice(0, 60),
      additionalDetails: asString(candidate.company?.additionalDetails).slice(0, 1000),
    },
    client: {
      name: asString(candidate.client?.name).slice(0, 300),
      address: asString(candidate.client?.address).slice(0, 1000),
      email: asString(candidate.client?.email).slice(0, 320),
    },
    lineItems,
    discountType,
    discountValue: asNonNegNumber(candidate.discountValue, 0),
    taxRate: Math.min(asNonNegNumber(candidate.taxRate, 0), 10_000),
    notes: asString(candidate.notes, defaultBilquoData.notes).slice(0, 5000),
    terms: asString(candidate.terms, defaultBilquoData.terms).slice(0, 5000),
    logo:
      typeof candidate.logo === 'string' &&
      candidate.logo.startsWith('data:image/') &&
      candidate.logo.length <= 2_000_000
        ? candidate.logo
        : null,
    template,
    currency,
  };
}

export default function Home() {
  const [data, setData] = useState<InvoiceData>(defaultBilquoData);
  const [savedAt, setSavedAt] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Defer hydration off the synchronous effect body (React 19
    // set-state-in-effect rule): localStorage read stays in the effect,
    // but the state update happens in a callback.
    const id = window.setTimeout(() => {
      if (cancelled) return;
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) setData(sanitizeImported(JSON.parse(raw)));
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        setSavedAt(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      } catch {
        // Quota exceeded (large logo) or storage unavailable — surface it
        setSavedAt('');
        console.warn('Draft could not be saved to localStorage');
      }
    }, 400);
    return () => clearTimeout(id);
  }, [data]);

  const handleChange = (next: InvoiceData) => {
    if (next.documentType === 'receipt' && next.amountReceived <= 0) {
      const t = computeTotals(next.lineItems, next.discountType, next.discountValue, next.taxRate);
      setData({ ...next, amountReceived: t.total });
      return;
    }

    setData(next);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `bilquo-${data.documentType || 'document'}-${Date.now()}.json`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    if (file.size > MAX_IMPORT_BYTES) {
      alert('That file is too large. Draft JSON must be under 5 MB.');
      return;
    }
    try {
      const parsed = JSON.parse(await file.text());
      setData(sanitizeImported(parsed));
    } catch {
      alert('Could not import that JSON draft. Check the file and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#eef1f4] text-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <ReceiptIcon size={28} className="mr-1 text-blue-600" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-slate-950">Bilquo</h1>
            <p className="text-xs text-slate-500">Commercial document studio</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span aria-live="polite">
              {savedAt ? `Draft saved ${savedAt}` : 'Local-first draft'}
            </span>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importJson(file);
                e.currentTarget.value = '';
              }}
            />
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-700 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              onClick={() => importRef.current?.click()}
            >
              Import JSON
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-700 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              onClick={exportJson}
            >
              Export JSON
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-700 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              onClick={() => {
                setData(defaultBilquoData);
                localStorage.removeItem(DRAFT_KEY);
              }}
            >
              New document
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(560px,1.08fr)]">
          <InvoiceForm data={data} onChange={handleChange} />
          <InvoicePreview data={data} />
        </div>
      </main>
    </div>
  );
}
