import { z } from 'zod';

export const Currency = z.enum(['USD', 'EUR', 'GBP', 'PLN', 'INR', 'JPY', 'KWD']);
export const SourceCurrency = z.enum(['USD', 'EUR', 'GBP']);
export const Minor = z.number().int().nonnegative().max(1_000_000_000_000);
export const MoneyS = z.object({ currency: Currency, minor: Minor });

export const AccountsResponse = z.object({
  accounts: z.array(z.object({ currency: SourceCurrency, balanceMinor: Minor })).min(1),
});

export const RecipientsResponse = z.object({
  recipients: z
    .array(
      z.object({
        id: z.string().regex(/^rcp-\d{3}$/),
        name: z.string().min(1).max(60),
        country: z.string().length(2),
        currency: Currency,
        accountHint: z.string().regex(/^\*{4}\d{4}$/),
      }),
    )
    .min(1),
});

export const QuoteResponse = z.object({
  quoteId: z.string().regex(/^q-\d{6}$/),
  source: MoneyS,
  target: MoneyS,
  feeMinor: Minor,
  rateMicro: z.number().int().positive(),
  expiresAtMs: z.number().int().nonnegative(),
});

export const TransferRequest = z.object({
  idempotencyKey: z.string().min(8).max(64),
  quoteId: z.string(),
  recipientId: z.string(),
  sourceCurrency: SourceCurrency,
  sourceMinor: Minor,
});

export const TransferResponse = z.object({
  transferId: z.string().regex(/^TRF-\d{6}$/),
  status: z.literal('completed'),
  debited: MoneyS,
  credited: MoneyS,
  completedAtMs: z.number().int().nonnegative(),
});

export const RejectionBody = z.object({
  error: z.object({
    code: z.enum([
      'INSUFFICIENT_FUNDS',
      'RECIPIENT_BLOCKED',
      'SERVICE_UNAVAILABLE',
      'QUOTE_EXPIRED',
      'LIMIT_EXCEEDED',
    ]),
    message: z.string().min(1).max(200),
  }),
});

export const PersistedDraft = z.object({
  version: z.literal(1),
  recipientId: z.string().nullable(),
  sourceCurrency: SourceCurrency,
  amountText: z.string().max(40),
});

export const ChaosConfig = z.object({
  latencyMs: z.union([z.literal(0), z.literal(500), z.literal(3000)]),
  hangForever: z.boolean(),
  lateResponseMs: z.union([z.literal(0), z.literal(15000)]),
  malformedPayload: z.boolean(),
  inconsistentPayload: z.boolean(),
  rejectWith: z.enum(['none', 'INSUFFICIENT_FUNDS', 'RECIPIENT_BLOCKED', 'SERVICE_UNAVAILABLE']),
  loseResponse: z.boolean(),
  rateMoves: z.boolean(),
  corruptStorage: z.boolean(),
});

export type ChaosConfigPayload = z.infer<typeof ChaosConfig>;
