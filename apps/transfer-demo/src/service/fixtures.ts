export const FIXTURES = {
  accountHolder: 'Asha Rao',
  accounts: [
    { currency: 'USD' as const, balanceMinor: 500_000 },
    { currency: 'EUR' as const, balanceMinor: 250_000 },
    { currency: 'GBP' as const, balanceMinor: 120_000 },
  ],
  recipients: [
    {
      id: 'rcp-001',
      name: 'Mateo Alvarez',
      country: 'ES',
      currency: 'EUR' as const,
      accountHint: '****4821',
    },
    {
      id: 'rcp-002',
      name: 'Priya Nair',
      country: 'IN',
      currency: 'INR' as const,
      accountHint: '****1190',
    },
    {
      id: 'rcp-003',
      name: 'Kenji Watanabe',
      country: 'JP',
      currency: 'JPY' as const,
      accountHint: '****7733',
    },
    {
      id: 'rcp-004',
      name: 'Zofia Kowalska',
      country: 'PL',
      currency: 'PLN' as const,
      accountHint: '****0456',
    },
    {
      id: 'rcp-005',
      name: 'Omar Al-Sabah',
      country: 'KW',
      currency: 'KWD' as const,
      accountHint: '****9082',
    },
  ],
  MIN_SEND_MINOR: 100,
  MAX_SEND_MINOR: 1_000_000,
  QUOTE_TTL_MS: 30_000,
  SUBMIT_TIMEOUT_MS: 12_000,
} as const;
