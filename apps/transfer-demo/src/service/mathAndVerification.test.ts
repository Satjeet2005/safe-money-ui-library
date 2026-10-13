import { mulDivHalfEven } from '../../src/service/math.js';
import { formatRate } from '../../src/service/format.js';
import { verifyTransfer, type ReviewSnapshotData } from '../../src/service/verifyTransfer.js';
import type { TransferResponsePayload } from '../../src/service/types.js';

describe('WP-15B: Math, FormatRate and Transfer Verification', () => {
  describe('Exact arithmetic (mulDivHalfEven MD-01..MD-04)', () => {
    // MD-01: Exact division
    test('MD-01: Exact division with zero remainder', () => {
      expect(mulDivHalfEven(100, 2, 4)).toBe(50);
      expect(mulDivHalfEven(1000, 10, 100)).toBe(100);
    });

    // MD-02: Round down when remainder strictly less than half denominator
    test('MD-02: Round down when 2 * remainder < denominator', () => {
      // 10 * 1 / 4 = 2.5 (tie), but 10 * 1 / 5 = 2 with r=0
      // 11 * 1 / 10 = 1.1 -> 1
      expect(mulDivHalfEven(11, 1, 10)).toBe(1);
      // 14 * 1 / 10 = 1.4 -> 1
      expect(mulDivHalfEven(14, 1, 10)).toBe(1);
    });

    // MD-03: Round up when remainder strictly greater than half denominator
    test('MD-03: Round up when 2 * remainder > denominator', () => {
      // 16 * 1 / 10 = 1.6 -> 2
      expect(mulDivHalfEven(16, 1, 10)).toBe(2);
      // 19 * 1 / 10 = 1.9 -> 2
      expect(mulDivHalfEven(19, 1, 10)).toBe(2);
    });

    // MD-04: Half-even tie behaviour
    test('MD-04: Half-even tie behaviour rounds to nearest even integer', () => {
      // 15 / 10 = 1.5 -> q=1 (odd), tie -> 2 (even)
      expect(mulDivHalfEven(15, 1, 10)).toBe(2);
      // 25 / 10 = 2.5 -> q=2 (even), tie -> 2 (even)
      expect(mulDivHalfEven(25, 1, 10)).toBe(2);
      // 35 / 10 = 3.5 -> q=3 (odd), tie -> 4 (even)
      expect(mulDivHalfEven(35, 1, 10)).toBe(4);
      // 45 / 10 = 4.5 -> q=4 (even), tie -> 4 (even)
      expect(mulDivHalfEven(45, 1, 10)).toBe(4);
    });
  });

  describe('formatRate (RT-01..RT-03)', () => {
    // RT-01: 920000 -> '0.9200'
    test('RT-01: 920000 formats to 0.9200', () => {
      expect(formatRate(920_000)).toBe('0.9200');
    });

    // RT-02: 83500000 -> '83.5000'
    test('RT-02: 83500000 formats to 83.5000', () => {
      expect(formatRate(83_500_000)).toBe('83.5000');
    });

    // RT-03: 192307692 -> '192.3077'
    test('RT-03: 192307692 formats to 192.3077', () => {
      expect(formatRate(192_307_692)).toBe('192.3077');
    });
  });

  describe('Transfer verification (VT-01..VT-05)', () => {
    const validSnapshot: ReviewSnapshotData = {
      sourceCurrency: 'USD',
      sourceMinor: 10000,
      feeMinor: 100,
      targetCurrency: 'EUR',
      targetMinor: 9200,
    };

    const validResponse: TransferResponsePayload = {
      transferId: 'TRF-000001',
      status: 'completed',
      debited: { currency: 'USD', minor: 10100 },
      credited: { currency: 'EUR', minor: 9200 },
      completedAtMs: 1700000000000,
    };

    // VT-01: Valid transfer response
    test('VT-01: Valid transfer response matches review snapshot', () => {
      expect(verifyTransfer(validResponse, validSnapshot)).toBe(true);
    });

    // VT-02: Wrong debited currency
    test('VT-02: Wrong debited currency fails verification', () => {
      const response = {
        ...validResponse,
        debited: { currency: 'EUR' as const, minor: 10100 },
      };
      expect(verifyTransfer(response, validSnapshot)).toBe(false);
    });

    // VT-03: Wrong debited minor amount
    test('VT-03: Wrong debited minor amount fails verification', () => {
      const response = {
        ...validResponse,
        debited: { currency: 'USD' as const, minor: 10000 }, // missing fee
      };
      expect(verifyTransfer(response, validSnapshot)).toBe(false);
    });

    // VT-04: Wrong credited currency
    test('VT-04: Wrong credited currency fails verification', () => {
      const response = {
        ...validResponse,
        credited: { currency: 'GBP' as const, minor: 9200 },
      };
      expect(verifyTransfer(response, validSnapshot)).toBe(false);
    });

    // VT-05: Wrong credited minor amount
    test('VT-05: Wrong credited minor amount fails verification', () => {
      const response = {
        ...validResponse,
        credited: { currency: 'EUR' as const, minor: 9201 }, // modified by 1 unit
      };
      expect(verifyTransfer(response, validSnapshot)).toBe(false);
    });
  });
});
