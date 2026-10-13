import { z } from 'zod';
import { parseBoundary, BoundaryError } from '../../src/boundary/boundary.js';

describe('Boundary Helper (PRD §10.1 & Action Plan BD-01..BD-04)', () => {
  const UserSchema = z.object({
    id: z.string().min(1),
    age: z.number().int().positive(),
    email: z.string().email(),
  });

  // BD-01: valid input -> ok: true, value deep-equal
  test('BD-01: Valid input parses successfully with ok: true and deep-equal value', () => {
    const raw = {
      id: 'user_123',
      age: 30,
      email: 'user@example.com',
    };

    const result = parseBoundary('UserBoundary', UserSchema, raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(raw);
    }
  });

  // BD-02: invalid input -> ok: false, instance of BoundaryError with issue list and formatted paths
  test('BD-02: Invalid input returns ok: false, instance of BoundaryError with formatted paths', () => {
    const raw = {
      id: '',
      age: -5,
      email: 'not-an-email',
    };

    const result = parseBoundary('UserBoundary', UserSchema, raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(BoundaryError);
      expect(result.error.label).toBe('UserBoundary');
      expect(result.error.issues.length).toBeGreaterThan(0);
      expect(result.error.issues.map((i) => i.path)).toEqual(
        expect.arrayContaining(['id', 'age', 'email']),
      );
    }
  });

  // BD-03: capping at 10 issues
  test('BD-03: Excessive schema issues are capped at at most 10 items in issues list', () => {
    // Array with 15 invalid elements
    const ArraySchema = z.array(z.number().positive());
    const raw = Array.from({ length: 20 }, () => -1);

    const result = parseBoundary('ArrayBoundary', ArraySchema, raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(BoundaryError);
      expect(result.error.issues.length).toBe(10);
    }
  });

  // BD-04: raw data never leaked into error messages or JSON representation
  test('BD-04: Raw input data is never leaked into BoundaryError properties or serialized JSON', () => {
    const secretSentinel = 'SUPER_SECRET_TOKEN_DO_NOT_LEAK_XYZ';
    const SensitiveSchema = z.object({
      token: z.number(), // will fail since secretSentinel is a string
    });

    const result = parseBoundary('SensitiveBoundary', SensitiveSchema, {
      token: secretSentinel,
      otherSecret: 'TOP_SECRET_PASSPHRASE',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const err = result.error;
      expect(err.message).not.toContain(secretSentinel);
      expect(err.message).not.toContain('TOP_SECRET_PASSPHRASE');

      const serialized = JSON.stringify(err);
      expect(serialized).not.toContain(secretSentinel);
      expect(serialized).not.toContain('TOP_SECRET_PASSPHRASE');

      // Also verify issues array paths and messages don't leak raw value
      for (const issue of err.issues) {
        expect(issue.message).not.toContain(secretSentinel);
      }
    }
  });

  // Root level schema error path formatting
  test('BD-extra: Root-level error path formats as $', () => {
    const StringSchema = z.string();
    const result = parseBoundary('RootBoundary', StringSchema, 12345);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues[0]?.path).toBe('$');
    }
  });
});
