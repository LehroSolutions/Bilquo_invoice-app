'use client';

import React, { useState } from 'react';
import { Receipt } from 'lucide-react';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import { InvoiceData, defaultBilquoData } from './types';

export default function Home() {
  const [data, setData] = useState<InvoiceData>(defaultBilquoData);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center">
          <Receipt size={28} className="text-blue-600 mr-3" />
          <h1 className="text-xl font-bold text-gray-900">Bilquo</h1>
        </div>
      </header>
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoiceForm data={data} onChange={setData} />
          <InvoicePreview data={data} />
        </div>
      </main>
    </div>
  );
}
