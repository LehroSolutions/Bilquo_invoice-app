import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DRAFT_TTL_MS, isDraftExpired } from '../src/app/draft.ts';

test('draft retention rejects absent, malformed, future, and expired timestamps', () => {
  const now = Date.UTC(2026, 9, 29);
  for (const savedAt of [null, '', 'NaN', 'invalid', 'Infinity', '-1', '0', String(now + 1), String(now - DRAFT_TTL_MS - 1)]) {
    assert.equal(isDraftExpired(savedAt, now), true, String(savedAt));
  }
  assert.equal(isDraftExpired(String(now), now), false);
  assert.equal(isDraftExpired(String(now - DRAFT_TTL_MS), now), false);
});
