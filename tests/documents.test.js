import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTotals, lineAmountMinor, MAX_LINE_INPUT, MAX_LINE_ITEMS, parseCalendarDate, calculateBalanceDueMinor, calculateOverpaymentMinor } from '../src/app/types.ts';
import { sanitizeImported } from '../src/app/draft.ts';
import { paginateDocument } from '../src/app/pdf.ts';

const line = (quantity, rate) => ({ id: 'line', description: 'Consulting', quantity, rate });

test('a 10% discount and 15% VAT on R100 produce R103.50', () => {
  const totals = computeTotals([line(1, 100)], 'percent', 10, 15);
  assert.equal(totals.subtotalMinor, 10000);
  assert.equal(totals.discountMinor, 1000);
  assert.equal(totals.taxableBaseMinor, 9000);
  assert.equal(totals.taxMinor, 1350);
  assert.equal(totals.totalMinor, 10350);
});

test('printed line rounding reconciles with discounts, tax, and receipts', () => {
  assert.equal(lineAmountMinor(line(3, 33.35)), 10005);
  const totals = computeTotals([line(3, 33.35), line(1, 0.05)], 'fixed', 5, 15);
  assert.equal(totals.subtotalMinor, 10010);
  assert.equal(totals.totalMinor, 10937);
  assert.equal(calculateBalanceDueMinor(totals.totalMinor, 0), 10937);
  assert.equal(calculateBalanceDueMinor(totals.totalMinor, 5000), 5937);
  assert.equal(calculateOverpaymentMinor(totals.totalMinor, 12000), 1063);
});

test('discounts cannot create a negative balance and limits preserve safe integers', () => {
  assert.equal(computeTotals([line(1, 10)], 'percent', 500, 15).totalMinor, 0);
  assert.equal(computeTotals([line(1, 10)], 'fixed', 500, 15).totalMinor, 0);
  const totals = computeTotals(Array.from({ length: MAX_LINE_ITEMS + 1 }, () => line(MAX_LINE_INPUT, MAX_LINE_INPUT)), 'percent', 0, 10000);
  assert.ok(Number.isSafeInteger(totals.totalMinor));
  assert.equal(totals.totalMinor, MAX_LINE_ITEMS * MAX_LINE_INPUT ** 2 * 100 * 2);
});

test('draft imports normalize duplicate IDs, numeric limits, and calendar dates', () => {
  const draft = sanitizeImported({ lineItems: [line(1e100, 1e100), line(-1, null)], taxRate: 500, discountValue: 200, date: '2026-02-31', dueDate: '2026-02-28' });
  assert.equal(new Set(draft.lineItems.map((item) => item.id)).size, 2);
  assert.equal(draft.lineItems[0].quantity, MAX_LINE_INPUT);
  assert.equal(draft.lineItems[0].rate, MAX_LINE_INPUT);
  assert.equal(draft.lineItems[1].quantity, 0);
  assert.equal(draft.taxRate, 100);
  assert.equal(draft.discountValue, 100);
  assert.ok(parseCalendarDate(draft.date));
  assert.equal(draft.dueDate, '2026-02-28');
});

test('invalid draft containers and active image formats do not enter state', () => {
  for (const invalid of [null, [], true, 'draft']) assert.throws(() => sanitizeImported(invalid));
  assert.equal(sanitizeImported({ logo: 'data:image/svg+xml;base64,PHN2Zz4=' }).logo, null);
  assert.equal(sanitizeImported({ logo: 'https://example.com/logo.png' }).logo, null);
  assert.equal(sanitizeImported({ lineItems: [] }).lineItems.length, 1);
});

test('PDF pages move a crossing row intact to the next page', () => {
  assert.deepEqual(paginateDocument(250, 100, [{ top: 80, bottom: 120 }, { top: 170, bottom: 210 }]), [
    { offset: 0, height: 80 }, { offset: 80, height: 90 }, { offset: 170, height: 80 },
  ]);
});

test('PDF pagination makes progress on oversized rows and rejects invalid page sizes', () => {
  assert.deepEqual(paginateDocument(250, 100, [{ top: 0, bottom: 250 }]), [
    { offset: 0, height: 100 }, { offset: 100, height: 100 }, { offset: 200, height: 50 },
  ]);
  assert.throws(() => paginateDocument(100, 0, []), RangeError);
});
