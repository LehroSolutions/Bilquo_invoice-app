'use client';

import React from 'react';
import {
  MAX_LINE_ITEMS,
  MAX_TAX_RATE,
  MAX_DOCUMENT_AMOUNT,
  computeTotals,
  formatMinorUnits,
  getCurrencySymbol,
  InvoiceData,
  LineItem,
  currencies,
  lineAmountMinor,
  parseLineInput,
} from '../types';
import LogoUploader from './LogoUploader';
import TemplateSelector from './TemplateSelector';
import {
  FileTextIcon,
  PlusIcon,
  QuoteIcon,
  ReceiptIcon,
  TrashIcon,
} from './icons';

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
}

/** `Date.now()` collides inside a single millisecond, which React reads as a
 *  duplicate key and which makes the wrong line get edited or removed. */
let lineItemSeq = 0;
const nextLineItemId = (): string =>
  `line-${Date.now().toString(36)}-${(lineItemSeq++).toString(36)}`;

export default function InvoiceForm({ data, onChange }: InvoiceFormProps) {
  const totals = computeTotals(data.lineItems, data.discountType, data.discountValue, data.taxRate);
  const isReceipt = data.documentType === 'receipt';
  const lineItemsAtCap = data.lineItems.length >= MAX_LINE_ITEMS;
  const amountReceived = data.amountReceivedIsSet ? data.amountReceived : totals.total;

  const updateField = <K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const updateCompany = (field: keyof InvoiceData['company'], value: string) => {
    onChange({ ...data, company: { ...data.company, [field]: value } });
  };

  const updateClient = (field: keyof InvoiceData['client'], value: string) => {
    onChange({ ...data, client: { ...data.client, [field]: value } });
  };

  const addLineItem = () => {
    if (lineItemsAtCap) return;
    const newItem: LineItem = {
      id: nextLineItemId(),
      description: '',
      quantity: 1,
      rate: 0,
    };
    updateField('lineItems', [...data.lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    updateField(
      'lineItems',
      data.lineItems.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeLineItem = (id: string) => {
    if (data.lineItems.length <= 1) return;
    updateField(
      'lineItems',
      data.lineItems.filter((item) => item.id !== id)
    );
  };

  /** Switching document type discards the payment amount: an amount recorded
   *  against an invoice is not a valid receipt amount, and the new document's
   *  total is the correct starting point. */
  const setDocumentType = (documentType: InvoiceData['documentType']) => {
    onChange({ ...data, documentType, amountReceived: 0, amountReceivedIsSet: false });
  };

  const renderPaymentFields = () => (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
            {getCurrencySymbol(data.currency)}
          </span>
          <input
            type="number"
            step="0.01"
            min={0}
            aria-label="Amount Received"
            value={amountReceived}
            onChange={(e) =>
              onChange({
                ...data,
                amountReceived: Math.min(Math.max(Number(e.target.value) || 0, 0), MAX_DOCUMENT_AMOUNT),
                amountReceivedIsSet: true,
              })
            }
            className="w-full rounded-r-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={formatMinorUnits(totals.totalMinor)}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Defaults to the current document total until you record a payment. Enter 0 to record
          nothing received.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
        <input
          type="text"
          aria-label="Payment Method"
            value={data.paymentMethod}
          onChange={(e) => updateField('paymentMethod', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Bank transfer, cash, card, mobile money"
        />
        <p className="mt-1 text-xs text-gray-500">Record the actual payment channel used.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Reference</label>
        <input
          type="text"
          aria-label="Payment Reference"
            value={data.paymentReference}
          onChange={(e) => updateField('paymentReference', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Transaction ID or slip number"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Received By</label>
        <input
          type="text"
          aria-label="Received By"
            value={data.receivedBy}
          onChange={(e) => updateField('receivedBy', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Staff member name"
        />
      </div>
    </div>
  );

  return (
    <div className="xl:max-h-[calc(100vh-120px)] space-y-6 overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-800">Document Details</h2>
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setDocumentType('invoice')}
            className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${
              data.documentType === 'invoice'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileTextIcon size={16} className="mr-1" />
            Invoice
          </button>
          <button
            type="button"
            onClick={() => setDocumentType('quote')}
            className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${
              data.documentType === 'quote'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <QuoteIcon size={16} className="mr-1" />
            Quote
          </button>
          <button
            type="button"
            onClick={() => setDocumentType('receipt')}
            className={`flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${
              data.documentType === 'receipt'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ReceiptIcon size={16} className="mr-1" />
            Receipt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Document Number</label>
          <input
            type="text"
            aria-label="Document Number"
            value={data.documentNumber}
            onChange={(e) => updateField('documentNumber', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="INV-001"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Tax Rate (%)</label>
          <input
            type="number"
            min={0}
            aria-label="Tax Rate (%)"
            value={data.taxRate}
            onChange={(e) => updateField('taxRate', Math.min(Math.max(Number(e.target.value) || 0, 0), MAX_TAX_RATE))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
          <select
            aria-label="Currency"
            value={data.currency}
            onChange={(e) => updateField('currency', e.target.value as InvoiceData['currency'])}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} - {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_5rem_auto] items-end gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Discount</label>
          <input
            type="number"
            min={0}
            max={data.discountType === 'percent' ? 100 : undefined}
            value={data.discountValue || ''}
            onChange={(e) =>
              updateField('discountValue', Math.min(Math.max(Number(e.target.value) || 0, 0), data.discountType === 'percent' ? 100 : MAX_DOCUMENT_AMOUNT))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
            aria-label={data.discountType === 'percent' ? 'Discount percent' : 'Discount amount'}
          />
        </div>
        <select
          value={data.discountType}
          onChange={(e) => {
            const nextType = e.target.value as InvoiceData['discountType'];
            // Clamp the stored value when switching modes so totals never jump
            const clamped =
              nextType === 'percent' ? Math.min(data.discountValue, 100) : data.discountValue;
            onChange({ ...data, discountType: nextType, discountValue: clamped });
          }}
          className="rounded-lg border border-gray-300 bg-white px-2 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Discount type"
        >
          <option value="percent">%</option>
          <option value="fixed">{getCurrencySymbol(data.currency)}</option>
        </select>
        <button
          type="button"
          onClick={() => updateField('discountValue', 0)}
          disabled={!data.discountValue}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-gray-400 disabled:opacity-40 disabled:hover:border-gray-300 cursor-pointer disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>

      {isReceipt ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Payment Received Date</label>
              <input
                type="date"
                aria-label="Date"
            value={data.date}
                onChange={(e) => updateField('date', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Invoice Reference</label>
              <input
                type="text"
                aria-label="Invoice Reference"
            value={data.invoiceReference}
                onChange={(e) => updateField('invoiceReference', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="INV-001"
              />
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold">Receipt best practice</p>
            <p className="mt-1">
              Use a unique receipt number, reference the original invoice, and record the actual payment amount and method.
            </p>
          </div>

          {renderPaymentFields()}
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              aria-label="Date"
            value={data.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
              aria-label="Due Date"
            value={data.dueDate}
              onChange={(e) => updateField('dueDate', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      <LogoUploader logo={data.logo} onChange={(logo) => updateField('logo', logo)} />
      <TemplateSelector selected={data.template} onChange={(template) => updateField('template', template)} />

      <div className="border-t border-gray-200 pt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-800">Your Company</h3>
        <div className="space-y-3">
          <input
            type="text"
            aria-label="Company Name"
            value={data.company.name}
            onChange={(e) => updateCompany('name', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Company Name"
          />
          <textarea
            aria-label="Company Address"
            value={data.company.address}
            onChange={(e) => updateCompany('address', e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Company Address"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="email"
              aria-label="Company Email"
            value={data.company.email}
              onChange={(e) => updateCompany('email', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Email"
            />
            <input
              type="tel"
              aria-label="Company Phone"
            value={data.company.phone}
              onChange={(e) => updateCompany('phone', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Phone"
            />
          </div>
          <textarea
            aria-label="Company Additional Details"
            value={data.company.additionalDetails}
            onChange={(e) => updateCompany('additionalDetails', e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Additional Details (e.g., Bank account, payment instructions, etc.)"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-800">Client</h3>
        <div className="space-y-3">
          <input
            type="text"
            aria-label="Client Name"
            value={data.client.name}
            onChange={(e) => updateClient('name', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Client Name"
          />
          <textarea
            aria-label="Client Address"
            value={data.client.address}
            onChange={(e) => updateClient('address', e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Client Address"
          />
          <input
            type="email"
            aria-label="Client Email"
            value={data.client.email}
            onChange={(e) => updateClient('email', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Client Email"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-800">Line Items</h3>
          <button
            type="button"
            onClick={addLineItem}
            disabled={lineItemsAtCap}
            title={
              lineItemsAtCap
                ? `A document can hold at most ${MAX_LINE_ITEMS} line items`
                : 'Add a line item'
            }
            className="flex cursor-pointer items-center text-sm font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            <PlusIcon size={16} className="mr-1" />
            Add Item
          </button>
        </div>
        {lineItemsAtCap && (
          <p role="status" className="mb-2 text-xs text-gray-500">
            Line item limit reached ({MAX_LINE_ITEMS}). Split the work across documents to add
            more.
          </p>
        )}
        <div className="space-y-2">
          {data.lineItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 items-center gap-2 rounded-lg bg-gray-50 p-2">
              <div className="col-span-5">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Description"
                  aria-label={`Description for line item ${index + 1}`}
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItem(item.id, 'quantity', parseLineInput(e.target.value, 1))
                  }
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Qty"
                  aria-label={`Quantity for line item ${index + 1}`}
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={item.rate}
                  onChange={(e) => updateLineItem(item.id, 'rate', parseLineInput(e.target.value, 0))}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Rate"
                  aria-label={`Rate for line item ${index + 1}`}
                />
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="font-medium text-sm text-gray-600">
                  {getCurrencySymbol(data.currency)}
                  {formatMinorUnits(lineAmountMinor(item))}
                </span>
                <button
                  type="button"
                  onClick={() => removeLineItem(item.id)}
                  disabled={data.lineItems.length <= 1}
                  className="cursor-pointer text-red-600 hover:text-red-800 disabled:opacity-30"
                  aria-label={`Remove line item ${index + 1}`}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 border-t border-gray-200 pt-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            aria-label="Notes"
            value={data.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Thank you for your business!"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Terms & Conditions</label>
          <textarea
            aria-label="Terms & Conditions"
            value={data.terms}
            onChange={(e) => updateField('terms', e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Payment due within 30 days."
          />
        </div>
      </div>
    </div>
  );
}
