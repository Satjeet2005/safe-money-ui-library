import { createReviewGuard } from '../../src/submit/reviewGuard.js';

describe('Review Guard (PRD §9.4 & Action Plan RG-01..RG-05)', () => {
  type PaymentReview = {
    amount: number;
    currency: string;
    recipient: string;
    verified: boolean;
    extraNote?: string;
  };

  // RG-01: unchanged snapshot -> ok: true
  test('RG-01: unchanged snapshot returns ok: true', () => {
    const guard = createReviewGuard<PaymentReview>();
    const snapshot: PaymentReview = {
      amount: 1000,
      currency: 'USD',
      recipient: 'alice@example.com',
      verified: true,
    };

    guard.capture(snapshot);
    expect(guard.hasSnapshot()).toBe(true);

    const live: PaymentReview = {
      amount: 1000,
      currency: 'USD',
      recipient: 'alice@example.com',
      verified: true,
    };

    const result = guard.check(live);
    expect(result).toEqual({ ok: true });
  });

  // RG-02: one changed key -> ok: false, changed has that key
  test('RG-02: one changed key returns ok: false with that key in changed array', () => {
    const guard = createReviewGuard<PaymentReview>();
    guard.capture({
      amount: 1000,
      currency: 'USD',
      recipient: 'alice@example.com',
      verified: true,
    });

    const live: PaymentReview = {
      amount: 2000, // changed
      currency: 'USD',
      recipient: 'alice@example.com',
      verified: true,
    };

    const result = guard.check(live);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.changed).toEqual(['amount']);
    }
  });

  // RG-03: added key -> ok: false, changed has that key
  test('RG-03: added key in live object returns ok: false with added key reported', () => {
    const guard = createReviewGuard<PaymentReview>();
    guard.capture({
      amount: 500,
      currency: 'EUR',
      recipient: 'bob@example.com',
      verified: false,
    });

    const live: PaymentReview = {
      amount: 500,
      currency: 'EUR',
      recipient: 'bob@example.com',
      verified: false,
      extraNote: 'urgent transfer',
    };

    const result = guard.check(live);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.changed).toEqual(['extraNote']);
    }
  });

  // RG-04: no snapshot captured -> ok: false, changed: []
  test('RG-04: check() with no snapshot returns ok: false and empty changed array', () => {
    const guard = createReviewGuard<PaymentReview>();
    expect(guard.hasSnapshot()).toBe(false);

    const live: PaymentReview = {
      amount: 100,
      currency: 'GBP',
      recipient: 'charlie@example.com',
      verified: true,
    };

    const result = guard.check(live);
    expect(result).toEqual({ ok: false, changed: [] });
  });

  // RG-05: clear() removes snapshot -> hasSnapshot false, check returns ok: false
  test('RG-05: clear() removes snapshot, resetting hasSnapshot and failing subsequent check()', () => {
    const guard = createReviewGuard<PaymentReview>();
    guard.capture({
      amount: 100,
      currency: 'GBP',
      recipient: 'charlie@example.com',
      verified: true,
    });
    expect(guard.hasSnapshot()).toBe(true);

    guard.clear();
    expect(guard.hasSnapshot()).toBe(false);

    const result = guard.check({
      amount: 100,
      currency: 'GBP',
      recipient: 'charlie@example.com',
      verified: true,
    });
    expect(result).toEqual({ ok: false, changed: [] });
  });

  // Additional invariant: snapshot is frozen and unaffected by mutating input object
  test('RG-extra: snapshot is frozen shallow copy and unaffected by caller mutating original input object', () => {
    const guard = createReviewGuard<{ a: number; b: string }>();
    const input = { a: 1, b: 'init' };
    guard.capture(input);

    input.a = 999;
    input.b = 'mutated';

    const result = guard.check({ a: 1, b: 'init' });
    expect(result).toEqual({ ok: true });
  });
});
