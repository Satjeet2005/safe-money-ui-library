import type { z } from 'zod';
import type {
  AccountsResponse,
  RecipientsResponse,
  QuoteResponse,
  TransferRequest,
  TransferResponse,
} from './schemas.js';

export type AccountsPayload = z.infer<typeof AccountsResponse>;
export type RecipientsPayload = z.infer<typeof RecipientsResponse>;
export type QuotePayload = z.infer<typeof QuoteResponse>;
export type TransferRequestPayload = z.infer<typeof TransferRequest>;
export type TransferResponsePayload = z.infer<typeof TransferResponse>;
