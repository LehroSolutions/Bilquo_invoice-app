'use client';

import React, { useState, useSyncExternalStore } from 'react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { ReceiptIcon } from './components/icons';
import { InvoiceData, calculateSubtotal, calculateTax, calculateTotal, defaultBilquoData } from './types';

const subscribeToToday = () => () => {};

const getTodayIsoDate = () => new Date().toISOString().split('T')[0];

export default function Home() {
  const [data, setData] = useState<InvoiceData>(defaultBilquoData);
  const todayIsoDate = useSyncExternalStore(subscribeToToday, getTodayIsoDate, () => '');
  const resolvedData = data.date ? data : { ...data, date: todayIsoDate };

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)]">
      <header className="sticky top-0 z-10 border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center px-6 py-4">
          <ReceiptIcon size={28} className="mr-3 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bilquo</h1>
            <p className="text-sm text-gray-500">Invoice, quote, and receipt generator</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <InvoiceForm data={resolvedData} onChange={handleChange} />
          <InvoicePreview data={resolvedData} />
        </div>
      </main>
    </div>
  );
}
