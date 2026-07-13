'use client';

import React, { useEffect, useRef, useState } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { ReceiptIcon } from './components/icons';
import {
  InvoiceData,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  defaultBilquoData,
} from './types';

const DRAFT_KEY = 'bilquo.draft.v1';

function sanitizeImported(raw: unknown): InvoiceData {
  if (!raw || typeof raw !== 'object') return defaultBilquoData;
  const candidate = raw as Partial<InvoiceData>;
  return {
    ...defaultBilquoData,
    ...candidate,
    company: { ...defaultBilquoData.company, ...(candidate.company || {}) },
    client: { ...defaultBilquoData.client, ...(candidate.client || {}) },
    lineItems: Array.isArray(candidate.lineItems) && candidate.lineItems.length
      ? candidate.lineItems
      : defaultBilquoData.lineItems,
  };
}

export default function Home() {
  const [data, setData] = useState<InvoiceData>(defaultBilquoData);
  const [savedAt, setSavedAt] = useState('');
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setData(sanitizeImported(JSON.parse(raw)));
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      setSavedAt(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    }, 400);
    return () => clearTimeout(id);
  }, [data]);

  const handleChange = (next: InvoiceData) => {
    const subtotal = calculateSubtotal(next.lineItems);
    const tax = calculateTax(subtotal, next.taxRate);
    const total = calculateTotal(subtotal, tax);

    if (next.documentType === 'receipt' && next.amountReceived <= 0) {
      setData({ ...next, amountReceived: total });
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
