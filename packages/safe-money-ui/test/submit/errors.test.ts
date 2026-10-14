import { SubmitRejection } from '../../src/submit/errors.js';

describe('SubmitRejection Error Class', () => {
  it('instantiates correctly with message, code, and retryable flag', () => {
    const error = new SubmitRejection('Transaction declined', 'CARD_DECLINED', false);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SubmitRejection);
    expect(error.name).toBe('SubmitRejection');
    expect(error.message).toBe('Transaction declined');
    expect(error.code).toBe('CARD_DECLINED');
    expect(error.retryable).toBe(false);
  });

  it('preserves retryable = true when configured', () => {
    const error = new SubmitRejection('Temporary gateway error', 'GATEWAY_BUSY', true);

    expect(error.name).toBe('SubmitRejection');
    expect(error.code).toBe('GATEWAY_BUSY');
    expect(error.retryable).toBe(true);
  });
});
