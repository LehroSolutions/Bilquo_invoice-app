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
export type DiscountType = 'percent' | 'fixed';

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
  /**
   * False means "not entered yet", so the amount received tracks the document
   * total. A deliberate zero has to be distinguishable from that, otherwise
   * typing 0 snaps straight back to the total.
   */
  amountReceivedIsSet: boolean;
  paymentMethod: string;
  paymentReference: string;
  receivedBy: string;
  company: CompanyInfo;
  client: ClientInfo;
  lineItems: LineItem[];
  discountType: DiscountType;
  discountValue: number;
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
  date: '',
  dueDate: '',
  invoiceReference: '',
  amountReceived: 0,
  amountReceivedIsSet: false,
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
  discountType: 'percent',
  discountValue: 0,
  taxRate: 0,
  notes: 'Thank you for your business!',
  terms: 'Payment due within 30 days.',
  logo: null,
  template: 'modern',
  currency: 'ZAR',
};

export function getCurrencySymbol(code: CurrencyCode): string {
  return currencies.find((c) => c.code === code)?.symbol ?? '$';
}

export const MINOR_UNITS_PER_MAJOR = 100;

/** Per-field ceiling for quantity and rate. Sized so a document at the
 *  MAX_LINE_ITEMS cap still sums to well under Number.MAX_SAFE_INTEGER. */
export const MAX_LINE_INPUT = 100_000;
export const MAX_LINE_ITEMS = 500;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export const MAX_TAX_RATE = 100;
export const MAX_DOCUMENT_AMOUNT = MAX_LINE_ITEMS * MAX_LINE_INPUT * MAX_LINE_INPUT * 2;

/**
 * Rounding mode: HALF-UP, applied once per line item and nowhere else.
 *
 * Half-up is preferred over half-even ("banker's rounding") because it matches
 * the arithmetic a reader performs on the printed document — 3 x 33.35 shows
 * 100.05, not 100.04 — and it is the convention behind retail and tax tables.
 * Half-even rounds every tie toward even, so a long invoice drifts low. The
 * epsilon compensates for IEEE-754, which stores 33.35 * 100 as
 * 3334.9999999999995 and would otherwise round against the printed line.
 */
const ROUNDING_EPSILON = 1e-9;

/** Converts a major-unit amount to integer minor units, rounding half-up. */
export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  const scaled = amount * MINOR_UNITS_PER_MAJOR;
  return scaled < 0
    ? -Math.round(-scaled + ROUNDING_EPSILON)
    : Math.round(scaled + ROUNDING_EPSILON);
}

export function fromMinorUnits(minor: number): number {
  return (Number.isFinite(minor) ? minor : 0) / MINOR_UNITS_PER_MAJOR;
}

/** Display string for minor units. Conversion happens here and only here, so
 *  every printed figure is the exact integer the totals were built from. */
export function formatMinorUnits(minor: number): string {
  return fromMinorUnits(minor).toFixed(2);
}

function clampLineInput(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.min(v, MAX_LINE_INPUT);
}

/** The one place a line's amount is rounded. Form, preview and PDF all render
 *  the value returned here, which is why the printed lines always reconcile. */
export function lineAmountMinor(item: LineItem): number {
  return toMinorUnits(clampLineInput(item?.quantity) * clampLineInput(item?.rate));
}

/** Input-boundary guard: keeps non-finite, non-positive and out-of-range
 *  keystrokes out of state, so what is displayed is what gets totalled. */
export function parseLineInput(raw: string, fallback: number): number {
  const trimmed = raw.trim();
  if (trimmed === '') return fallback;
  const v = Number(trimmed);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.min(v, MAX_LINE_INPUT);
}

export interface DocumentTotals {
  /** Major-unit mirrors, for display only. Never feed these back in. */
  subtotal: number;
  discount: number;
  taxableBase: number;
  tax: number;
  total: number;
  subtotalMinor: number;
  discountMinor: number;
  taxableBaseMinor: number;
  taxMinor: number;
  totalMinor: number;
}

function calculateDiscountMinor(
  subtotalMinor: number,
  discountType: DiscountType,
  discountValue: number
): number {
  if (!Number.isFinite(discountValue) || discountValue <= 0) return 0;
  if (discountType === 'percent') {
    return Math.round(subtotalMinor * (Math.min(discountValue, 100) / 100) + ROUNDING_EPSILON);
  }
  return Math.min(toMinorUnits(discountValue), subtotalMinor);
}

function calculateTaxMinor(taxableBaseMinor: number, taxRate: number): number {
  if (!Number.isFinite(taxRate) || taxRate <= 0) return 0;
  return Math.round(taxableBaseMinor * (Math.min(taxRate, MAX_TAX_RATE) / 100) + ROUNDING_EPSILON);
}

/** Single source of truth: subtotal → discount → tax-on-discounted → total,
 *  all in integer minor units so the printed lines sum to the printed subtotal. */
export function computeTotals(
  lineItems: LineItem[],
  discountType: DiscountType,
  discountValue: number,
  taxRate: number
): DocumentTotals {
  const items = Array.isArray(lineItems) ? lineItems.slice(0, MAX_LINE_ITEMS) : [];
  const subtotalMinor = items.reduce((sum, item) => sum + lineAmountMinor(item), 0);
  const discountMinor = calculateDiscountMinor(subtotalMinor, discountType, discountValue);
  const taxableBaseMinor = Math.max(subtotalMinor - discountMinor, 0);
  const taxMinor = calculateTaxMinor(taxableBaseMinor, taxRate);
  const totalMinor = taxableBaseMinor + taxMinor;
  return {
    subtotalMinor,
    discountMinor,
    taxableBaseMinor,
    taxMinor,
    totalMinor,
    subtotal: fromMinorUnits(subtotalMinor),
    discount: fromMinorUnits(discountMinor),
    taxableBase: fromMinorUnits(taxableBaseMinor),
    tax: fromMinorUnits(taxMinor),
    total: fromMinorUnits(totalMinor),
  };
}

export function calculateBalanceDueMinor(totalMinor: number, amountReceivedMinor: number): number {
  return Math.max(totalMinor - amountReceivedMinor, 0);
}

export function calculateOverpaymentMinor(totalMinor: number, amountReceivedMinor: number): number {
  return Math.max(amountReceivedMinor - totalMinor, 0);
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Today as a local calendar date. `toISOString()` would report the UTC day,
 *  which is tomorrow's date for anyone east of Greenwich. */
export function todayCalendarDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

/** Parses `YYYY-MM-DD` as a calendar date in local time. `new Date(str)`
 *  treats it as UTC midnight, which prints as the previous day west of
 *  Greenwich. Returns null for anything that is not a real calendar date. */
export function parseCalendarDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr ?? '');
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}
