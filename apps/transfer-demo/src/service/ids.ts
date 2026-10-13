import * as nodeCrypto from 'node:crypto';

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
      const uuid =
        typeof globalThis.crypto?.randomUUID === 'function'
          ? globalThis.crypto.randomUUID()
          : nodeCrypto.randomUUID();
      return `idem-${uuid}`;
    },
  };
}
