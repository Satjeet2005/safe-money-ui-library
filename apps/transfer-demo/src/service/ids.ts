/**
 * Generates transfer, quote, and idempotency IDs for the transfer demo.
 * @example
 * ```ts
 * const ids = createIdGenerator(true);
 * const tId = ids.transferId(); // 'TRF-000001'
 * const qId = ids.quoteId(); // 'q-000001'
 * const key = ids.idempotencyKey(); // 'idem-000001'
 * ```
 */
export function createIdGenerator(deterministic = false) {
  let transferCount = 0;
  let quoteCount = 0;
  let idemCount = 0;

  function generateUuid(): string {
    if (typeof globalThis !== 'undefined' && typeof globalThis.crypto?.randomUUID === 'function') {
      return globalThis.crypto.randomUUID();
    }
    const bytes = new Uint8Array(16);
    if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(bytes);
    }
    bytes[6] = (bytes[6]! & 0x0f) | 0x40;
    bytes[8] = (bytes[8]! & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  return {
    transferId: (): string => {
      transferCount += 1;
      return `TRF-${String(transferCount).padStart(6, '0')}`;
    },
    quoteId: (): string => {
      quoteCount += 1;
      return `q-${String(quoteCount).padStart(6, '0')}`;
    },
    idempotencyKey: (): string => {
      if (deterministic) {
        idemCount += 1;
        return `idem-${String(idemCount).padStart(6, '0')}`;
      }
      return `idem-${generateUuid()}`;
    },
  };
}
