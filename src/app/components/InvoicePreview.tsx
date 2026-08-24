'use client';

import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  calculateBalanceDue,
  calculateOverpayment,
  computeTotals,
  documentTypeLabels,
  getCurrencySymbol,
  InvoiceData,
} from '../types';
import { DownloadIcon, EyeIcon } from './icons';

interface InvoicePreviewProps {
  data: InvoiceData;
}

export default function InvoicePreview({ data }: InvoicePreviewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const totals = computeTotals(data.lineItems, data.discountType, data.discountValue, data.taxRate);
  const { subtotal, discount, tax, total } = totals;
  const isReceipt = data.documentType === 'receipt';
  const amountReceived = isReceipt ? (data.amountReceived > 0 ? data.amountReceived : total) : total;
  const balanceDue = calculateBalanceDue(total, amountReceived);
  const overpayment = calculateOverpayment(total, amountReceived);
  const sym = getCurrencySymbol(data.currency);

  const handleExportPDF = async () => {
    if (typeof window === 'undefined' || !printRef.current) return;

    const originalStyles = {
      overflow: printRef.current.style.overflow,
      maxHeight: printRef.current.style.maxHeight,
      height: printRef.current.style.height,
    };

    try {
      const { toPng } = await import('html-to-image');

      printRef.current.style.overflow = 'visible';
      printRef.current.style.maxHeight = 'none';
      printRef.current.style.height = 'auto';

      const pngDataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 2,
      });

      printRef.current.style.overflow = originalStyles.overflow;
      printRef.current.style.maxHeight = originalStyles.maxHeight;
      printRef.current.style.height = originalStyles.height;

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
      if (printRef.current) {
        printRef.current.style.overflow = originalStyles.overflow;
        printRef.current.style.maxHeight = originalStyles.maxHeight;
        printRef.current.style.height = originalStyles.height;
      }
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderReceiptSummary = () => {
    if (!isReceipt) return null;

    return (
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Receipt status</p>
            <p className="text-lg font-bold text-emerald-900">
              {overpayment > 0 ? 'Overpayment recorded' : balanceDue > 0 ? 'Partially paid' : 'Paid in full'}
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              Receipt for invoice {data.invoiceReference || data.documentNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Amount received</p>
            <p className="text-2xl font-bold text-emerald-950">
              {sym}
              {amountReceived.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">Payment method</p>
            <p className="font-medium text-gray-800">{data.paymentMethod || 'Not specified'}</p>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">Reference</p>
            <p className="font-medium text-gray-800">{data.paymentReference || 'Not provided'}</p>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">Balance due</p>
            <p className="font-medium text-gray-800">
              {overpayment > 0 ? `${sym}${overpayment.toFixed(2)} credit` : `${sym}${balanceDue.toFixed(2)}`}
            </p>
          </div>
          <div className="rounded-lg bg-white/80 p-3">
            <p className="text-xs uppercase tracking-wider text-gray-500">Received by</p>
            <p className="font-medium text-gray-800">{data.receivedBy || 'Not provided'}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderTotals = () => (
    <div className="mb-6 flex justify-end">
      <div className="w-64">
        <div className="flex justify-between py-2 text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-800">
            {sym}
            {subtotal.toFixed(2)}
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-600">
              Discount{data.discountType === 'percent' ? ` (${data.discountValue}%)` : ''}
            </span>
            <span className="font-medium text-emerald-700">
              −{sym}
              {discount.toFixed(2)}
            </span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between py-2 text-sm">
            <span className="text-gray-600">Tax ({data.taxRate}%)</span>
            <span className="font-medium text-gray-800">
              {sym}
              {tax.toFixed(2)}
            </span>
          </div>
        )}
        <div className="flex justify-between py-3 text-sm font-semibold">
          <span className="text-gray-600">Invoice total</span>
          <span className="text-gray-800">
            {sym}
            {total.toFixed(2)}
          </span>
        </div>
        {isReceipt && (
          <>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Amount received</span>
              <span className="font-medium text-gray-800">
                {sym}
                {amountReceived.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-900 text-lg font-bold text-gray-900">
              <span>{overpayment > 0 ? 'Credit / change' : 'Balance remaining'}</span>
              <span>
                {sym}
                {(overpayment > 0 ? overpayment : balanceDue).toFixed(2)}
              </span>
            </div>
          </>
        )}
        {!isReceipt && (
          <div className="flex justify-between py-3 border-t-2 border-gray-900 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>
              {sym}
              {total.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const renderCommonDetails = () => (
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
        <p className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">
          {isReceipt ? 'Received From' : 'To'}
        </p>
        <p className="font-bold text-gray-800">{data.client.name}</p>
        <p className="text-sm text-gray-600 whitespace-pre-line">{data.client.address}</p>
        <p className="text-sm text-gray-600">{data.client.email}</p>
      </div>
    </div>
  );

  const renderModern = () => (
    <div className="min-h-[842px] bg-white p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          {data.logo && <img src={data.logo} alt="Logo" className="mb-3 h-16 w-auto object-contain" />}
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            {documentTypeLabels[data.documentType].toUpperCase()}
          </h2>
          <p className="mt-1 text-sm text-gray-500">#{data.documentNumber}</p>
          {isReceipt && data.invoiceReference && (
            <p className="mt-1 text-sm text-gray-500">Invoice reference: {data.invoiceReference}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            <span className="text-gray-400">{isReceipt ? 'Received on:' : 'Date:'}</span>{' '}
            {formatDate(data.date)}
          </p>
          {!isReceipt && data.dueDate && (
            <p className="mt-1 text-sm text-gray-600">
              <span className="text-gray-400">Due:</span> {formatDate(data.dueDate)}
            </p>
          )}
          {isReceipt && data.paymentReference && (
            <p className="mt-1 text-sm text-gray-600">
              <span className="text-gray-400">Reference:</span> {data.paymentReference}
            </p>
          )}
        </div>
      </div>

      {renderCommonDetails()}
      {renderReceiptSummary()}

      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-gray-900">
            <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Description</th>
            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Qty</th>
            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Rate</th>
            <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item) => (
            <tr key={item.id} className="border-b border-gray-100">
              <td className="py-3 text-sm text-gray-800">{item.description}</td>
              <td className="py-3 text-right text-sm text-gray-600">{item.quantity}</td>
              <td className="py-3 text-right text-sm text-gray-600">
                {sym}
                {item.rate.toFixed(2)}
              </td>
              <td className="py-3 text-right text-sm font-medium text-gray-800">
                {sym}
                {(item.quantity * item.rate).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {renderTotals()}

      {(data.notes || data.terms) && (
        <div className="rounded-lg bg-gray-50 p-4 space-y-2">
          {data.notes && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-700">{isReceipt ? 'Receipt note:' : 'Note:'}</span> {data.notes}
            </p>
          )}
          {data.terms && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-700">{isReceipt ? 'Receipt terms:' : 'Terms:'}</span> {data.terms}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderClassic = () => (
    <div className="min-h-[842px] bg-white border border-gray-300 p-8">
      <div className="mb-4 border-2 border-gray-800 p-5">
        <div className="flex items-start justify-between">
          <div>
            {data.logo && <img src={data.logo} alt="Logo" className="mb-2 h-16 w-auto object-contain" />}
            <h1 className="text-2xl font-bold uppercase tracking-widest text-gray-900">
              {documentTypeLabels[data.documentType]}
            </h1>
            {isReceipt && data.invoiceReference && (
              <p className="mt-1 text-sm text-gray-600">Invoice reference: {data.invoiceReference}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-gray-800">{data.documentNumber}</p>
            <p className="mt-1 text-sm text-gray-600">
              {isReceipt ? 'Received on:' : 'Date:'} {formatDate(data.date)}
            </p>
            {!isReceipt && data.dueDate && <p className="text-sm text-gray-600">Due: {formatDate(data.dueDate)}</p>}
            {isReceipt && data.paymentReference && <p className="text-sm text-gray-600">Ref: {data.paymentReference}</p>}
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
          <p className="text-xs font-bold uppercase text-gray-500 border-b border-gray-300 pb-1 mb-2">
            {isReceipt ? 'Received From' : 'Bill To'}
          </p>
          <p className="font-bold text-gray-800">{data.client.name}</p>
          <p className="text-sm text-gray-600 whitespace-pre-line">{data.client.address}</p>
          <p className="text-sm text-gray-600">{data.client.email}</p>
        </div>
      </div>

      {renderReceiptSummary()}

      <table className="w-full mb-6 border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2 text-left text-xs font-bold uppercase text-gray-700">Description</th>
            <th className="border border-gray-300 p-2 text-right text-xs font-bold uppercase text-gray-700">Qty</th>
            <th className="border border-gray-300 p-2 text-right text-xs font-bold uppercase text-gray-700">Unit Price</th>
            <th className="border border-gray-300 p-2 text-right text-xs font-bold uppercase text-gray-700">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item) => (
            <tr key={item.id}>
              <td className="border border-gray-300 p-2 text-sm text-gray-800">{item.description}</td>
              <td className="border border-gray-300 p-2 text-right text-sm text-gray-600">{item.quantity}</td>
              <td className="border border-gray-300 p-2 text-right text-sm text-gray-600">
                {sym}
                {item.rate.toFixed(2)}
              </td>
              <td className="border border-gray-300 p-2 text-right text-sm font-medium text-gray-800">
                {sym}
                {(item.quantity * item.rate).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {renderTotals()}

      {(data.notes || data.terms) && (
        <div className="border border-gray-300 p-3 space-y-1">
          {data.notes && (
            <p className="text-sm text-gray-700">
              <strong>{isReceipt ? 'Receipt note:' : 'Note:'}</strong> {data.notes}
            </p>
          )}
          {data.terms && (
            <p className="text-sm text-gray-700">
              <strong>{isReceipt ? 'Receipt terms:' : 'Terms:'}</strong> {data.terms}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const renderProfessional = () => (
    <div className="min-h-[842px] bg-white flex">
      <div className="w-1/3 bg-slate-800 text-white p-8 flex flex-col">
        {data.logo && <img src={data.logo} alt="Logo" className="mb-4 h-16 w-auto object-contain" />}
        <h2 className="mb-6 text-2xl font-bold uppercase tracking-wider">
          {documentTypeLabels[data.documentType]}
        </h2>

        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">From</p>
          <p className="font-bold">{data.company.name}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{data.company.address}</p>
          <p className="mt-1 text-sm text-slate-300">{data.company.email}</p>
          <p className="text-sm text-slate-300">{data.company.phone}</p>
          {data.company.additionalDetails && (
            <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{data.company.additionalDetails}</p>
          )}
        </div>

        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isReceipt ? 'Received From' : 'To'}
          </p>
          <p className="font-bold">{data.client.name}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{data.client.address}</p>
          <p className="mt-1 text-sm text-slate-300">{data.client.email}</p>
        </div>

        <div className="mt-auto space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">{isReceipt ? 'Received' : 'Date'}</span>
            <span>{formatDate(data.date)}</span>
          </div>
          {!isReceipt && data.dueDate && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Due</span>
              <span>{formatDate(data.dueDate)}</span>
            </div>
          )}
          {isReceipt && data.invoiceReference && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Invoice</span>
              <span>{data.invoiceReference}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Ref</span>
            <span>{data.documentNumber}</span>
          </div>
        </div>
      </div>

      <div className="w-2/3 p-8">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{documentTypeLabels[data.documentType].toUpperCase()}</h2>
            <p className="mt-1 text-sm text-gray-500">#{data.documentNumber}</p>
            {isReceipt && data.paymentReference && (
              <p className="mt-1 text-sm text-gray-500">Reference: {data.paymentReference}</p>
            )}
          </div>
          <div className="text-right">
            {isReceipt && (
              <p className="text-sm text-gray-600">
                Received on: <span className="font-medium">{formatDate(data.date)}</span>
              </p>
            )}
            {!isReceipt && data.dueDate && (
              <p className="text-sm text-gray-600">
                Due: <span className="font-medium">{formatDate(data.dueDate)}</span>
              </p>
            )}
          </div>
        </div>

        {renderReceiptSummary()}

        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-slate-800">
              <th className="pb-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Item</th>
              <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Qty</th>
              <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Price</th>
              <th className="pb-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-4 text-sm text-gray-800">{item.description}</td>
                <td className="py-4 text-right text-sm text-gray-600">{item.quantity}</td>
                <td className="py-4 text-right text-sm text-gray-600">
                  {sym}
                  {item.rate.toFixed(2)}
                </td>
                <td className="py-4 text-right text-sm font-medium text-gray-800">
                  {sym}
                  {(item.quantity * item.rate).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {renderTotals()}

        {(data.notes || data.terms) && (
          <div className="rounded-lg bg-slate-50 p-4 space-y-1">
            {data.notes && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-slate-700">{isReceipt ? 'Receipt note:' : 'Note:'}</span> {data.notes}
              </p>
            )}
            {data.terms && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-slate-700">{isReceipt ? 'Receipt terms:' : 'Terms:'}</span> {data.terms}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const getTemplate = () => {
    switch (data.template) {
      case 'classic':
        return renderClassic();
      case 'professional':
        return renderProfessional();
      default:
        return renderModern();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center text-xl font-bold text-gray-800">
          <EyeIcon size={20} className="mr-2" />
          Preview
        </h2>
        <button
          onClick={handleExportPDF}
          className="flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700"
        >
          <DownloadIcon size={16} className="mr-2" />
          Export PDF
        </button>
      </div>
      <div
        ref={printRef}
        className="overflow-hidden rounded-xl bg-gray-100 shadow-inner"
        style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}
      >
        {getTemplate()}
      </div>
    </div>
  );
}
