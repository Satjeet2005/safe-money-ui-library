# @satjeetsingh1/safe-money-ui

Money-correct, failure-tolerant UI primitives for React and TypeScript.

This library provides domain primitives for handling monetary amounts in integer minor units, locale-aware parsing and formatting, a pure submit state machine, review mismatch guards, and safe runtime boundaries.

## Installation

```bash
pnpm add @satjeetsingh1/safe-money-ui
```

Peer dependencies: `react` (^18.3.0) and `zod` (^3.23.0).

Default styles for components are available at `@satjeetsingh1/safe-money-ui/styles.css`.

## Usage

### 1. Locale-aware parsing (`parseAmount`)

```typescript
import { parseAmount } from '@satjeetsingh1/safe-money-ui/money';

const result = parseAmount('1,234.50', {
  currency: 'USD',
  locale: 'en-US',
  minMinor: 100,
  maxMinor: 500000,
});

if (result.ok) {
  // result.money.minor is 123450 integer minor units
  console.log(`Parsed amount: ${result.money.minor} minor units`);
} else {
  // result.error.code e.g. 'INVALID_GROUPING', 'BELOW_MIN'
  console.error(`Validation error code: ${result.error.code}`);
}
```

### 2. Controlled money field (`MoneyInput`)

```tsx
import { useState, type JSX } from 'react';
import { MoneyInput } from '@satjeetsingh1/safe-money-ui/react';
import type { ParseError, ParseErrorCode, CurrencyCode } from '@satjeetsingh1/safe-money-ui/money';

const messages: Record<ParseErrorCode, (ctx: ParseError & { currency: CurrencyCode }) => string> = {
  EMPTY: () => 'Enter an amount to continue.',
  NOT_A_NUMBER: () => 'Use numbers and currency separators only.',
  NEGATIVE_NOT_ALLOWED: () => 'Negative amounts are not allowed.',
  MULTIPLE_DECIMAL_SEPARATORS: () => 'Enter only one decimal separator.',
  INVALID_GROUPING: () => 'Check thousands grouping separators.',
  TOO_MANY_DECIMALS: () => 'Too many decimal places for this currency.',
  ZERO_NOT_ALLOWED: () => 'Amount must be greater than zero.',
  BELOW_MIN: () => 'Amount is below the minimum limit.',
  ABOVE_MAX: () => 'Amount exceeds the maximum limit.',
  UNSAFE_MAGNITUDE: () => 'Amount exceeds safe processing magnitude.',
};

export function AmountField(): JSX.Element {
  const [value, setValue] = useState('100.00');

  return (
    <MoneyInput
      id="amount"
      label="Transfer amount"
      currency="USD"
      locale="en-US"
      value={value}
      onChange={(next) => setValue(next.text)}
      messages={messages}
      hint="Between $1.00 and $5,000.00"
      previewLabel={(formatted) => `Recipient will receive approximately ${formatted}`}
      minMinor={100}
      maxMinor={500000}
    />
  );
}
```

### 3. Safe submission lifecycle (`useSafeSubmit`)

```tsx
import { useSafeSubmit } from '@satjeetsingh1/safe-money-ui/react';
import { parseBoundary } from '@satjeetsingh1/safe-money-ui/boundary';
import { z } from 'zod';

const TransferResponseSchema = z.object({
  transferId: z.string(),
  status: z.literal('completed'),
});

type TransferInput = {
  recipientId: string;
  sourceCurrency: string;
  sourceMinor: number;
};
type TransferResponse = z.infer<typeof TransferResponseSchema>;

export function useTransferSubmit() {
  return useSafeSubmit<TransferInput, TransferResponse>({
    run: async (input, ctx) => {
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': ctx.idempotencyKey,
        },
        body: JSON.stringify(input),
        signal: ctx.signal,
      });
      return response.json();
    },
    parseResponse: (raw) => {
      const parsed = parseBoundary('TransferResponse', TransferResponseSchema, raw);
      if (!parsed.ok) {
        return { ok: false, message: 'Invalid response received from server' };
      }
      return { ok: true, value: parsed.value };
    },
    newKey: () => crypto.randomUUID(),
    timeoutMs: 12000,
  });
}
```

## Repository

Source code and chaos demo application: [https://github.com/Satjeet2005/safe-money-ui-library](https://github.com/Satjeet2005/safe-money-ui-library)

## Licence

MIT
