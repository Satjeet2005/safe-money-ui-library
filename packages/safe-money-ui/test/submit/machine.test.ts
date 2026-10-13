import { createSubmitMachine } from '../../src/submit/machine.js';
import type { SubmitError, SubmitState } from '../../src/submit/machine.js';

describe('Submit Machine Reducer (PRD §9.2 Transition Table)', () => {
  type TestInput = { amount: number };
  type TestOutput = { transactionId: string };

  const input: TestInput = { amount: 100 };
  const result: TestOutput = { transactionId: 'TX-123' };
  const retryableError: SubmitError = {
    kind: 'network',
    message: 'Network error',
    retryable: true,
  };
  const nonRetryableError: SubmitError = {
    kind: 'rejected',
    code: 'INSUFFICIENT_FUNDS',
    message: 'Insufficient balance',
    retryable: false,
  };

  it('idle + SUBMIT -> submitting with initial requestId = 1, attempt = 1, and given key', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const idleState: SubmitState<TestInput, TestOutput> = { status: 'idle' };

    const nextState = machine.reduce(idleState, {
      type: 'SUBMIT',
      input,
      idempotencyKey: 'key-1',
    });

    expect(nextState).toEqual({
      status: 'submitting',
      requestId: 1,
      idempotencyKey: 'key-1',
      input,
      attempt: 1,
    });
  });

  it('submitting + SUBMIT -> ignored (returns same state reference)', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submittingState = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );

    const next = machine.reduce(submittingState, {
      type: 'SUBMIT',
      input: { amount: 200 },
      idempotencyKey: 'key-2',
    });

    expect(next).toBe(submittingState);
  });

  it('submitting + RESOLVE (matching requestId) -> succeeded', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );

    const succeeded = machine.reduce(submitting, {
      type: 'RESOLVE',
      requestId: 1,
      result,
    });

    expect(succeeded).toEqual({
      status: 'succeeded',
      requestId: 1,
      idempotencyKey: 'key-1',
      result,
    });
  });

  it('submitting + REJECT (matching requestId) -> failed with error, preserving input and key', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );

    const failed = machine.reduce(submitting, {
      type: 'REJECT',
      requestId: 1,
      error: retryableError,
    });

    expect(failed).toEqual({
      status: 'failed',
      requestId: 1,
      idempotencyKey: 'key-1',
      input,
      error: retryableError,
      attempt: 1,
    });
  });

  it('submitting + RESOLVE / REJECT (mismatched requestId) -> ignored (returns same state reference)', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );

    const staleResolve = machine.reduce(submitting, {
      type: 'RESOLVE',
      requestId: 999,
      result,
    });
    expect(staleResolve).toBe(submitting);

    const staleReject = machine.reduce(submitting, {
      type: 'REJECT',
      requestId: 999,
      error: retryableError,
    });
    expect(staleReject).toBe(submitting);
  });

  it('submitting + RETRY or RESET -> ignored (returns same state reference)', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );

    expect(machine.reduce(submitting, { type: 'RETRY' })).toBe(submitting);
    expect(machine.reduce(submitting, { type: 'RESET' })).toBe(submitting);
  });

  it('failed (retryable) + RETRY -> submitting with same input and key, new requestId, attempt + 1', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting1 = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );
    const failed = machine.reduce(submitting1, {
      type: 'REJECT',
      requestId: 1,
      error: retryableError,
    });

    const retried = machine.reduce(failed, { type: 'RETRY' });

    expect(retried).toEqual({
      status: 'submitting',
      requestId: 2,
      idempotencyKey: 'key-1',
      input,
      attempt: 2,
    });
  });

  it('failed (non-retryable) + RETRY -> ignored (returns same state reference)', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );
    const failed = machine.reduce(submitting, {
      type: 'REJECT',
      requestId: 1,
      error: nonRetryableError,
    });

    expect(machine.reduce(failed, { type: 'RETRY' })).toBe(failed);
  });

  it('failed + RESOLVE or REJECT (any requestId) -> ignored (returns same state reference)', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );
    const failed = machine.reduce(submitting, {
      type: 'REJECT',
      requestId: 1,
      error: retryableError,
    });

    expect(machine.reduce(failed, { type: 'RESOLVE', requestId: 1, result })).toBe(failed);
    expect(machine.reduce(failed, { type: 'RESOLVE', requestId: 2, result })).toBe(failed);
    expect(machine.reduce(failed, { type: 'REJECT', requestId: 1, error: retryableError })).toBe(
      failed,
    );
  });

  it('failed + RESET -> idle', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );
    const failed = machine.reduce(submitting, {
      type: 'REJECT',
      requestId: 1,
      error: retryableError,
    });

    const resetState = machine.reduce(failed, { type: 'RESET' });
    expect(resetState).toEqual({ status: 'idle' });
  });

  it('failed + SUBMIT -> ignored (must RESET or RETRY first)', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );
    const failed = machine.reduce(submitting, {
      type: 'REJECT',
      requestId: 1,
      error: retryableError,
    });

    const next = machine.reduce(failed, {
      type: 'SUBMIT',
      input: { amount: 50 },
      idempotencyKey: 'key-2',
    });
    expect(next).toBe(failed);
  });

  it('succeeded + RESET -> idle', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );
    const succeeded = machine.reduce(submitting, {
      type: 'RESOLVE',
      requestId: 1,
      result,
    });

    expect(machine.reduce(succeeded, { type: 'RESET' })).toEqual({ status: 'idle' });
  });

  it('succeeded + SUBMIT, RETRY, RESOLVE, REJECT -> ignored (returns same state reference)', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const submitting = machine.reduce(
      { status: 'idle' },
      { type: 'SUBMIT', input, idempotencyKey: 'key-1' },
    );
    const succeeded = machine.reduce(submitting, {
      type: 'RESOLVE',
      requestId: 1,
      result,
    });

    expect(
      machine.reduce(succeeded, {
        type: 'SUBMIT',
        input: { amount: 300 },
        idempotencyKey: 'key-3',
      }),
    ).toBe(succeeded);
    expect(machine.reduce(succeeded, { type: 'RETRY' })).toBe(succeeded);
    expect(machine.reduce(succeeded, { type: 'RESOLVE', requestId: 1, result })).toBe(succeeded);
    expect(machine.reduce(succeeded, { type: 'REJECT', requestId: 1, error: retryableError })).toBe(
      succeeded,
    );
  });

  it('idle + anything except SUBMIT -> ignored (returns same state reference)', () => {
    const machine = createSubmitMachine<TestInput, TestOutput>();
    const idle: SubmitState<TestInput, TestOutput> = { status: 'idle' };

    expect(machine.reduce(idle, { type: 'RETRY' })).toBe(idle);
    expect(machine.reduce(idle, { type: 'RESOLVE', requestId: 1, result })).toBe(idle);
    expect(machine.reduce(idle, { type: 'REJECT', requestId: 1, error: retryableError })).toBe(
      idle,
    );
    expect(machine.reduce(idle, { type: 'RESET' })).toBe(idle);
  });
});
