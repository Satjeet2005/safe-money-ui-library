import type { TransferResponsePayload } from './types.js';

export type ReviewSnapshotData = {
  sourceCurrency: string;
  sourceMinor: number;
  feeMinor: number;
  targetCurrency: string;
  targetMinor: number;
};

/**
 * Verifies that the completed transfer response strictly matches the review snapshot.
 * @example verifyTransfer(response, snapshot)
 */
export function verifyTransfer(
  response: TransferResponsePayload,
  snapshot: ReviewSnapshotData,
): boolean {
  return (
    response.debited.currency === snapshot.sourceCurrency &&
    response.debited.minor === snapshot.sourceMinor + snapshot.feeMinor &&
    response.credited.currency === snapshot.targetCurrency &&
    response.credited.minor === snapshot.targetMinor
  );
}
