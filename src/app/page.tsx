'use client';

import React, { useEffect, useRef, useState } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { ReceiptIcon } from './components/icons';
import {
  InvoiceData,
  computeTotals,
  defaultBilquoData,
  todayCalendarDate,
} from './types';

import { isDraftExpired, sanitizeImported } from './draft';

const DRAFT_KEY = 'bilquo.draft.v1';
const DRAFT_SAVED_AT_KEY = 'bilquo.draft.savedAt.v1';
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export default function Home() {
  const [data, setData] = useState<InvoiceData>(defaultBilquoData);
  const [savedAt, setSavedAt] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [saveDraft, setSaveDraft] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Defer hydration off the synchronous effect body (React 19
    // set-state-in-effect rule): localStorage read stays in the effect,
    // but the state update happens in a callback.
    const id = window.setTimeout(() => {
      if (cancelled) return;
      setData({ ...defaultBilquoData, date: todayCalendarDate() });
      try {
        const savedAt = localStorage.getItem(DRAFT_SAVED_AT_KEY);
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw && isDraftExpired(savedAt)) {
          localStorage.removeItem(DRAFT_KEY);
          localStorage.removeItem(DRAFT_SAVED_AT_KEY);
          setNotice('The saved draft expired or had an invalid save date and has been deleted from this browser.');
          return;
        }
        if (raw) {
          setData(sanitizeImported(JSON.parse(raw)));
          setSaveDraft(true);
        }
      } catch {
        try {
          localStorage.removeItem(DRAFT_KEY);
          localStorage.removeItem(DRAFT_SAVED_AT_KEY);
        } catch {
          // Browsers may deny all storage operations. Editing still works.
        }
        setNotice('The saved draft could not be opened. Import a JSON backup or start a new document.');
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !saveDraft) return;
    const id = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        localStorage.setItem(DRAFT_SAVED_AT_KEY, String(Date.now()));
        setSaveError('');
        setSavedAt(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        );
      } catch {
        // Quota exceeded (large logo) or storage unavailable. The document is
        // still on screen, so say so instead of implying it was persisted.
        setSavedAt('');
        setSaveError(
          'This browser could not store the draft, so it will be lost on reload. Export JSON to keep a copy.'
        );
        console.warn('Draft could not be saved to localStorage');
      }
    }, 400);
    return () => clearTimeout(id);
  }, [data, hydrated, saveDraft]);

  const handleChange = (next: InvoiceData) => {
    setSaveDraft(true);
    if (next.documentType === 'receipt' && !next.amountReceivedIsSet) {
      const t = computeTotals(next.lineItems, next.discountType, next.discountValue, next.taxRate);
      setData({ ...next, amountReceived: t.total });
      return;
    }

    setData(next);
  };

  const discardStoredDraft = (message: string) => {
    let deletionFailed = false;
    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(DRAFT_SAVED_AT_KEY);
    } catch {
      deletionFailed = true;
    }
    setSaveDraft(false);
    setData({ ...defaultBilquoData, date: todayCalendarDate() });
    setSavedAt('');
    setSaveError('');
    setNotice(deletionFailed
      ? 'This browser could not delete its saved draft. Re-enable site storage and try again, or clear this site\'s data in browser settings.'
      : message);
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
      setSaveDraft(true);
    } catch {
      alert('Could not import that JSON draft. Check the file and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#eef1f4] text-slate-950">
      <fieldset disabled={!hydrated} aria-busy={!hydrated} aria-label="Document editor" className="contents">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <ReceiptIcon size={28} className="mr-1 text-blue-600" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-slate-950">Bilquo</h1>
            <p className="text-xs text-slate-500">Commercial document studio</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <div className="max-w-[22rem]">
              <p
                aria-live="polite"
                className={saveError ? 'font-semibold text-red-700' : undefined}
              >
                {saveError
                  ? 'Draft not saved'
                  : savedAt
                    ? `Draft saved ${savedAt}`
                    : 'Local-first draft'}
              </p>
              {saveError ? (
                <p role="alert" className="mt-0.5 leading-tight text-red-700">
                  {saveError}
                </p>
              ) : (
                notice && (
                  <p role="status" className="mt-0.5 leading-tight text-slate-600">
                    {notice}
                  </p>
                )
              )}
            </div>
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
              onClick={() => discardStoredDraft('New document started. The stored draft was deleted.')}
            >
              New document
            </button>
            <button
              type="button"
              className="min-h-11 rounded-lg border border-red-300 bg-white px-3 font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              onClick={() => {
                if (!window.confirm('Delete the draft stored in this browser? This cannot be undone.')) {
                  return;
                }
                discardStoredDraft('Stored draft deleted from this browser.');
              }}
            >
              Delete stored draft
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
      </fieldset>
    </div>
  );
}
