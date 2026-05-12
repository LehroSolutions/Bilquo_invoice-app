'use client';

import React, { useRef } from 'react';
import { Download, Eye } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { InvoiceData, calculateSubtotal, calculateTax, calculateTotal, getCurrencySymbol } from '../types';

interface InvoicePreviewProps {
  data: InvoiceData;
}

export default function InvoicePreview({ data }: InvoicePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (typeof window === 'undefined' || !printRef.current) return;

    // Store original overflow style before try block
    const originalOverflow = printRef.current.style.overflow;

    try {
      const { toPng } = await import('html-to-image');

      // Temporarily hide scrollbar for clean PDF export
      printRef.current.style.overflow = 'hidden';

      const pngDataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 2,
      });

      // Restore original overflow style
      printRef.current.style.overflow = originalOverflow;

      const img = new Image();
      img.src = pngDataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load rendered image'));
      });

      const pxWidth = img.naturalWidth;
      const pxHeight = img.naturalHeight;
      const pxToMm = 0.264583;
      const imgWidthMm = pxWidth * pxToMm;
      const imgHeightMm = pxHeight * pxToMm;

      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const marginMm = 5;
      const availableWidth = pageWidthMm - marginMm * 2;
      const availableHeight = pageHeightMm - marginMm * 2;

      const scale = Math.min(availableWidth / imgWidthMm, availableHeight / imgHeightMm, 1);
      const finalWidth = imgWidthMm * scale;
      const finalHeight = imgHeightMm * scale;
      const x = marginMm + (availableWidth - finalWidth) / 2;
      const y = marginMm;

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      pdf.addImage(pngDataUrl, 'PNG', x, y, finalWidth, finalHeight);
      pdf.save(`${data.documentType}-${data.documentNumber}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF export failed. Please try again.');
    } finally {
      // Ensure scrollbar is restored even if export fails
      if (printRef.current && originalOverflow) {
        printRef.current.style.overflow = originalOverflow;
      }
    }
  };

  const subtotal = calculateSubtotal(data.lineItems);
  const tax = calculateTax(subtotal, data.taxRate);
  const total = calculateTotal(subtotal, tax);
  const sym = getCurrencySymbol(data.currency);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderModern = () => (
    <div className="bg-white p-8 min-h-[842px]">
      <div className="flex justify-between items-start mb-8">
        <div>
          {data.logo && <img src={data.logo} alt="Logo" className="h-16 w-auto object-contain mb-3" />}
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
            {data.documentType === 'invoice' ? 'INVOICE' : 'QUOTE'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">#{data.documentNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600"><span className="text-gray-400">Date:</span> {formatDate(data.date)}</p>
          {data.dueDate && (
            <p className="text-sm text-gray-600 mt-1"><span className="text-gray-400">Due:</span> {formatDate(data.dueDate)}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">From</p>
          <p className="font-bold text-gray-800">{data.company.name}</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{data.company.address}</p>
          <p className="text-sm text-gray-600">{data.company.email}</p>
          <p className="text-sm text-gray-600">{data.company.phone}</p>
          {data.company.additionalDetails && (
            <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{data.company.additionalDetails}</p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">To</p>
          <p className="font-bold text-gray-800">{data.client.name}</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{data.client.address}</p>
          <p className="text-sm text-gray-600">{data.client.email}</p>
        </div>
      </div>

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-900">
            <th className="text-left text-xs font-semibold uppercase text-gray-500 tracking-wider pb-2">Description</th>
            <th className="text-right text-xs font-semibold uppercase text-gray-500 tracking-wider pb-2">Qty</th>
            <th className="text-right text-xs font-semibold uppercase text-gray-500 tracking-wider pb-2">Rate</th>
            <th className="text-right text-xs font-semibold uppercase text-gray-500 tracking-wider pb-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-3 text-sm text-gray-800">{item.description}</td>
              <td className="py-3 text-sm text-gray-600 text-right">{item.quantity}</td>
              <td className="py-3 text-sm text-gray-600 text-right">{sym}{item.rate.toFixed(2)}</td>
              <td className="py-3 text-sm text-gray-800 font-medium text-right">{sym}{(item.quantity * item.rate).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-64">
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-800">{sym}{subtotal.toFixed(2)}</span>
          </div>
          {data.taxRate > 0 && (
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Tax ({data.taxRate}%)</span>
              <span className="font-medium text-gray-800">{sym}{tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-gray-900 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{sym}{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {(data.notes || data.terms) && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          {data.notes && <p className="text-sm text-gray-600"><span className="font-semibold text-gray-700">Note:</span> {data.notes}</p>}
          {data.terms && <p className="text-sm text-gray-600"><span className="font-semibold text-gray-700">Terms:</span> {data.terms}</p>}
        </div>
      )}
    </div>
  );

  const renderClassic = () => (
    <div className="bg-white p-8 min-h-[842px] border border-gray-300">
      <div className="border-2 border-gray-800 p-5 mb-4">
        <div className="flex justify-between items-start">
          <div>
            {data.logo && <img src={data.logo} alt="Logo" className="h-16 w-auto object-contain mb-2" />}
            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">
              {data.documentType === 'invoice' ? 'Invoice' : 'Quote'}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-800">{data.documentNumber}</p>
            <p className="text-sm text-gray-600 mt-1">Date: {formatDate(data.date)}</p>
            {data.dueDate && <p className="text-sm text-gray-600">Due: {formatDate(data.dueDate)}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border border-gray-300 p-3">
          <p className="text-xs font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 mb-2">From</p>
          <p className="font-bold text-gray-800">{data.company.name}</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{data.company.address}</p>
          <p className="text-sm text-gray-600">{data.company.email}</p>
          <p className="text-sm text-gray-600">{data.company.phone}</p>
          {data.company.additionalDetails && (
            <p className="text-sm text-gray-600 whitespace-pre-line mt-1">{data.company.additionalDetails}</p>
          )}
        </div>
        <div className="border border-gray-300 p-3">
          <p className="text-xs font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 mb-2">Bill To</p>
          <p className="font-bold text-gray-800">{data.client.name}</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{data.client.address}</p>
          <p className="text-sm text-gray-600">{data.client.email}</p>
        </div>
      </div>

      <table className="w-full mb-6 border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left text-xs font-bold uppercase text-gray-700 border border-gray-300 p-2">Description</th>
            <th className="text-right text-xs font-bold uppercase text-gray-700 border border-gray-300 p-2">Qty</th>
            <th className="text-right text-xs font-bold uppercase text-gray-700 border border-gray-300 p-2">Unit Price</th>
            <th className="text-right text-xs font-bold uppercase text-gray-700 border border-gray-300 p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item) => (
            <tr key={item.id}>
              <td className="text-sm text-gray-800 border border-gray-300 p-2">{item.description}</td>
              <td className="text-sm text-gray-600 text-right border border-gray-300 p-2">{item.quantity}</td>
              <td className="text-sm text-gray-600 text-right border border-gray-300 p-2">{sym}{item.rate.toFixed(2)}</td>
              <td className="text-sm text-gray-800 font-medium text-right border border-gray-300 p-2">{sym}{(item.quantity * item.rate).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-6">
        <div className="w-56 border-2 border-gray-800 p-3">
          <div className="flex justify-between py-1 text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium text-gray-800">{sym}{subtotal.toFixed(2)}</span>
          </div>
          {data.taxRate > 0 && (
            <div className="flex justify-between py-1 text-sm">
              <span className="text-gray-600">Tax ({data.taxRate}%)</span>
              <span className="font-medium text-gray-800">{sym}{tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-gray-800 text-lg font-bold text-gray-900 mt-1">
            <span>Total</span>
            <span>{sym}{total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {(data.notes || data.terms) && (
        <div className="border border-gray-300 p-3 space-y-1">
          {data.notes && <p className="text-sm text-gray-700"><strong>Note:</strong> {data.notes}</p>}
          {data.terms && <p className="text-sm text-gray-700"><strong>Terms:</strong> {data.terms}</p>}
        </div>
      )}
    </div>
  );

  const renderProfessional = () => (
    <div className="bg-white min-h-[842px] flex">
      <div className="w-1/3 bg-slate-800 text-white p-8 flex flex-col">
        {data.logo && <img src={data.logo} alt="Logo" className="h-16 w-auto object-contain mb-4" />}
        <h2 className="text-2xl font-bold uppercase tracking-wider mb-6">
          {data.documentType === 'invoice' ? 'Invoice' : 'Quote'}
        </h2>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">From</p>
          <p className="font-bold">{data.company.name}</p>
          <p className="text-sm text-slate-300 whitespace-pre-line mt-1">{data.company.address}</p>
          <p className="text-sm text-slate-300 mt-1">{data.company.email}</p>
          <p className="text-sm text-slate-300">{data.company.phone}</p>
          {data.company.additionalDetails && (
            <p className="text-sm text-slate-300 whitespace-pre-line mt-1">{data.company.additionalDetails}</p>
          )}
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider mb-2">To</p>
          <p className="font-bold">{data.client.name}</p>
          <p className="text-sm text-slate-300 whitespace-pre-line mt-1">{data.client.address}</p>
          <p className="text-sm text-slate-300 mt-1">{data.client.email}</p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Date</span>
            <span>{formatDate(data.date)}</span>
          </div>
          {data.dueDate && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Due</span>
              <span>{formatDate(data.dueDate)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Ref</span>
            <span>{data.documentNumber}</span>
          </div>
        </div>
      </div>

      <div className="w-2/3 p-8">
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-slate-800">
              <th className="text-left text-xs font-bold uppercase text-slate-500 tracking-wider pb-3">Item</th>
              <th className="text-right text-xs font-bold uppercase text-slate-500 tracking-wider pb-3">Qty</th>
              <th className="text-right text-xs font-bold uppercase text-slate-500 tracking-wider pb-3">Price</th>
              <th className="text-right text-xs font-bold uppercase text-slate-500 tracking-wider pb-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-4 text-sm text-gray-800">{item.description}</td>
                <td className="py-4 text-sm text-gray-600 text-right">{item.quantity}</td>
                <td className="py-4 text-sm text-gray-600 text-right">{sym}{item.rate.toFixed(2)}</td>
                <td className="py-4 text-sm text-gray-800 font-medium text-right">{sym}{(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-56 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-800">{sym}{subtotal.toFixed(2)}</span>
            </div>
            {data.taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax ({data.taxRate}%)</span>
                <span className="font-medium text-gray-800">{sym}{tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-slate-800 text-xl font-bold text-slate-800">
              <span>Total</span>
              <span>{sym}{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {(data.notes || data.terms) && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-1">
            {data.notes && <p className="text-sm text-gray-600"><span className="font-semibold text-slate-700">Note:</span> {data.notes}</p>}
            {data.terms && <p className="text-sm text-gray-600"><span className="font-semibold text-slate-700">Terms:</span> {data.terms}</p>}
          </div>
        )}
      </div>
    </div>
  );

  const getTemplate = () => {
    switch (data.template) {
      case 'classic': return renderClassic();
      case 'professional': return renderProfessional();
      default: return renderModern();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <Eye size={20} className="mr-2" />
          Preview
        </h2>
        <button
          onClick={handleExportPDF}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium cursor-pointer"
        >
          <Download size={16} className="mr-2" />
          Export PDF
        </button>
      </div>
      <div
        ref={printRef}
        className="bg-gray-100 rounded-xl overflow-hidden shadow-inner"
        style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}
      >
        {getTemplate()}
      </div>
    </div>
  );
}
