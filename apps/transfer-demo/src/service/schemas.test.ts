import { CURRENCIES } from '@satjeetsingh1/safe-money-ui/money';
import {
  Currency,
  SourceCurrency,
  Minor,
  MoneyS,
  AccountsResponse,
  RecipientsResponse,
  QuoteResponse,
  TransferRequest,
  TransferResponse,
  RejectionBody,
  PersistedDraft,
  ChaosConfig,
} from '../../src/service/schemas.js';
import { FIXTURES } from '../../src/service/fixtures.js';
import { createIdGenerator } from '../../src/service/ids.js';
import { systemClock } from '../../src/service/clock.js';

describe('WP-15A: Schemas, Fixtures, Clock and IDs', () => {
  // SCH-01
  test('SCH-01: Currency enum values match Object.keys(CURRENCIES) from the library', () => {
    const schemaCurrencies = Currency.options;
    const libraryCurrencies = Object.keys(CURRENCIES);

    expect(new Set(schemaCurrencies)).toEqual(new Set(libraryCurrencies));
    expect(schemaCurrencies.length).toBe(libraryCurrencies.length);
  });

  describe('Zod schemas strip unknown keys and enforce boundaries', () => {
    test('SourceCurrency accepts only USD, EUR, GBP', () => {
      expect(SourceCurrency.safeParse('USD').success).toBe(true);
      expect(SourceCurrency.safeParse('EUR').success).toBe(true);
      expect(SourceCurrency.safeParse('GBP').success).toBe(true);
      expect(SourceCurrency.safeParse('JPY').success).toBe(false);
      expect(SourceCurrency.safeParse('INR').success).toBe(false);
    });

    test('Minor rejects negative, non-integer, and numbers > 10^12', () => {
      expect(Minor.safeParse(0).success).toBe(true);
      expect(Minor.safeParse(1_000_000_000_000).success).toBe(true);
      expect(Minor.safeParse(-1).success).toBe(false);
      expect(Minor.safeParse(1.5).success).toBe(false);
      expect(Minor.safeParse(1_000_000_000_001).success).toBe(false);
    });

    test('MoneyS validates currency and minor units', () => {
      expect(MoneyS.safeParse({ currency: 'USD', minor: 500 }).success).toBe(true);
      expect(MoneyS.safeParse({ currency: 'INVALID', minor: 500 }).success).toBe(false);
    });

    test('AccountsResponse validates fixtures and strips unknown properties', () => {
      const raw = {
        accounts: [
          { currency: 'USD', balanceMinor: 500_000, extraNoise: 'strip_me' },
          { currency: 'EUR', balanceMinor: 250_000 },
        ],
        untrustedField: 12345,
      };

      const result = AccountsResponse.safeParse(raw);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accounts).toEqual([
          { currency: 'USD', balanceMinor: 500_000 },
          { currency: 'EUR', balanceMinor: 250_000 },
        ]);
        expect('untrustedField' in result.data).toBe(false);
        expect('extraNoise' in result.data.accounts[0]!).toBe(false);
      }
    });

    test('RecipientsResponse validates format and strips unknown properties', () => {
      const raw = {
        recipients: [
          {
            id: 'rcp-001',
            name: 'Mateo Alvarez',
            country: 'ES',
            currency: 'EUR',
            accountHint: '****4821',
            sneaky: true,
          },
        ],
      };
      const result = RecipientsResponse.safeParse(raw);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recipients[0]).toEqual({
          id: 'rcp-001',
          name: 'Mateo Alvarez',
          country: 'ES',
          currency: 'EUR',
          accountHint: '****4821',
        });
      }

      // Rejection of invalid regexes
      expect(
        RecipientsResponse.safeParse({
          recipients: [
            {
              id: 'rcp-99', // must be 3 digits
              name: 'A',
              country: 'ES',
              currency: 'EUR',
              accountHint: '****4821',
            },
          ],
        }).success,
      ).toBe(false);
    });

    test('QuoteResponse validates structure', () => {
      const raw = {
        quoteId: 'q-000001',
        source: { currency: 'USD', minor: 10000 },
        target: { currency: 'EUR', minor: 9200 },
        feeMinor: 100,
        rateMicro: 920000,
        expiresAtMs: 1700000000000,
      };
      expect(QuoteResponse.safeParse(raw).success).toBe(true);
      expect(QuoteResponse.safeParse({ ...raw, quoteId: 'invalid-id' }).success).toBe(false);
    });

    test('TransferRequest and TransferResponse validate shapes', () => {
      const req = {
        idempotencyKey: 'idem-000001',
        quoteId: 'q-000001',
        recipientId: 'rcp-001',
        sourceCurrency: 'USD',
        sourceMinor: 10000,
      };
      expect(TransferRequest.safeParse(req).success).toBe(true);

      const resp = {
        transferId: 'TRF-000001',
        status: 'completed',
        debited: { currency: 'USD', minor: 10100 },
        credited: { currency: 'EUR', minor: 9200 },
        completedAtMs: 1700000000000,
      };
      expect(TransferResponse.safeParse(resp).success).toBe(true);
      expect(TransferResponse.safeParse({ ...resp, status: 'pending' }).success).toBe(false);
    });

    test('RejectionBody accepts only valid error codes', () => {
      expect(
        RejectionBody.safeParse({
          error: { code: 'INSUFFICIENT_FUNDS', message: 'Not enough' },
        }).success,
      ).toBe(true);
      expect(
        RejectionBody.safeParse({
          error: { code: 'UNKNOWN_CODE', message: 'Fail' },
        }).success,
      ).toBe(false);
    });

    test('PersistedDraft and ChaosConfig validate boundaries', () => {
      expect(
        PersistedDraft.safeParse({
          version: 1,
          recipientId: 'rcp-001',
          sourceCurrency: 'USD',
          amountText: '100.00',
        }).success,
      ).toBe(true);

      expect(
        ChaosConfig.safeParse({
          latencyMs: 500,
          hangForever: false,
          lateResponseMs: 0,
          malformedPayload: false,
          inconsistentPayload: false,
          rejectWith: 'none',
          loseResponse: false,
          rateMoves: false,
          corruptStorage: false,
        }).success,
      ).toBe(true);
    });
  });

  describe('Fixtures adhere to schemas', () => {
    test('Asha Rao accounts and recipients parse against response schemas', () => {
      expect(FIXTURES.accountHolder).toBe('Asha Rao');
      expect(AccountsResponse.safeParse({ accounts: FIXTURES.accounts }).success).toBe(true);
      expect(RecipientsResponse.safeParse({ recipients: FIXTURES.recipients }).success).toBe(true);
      expect(FIXTURES.MIN_SEND_MINOR).toBe(100);
      expect(FIXTURES.MAX_SEND_MINOR).toBe(1_000_000);
      expect(FIXTURES.QUOTE_TTL_MS).toBe(30_000);
      expect(FIXTURES.SUBMIT_TIMEOUT_MS).toBe(12_000);
    });
  });

  describe('Clock and IDs', () => {
    test('systemClock returns a positive number', () => {
      expect(systemClock.now()).toBeGreaterThan(0);
    });

    test('createIdGenerator produces formatted sequential IDs in deterministic mode', () => {
      const ids = createIdGenerator(true);
      expect(ids.transferId()).toBe('TRF-000001');
      expect(ids.transferId()).toBe('TRF-000002');
      expect(ids.quoteId()).toBe('q-000001');
      expect(ids.quoteId()).toBe('q-000002');
      expect(ids.idempotencyKey()).toBe('idem-000001');
      expect(ids.idempotencyKey()).toBe('idem-000002');
    });

    test('createIdGenerator produces random UUID keys in non-deterministic mode', () => {
      const ids = createIdGenerator(false);
      const key1 = ids.idempotencyKey();
      const key2 = ids.idempotencyKey();
      expect(key1).toMatch(/^idem-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(key1).not.toBe(key2);
    });
  });
});
