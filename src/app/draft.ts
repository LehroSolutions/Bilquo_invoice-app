import { CurrencyCode, DiscountType, DocumentType, InvoiceData, LineItem, MAX_LOGO_BYTES, MAX_LINE_INPUT, MAX_LINE_ITEMS, MAX_DOCUMENT_AMOUNT, MAX_TAX_RATE, TemplateType, currencies, defaultBilquoData, parseCalendarDate, todayCalendarDate } from './types';

export const DRAFT_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function isDraftExpired(savedAt: string | null, now = Date.now()): boolean {
  const savedAtMs = Number(savedAt);
  return !Number.isFinite(savedAtMs) || savedAtMs <= 0 || savedAtMs > now || now - savedAtMs > DRAFT_TTL_MS;
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function asNonNegNumber(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return dataUrl.length;
  return Math.floor(((dataUrl.length - comma - 1) * 3) / 4);
}

/** Hardened import: every field is validated before it can touch app state. */
export function sanitizeImported(raw: unknown): InvoiceData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('A draft must be a JSON object.');
  const candidate = raw as Partial<InvoiceData> & Record<string, unknown>;
  const lineItems: LineItem[] = Array.isArray(candidate.lineItems)
    ? candidate.lineItems.slice(0, MAX_LINE_ITEMS).map((item, i) => {
        const li = (item ?? {}) as unknown as Record<string, unknown>;
        return {
          id: `imported-${i}`,
          description: asString(li.description).slice(0, 2000),
          quantity: Math.min(asNonNegNumber(li.quantity, 0), MAX_LINE_INPUT),
          rate: Math.min(asNonNegNumber(li.rate, 0), MAX_LINE_INPUT),
        };
      })
    : defaultBilquoData.lineItems;
  const docType: DocumentType =
    candidate.documentType === 'quote' || candidate.documentType === 'receipt'
      ? candidate.documentType
      : 'invoice';
  const template: TemplateType =
    candidate.template === 'classic' || candidate.template === 'professional'
      ? candidate.template
      : 'modern';
  const discountType: DiscountType =
    candidate.discountType === 'fixed' ? 'fixed' : 'percent';
  const currency: CurrencyCode = currencies.some((c) => c.code === candidate.currency)
    ? (candidate.currency as CurrencyCode)
    : 'ZAR';
  return {
    documentType: docType,
    documentNumber: asString(candidate.documentNumber, defaultBilquoData.documentNumber).slice(0, 100),
    date: parseCalendarDate(asString(candidate.date)) ? asString(candidate.date) : todayCalendarDate(),
    dueDate: parseCalendarDate(asString(candidate.dueDate)) ? asString(candidate.dueDate) : '',
    invoiceReference: asString(candidate.invoiceReference).slice(0, 200),
    amountReceived: Math.min(asNonNegNumber(candidate.amountReceived, 0), MAX_DOCUMENT_AMOUNT),
    amountReceivedIsSet: candidate.amountReceivedIsSet === true,
    paymentMethod: asString(candidate.paymentMethod, 'Bank transfer').slice(0, 100),
    paymentReference: asString(candidate.paymentReference).slice(0, 200),
    receivedBy: asString(candidate.receivedBy).slice(0, 200),
    company: {
      name: asString(candidate.company?.name).slice(0, 300),
      address: asString(candidate.company?.address).slice(0, 1000),
      email: asString(candidate.company?.email).slice(0, 320),
      phone: asString(candidate.company?.phone).slice(0, 60),
      additionalDetails: asString(candidate.company?.additionalDetails).slice(0, 1000),
    },
    client: {
      name: asString(candidate.client?.name).slice(0, 300),
      address: asString(candidate.client?.address).slice(0, 1000),
      email: asString(candidate.client?.email).slice(0, 320),
    },
    lineItems: lineItems.length ? lineItems : defaultBilquoData.lineItems.map((item) => ({ ...item })),
    discountType,
    discountValue: Math.min(asNonNegNumber(candidate.discountValue, 0), discountType === 'percent' ? 100 : MAX_DOCUMENT_AMOUNT),
    taxRate: Math.min(asNonNegNumber(candidate.taxRate, 0), MAX_TAX_RATE),
    notes: asString(candidate.notes, defaultBilquoData.notes).slice(0, 5000),
    terms: asString(candidate.terms, defaultBilquoData.terms).slice(0, 5000),
    logo:
      typeof candidate.logo === 'string' &&
      /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(candidate.logo) &&
      dataUrlBytes(candidate.logo) <= MAX_LOGO_BYTES
        ? candidate.logo
        : null,
    template,
    currency,
  };
}
