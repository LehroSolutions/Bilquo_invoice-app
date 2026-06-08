export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone: string;
  additionalDetails: string;
}

export interface ClientInfo {
  name: string;
  address: string;
  email: string;
}

export type DocumentType = 'invoice' | 'quote' | 'receipt';
export type TemplateType = 'classic' | 'modern' | 'professional';

export const documentTypeLabels: Record<DocumentType, string> = {
  invoice: 'Invoice',
  quote: 'Quote',
  receipt: 'Receipt',
};

export const currencies = [
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
] as const;

export type CurrencyCode = typeof currencies[number]['code'];

export interface InvoiceData {
  documentType: DocumentType;
  documentNumber: string;
  date: string;
  dueDate: string;
  invoiceReference: string;
  amountReceived: number;
  paymentMethod: string;
  paymentReference: string;
  receivedBy: string;
  company: CompanyInfo;
  client: ClientInfo;
  lineItems: LineItem[];
  taxRate: number;
  notes: string;
  terms: string;
  logo: string | null;
  template: TemplateType;
  currency: CurrencyCode;
}

export const defaultBilquoData: InvoiceData = {
  documentType: 'invoice',
  documentNumber: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  invoiceReference: '',
  amountReceived: 0,
  paymentMethod: 'Bank transfer',
  paymentReference: '',
  receivedBy: '',
  company: {
    name: '',
    address: '',
    email: '',
    phone: '',
    additionalDetails: '',
  },
  client: {
    name: '',
    address: '',
    email: '',
  },
  lineItems: [
    { id: '1', description: '', quantity: 1, rate: 0 },
  ],
  taxRate: 0,
  notes: 'Thank you for your business!',
  terms: 'Payment due within 30 days.',
  logo: null,
  template: 'modern',
  currency: 'USD',
};

export function getCurrencySymbol(code: CurrencyCode): string {
  return currencies.find((c) => c.code === code)?.symbol ?? '$';
}

export function calculateSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
}

export function calculateTax(subtotal: number, taxRate: number): number {
  return subtotal * (taxRate / 100);
}

export function calculateTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

export function calculateBalanceDue(total: number, amountReceived: number): number {
  return Math.max(total - amountReceived, 0);
}

export function calculateOverpayment(total: number, amountReceived: number): number {
  return Math.max(amountReceived - total, 0);
}
