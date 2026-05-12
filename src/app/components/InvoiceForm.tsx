'use client';

import React from 'react';
import { Plus, Trash2, FileText, Quote } from 'lucide-react';
import { InvoiceData, LineItem, currencies, getCurrencySymbol } from '../types';
import LogoUploader from './LogoUploader';
import TemplateSelector from './TemplateSelector';

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
}

export default function InvoiceForm({ data, onChange }: InvoiceFormProps) {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Document Details</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => updateField('documentType', 'invoice')}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              data.documentType === 'invoice'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={16} className="mr-1" />
            Invoice
          </button>
          <button
            type="button"
            onClick={() => updateField('documentType', 'quote')}
            className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
              data.documentType === 'quote'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Quote size={16} className="mr-1" />
            Quote
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
          <input
            type="text"
            value={data.documentNumber}
            onChange={(e) => updateField('documentNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="INV-001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
          <input
            type="number"
            value={data.taxRate}
            onChange={(e) => updateField('taxRate', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={data.currency}
            onChange={(e) => updateField('currency', e.target.value as InvoiceData['currency'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} — {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={data.date}
            onChange={(e) => updateField('date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="date"
            value={data.dueDate}
            onChange={(e) => updateField('dueDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <LogoUploader logo={data.logo} onChange={(logo) => updateField('logo', logo)} />
      <TemplateSelector selected={data.template} onChange={(template) => updateField('template', template)} />

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Your Company</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={data.company.name}
            onChange={(e) => updateCompany('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Company Name"
          />
          <textarea
            value={data.company.address}
            onChange={(e) => updateCompany('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            rows={2}
            placeholder="Company Address"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="email"
              value={data.company.email}
              onChange={(e) => updateCompany('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Email"
            />
            <input
              type="tel"
              value={data.company.phone}
              onChange={(e) => updateCompany('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Phone"
            />
          </div>
          <textarea
            value={data.company.additionalDetails}
            onChange={(e) => updateCompany('additionalDetails', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            rows={2}
            placeholder="Additional Details (e.g., Bank Account, Payment Instructions, etc.)"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3">Client</h3>
        <div className="space-y-3">
          <input
            type="text"
            value={data.client.name}
            onChange={(e) => updateClient('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Client Name"
          />
          <textarea
            value={data.client.address}
            onChange={(e) => updateClient('address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            rows={2}
            placeholder="Client Address"
          />
          <input
            type="email"
            value={data.client.email}
            onChange={(e) => updateClient('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Client Email"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Line Items</h3>
          <button
            type="button"
            onClick={addLineItem}
            className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            <Plus size={16} className="mr-1" />
            Add Item
          </button>
        </div>
        <div className="space-y-2">
          {data.lineItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2">
              <div className="col-span-5">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Description"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Qty"
                />
              </div>
              <div className="col-span-3">
                <input
                  type="number"
                  value={item.rate}
                  onChange={(e) => updateLineItem(item.id, 'rate', Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                  placeholder="Rate"
                />
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-sm text-gray-600 font-medium">
                  {getCurrencySymbol(data.currency)}{(item.quantity * item.rate).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => removeLineItem(item.id)}
                  disabled={data.lineItems.length <= 1}
                  className="text-red-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={data.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            rows={2}
            placeholder="Thank you for your business!"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
          <textarea
            value={data.terms}
            onChange={(e) => updateField('terms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            rows={2}
            placeholder="Payment due within 30 days."
          />
        </div>
      </div>
    </div>
  );
}
