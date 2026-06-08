'use client';

import React from 'react';
import {
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  getCurrencySymbol,
  InvoiceData,
  LineItem,
  currencies,
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

export default function InvoiceForm({ data, onChange }: InvoiceFormProps) {
  const subtotal = calculateSubtotal(data.lineItems);
  const tax = calculateTax(subtotal, data.taxRate);
  const total = calculateTotal(subtotal, tax);
  const isReceipt = data.documentType === 'receipt';

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
    const newItem: LineItem = {
      id: Date.now().toString(),
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
            value={data.amountReceived || total}
            onChange={(e) => updateField('amountReceived', Number(e.target.value))}
            className="w-full rounded-r-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={total.toFixed(2)}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Defaults to the current invoice total until you record a partial payment.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
        <input
          type="text"
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
          value={data.receivedBy}
          onChange={(e) => updateField('receivedBy', e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Staff member name"
        />
      </div>
    </div>
  );

  return (
    <div className="max-h-[calc(100vh-120px)] space-y-6 overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Document Details</h2>
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => updateField('documentType', 'invoice')}
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
            onClick={() => updateField('documentType', 'quote')}
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
            onClick={() => updateField('documentType', 'receipt')}
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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Document Number</label>
          <input
            type="text"
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
            value={data.taxRate}
            onChange={(e) => updateField('taxRate', Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
          <select
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

      {isReceipt ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Payment Received Date</label>
              <input
                type="date"
                value={data.date}
                onChange={(e) => updateField('date', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Invoice Reference</label>
              <input
                type="text"
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
              value={data.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
            <input
              type="date"
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
            value={data.company.name}
            onChange={(e) => updateCompany('name', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Company Name"
          />
          <textarea
            value={data.company.address}
            onChange={(e) => updateCompany('address', e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Company Address"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="email"
              value={data.company.email}
              onChange={(e) => updateCompany('email', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Email"
            />
            <input
              type="tel"
              value={data.company.phone}
              onChange={(e) => updateCompany('phone', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Phone"
            />
          </div>
          <textarea
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
            value={data.client.name}
            onChange={(e) => updateClient('name', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Client Name"
          />
          <textarea
            value={data.client.address}
            onChange={(e) => updateClient('address', e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Client Address"
          />
          <input
            type="email"
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
            className="flex cursor-pointer items-center text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <PlusIcon size={16} className="mr-1" />
            Add Item
          </button>
        </div>
        <div className="space-y-2">
          {data.lineItems.map((item) => (
            <div key={item.id} className="grid grid-cols-12 items-center gap-2 rounded-lg bg-gray-50 p-2">
              <div className="col-span-5">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Description"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Qty"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => updateLineItem(item.id, 'rate', Number(e.target.value))}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Rate"
                />
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="font-medium text-sm text-gray-600">
                  {getCurrencySymbol(data.currency)}
                  {(item.quantity * item.rate).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => removeLineItem(item.id)}
                  disabled={data.lineItems.length <= 1}
                  className="cursor-pointer text-red-400 hover:text-red-600 disabled:opacity-30"
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
