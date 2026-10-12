export function createIdGenerator(deterministic = false) {
  let transferCount = 0;
  let quoteCount = 0;

  return {
    transferId: () => {
      transferCount += 1;
      return `TRF-${String(transferCount).padStart(6, '0')}`;
    },
    quoteId: () => {
      quoteCount += 1;
      return `q-${String(quoteCount).padStart(6, '0')}`;
    },
    idempotencyKey: () => {
      if (deterministic) {
        transferCount += 1;
        return `idem-${String(transferCount).padStart(6, '0')}`;
      }
      return `idem-${crypto.randomUUID()}`;
    },
  };
}
