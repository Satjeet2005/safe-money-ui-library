import { createSubmitController, type ControllerEvent } from '../../src/submit/controller.js';
import { SubmitRejection } from '../../src/submit/errors.js';
import { createFakeScheduler } from '../helpers/fakeScheduler.js';
import { createDeferred } from '../helpers/deferred.js';

describe('Submit Controller (PRD §9.3 & Action Plan CT-01..CT-09)', () => {
  type TestIn = { amount: number };
  type TestOut = { id: string; status: string };

  const defaultParse = (raw: unknown) => {
    if (raw && typeof raw === 'object' && 'id' in raw) {
      return { ok: true as const, value: raw as TestOut };
    }
    return { ok: false as const, message: 'Bad response payload' };
  };

  // CT-01: submit(input) in idle -> dispatches SUBMIT, calls run with newKey(), in-flight state is submitting
  test('CT-01: submit(input) in idle transitions to submitting, calls run with newKey and idempotency token', async () => {
    const scheduler = createFakeScheduler();
    const deferred = createDeferred<unknown>();
    let keySeq = 1;
    const newKey = () => `key-${keySeq++}`;
    let runCall: {
      input: TestIn;
      ctx: { signal: AbortSignal; idempotencyKey: string; attempt: number };
    } | null = null;

    const controller = createSubmitController<TestIn, TestOut>({
      run: (input, ctx) => {
        runCall = { input, ctx };
        return deferred.promise;
      },
      parseResponse: defaultParse,
      newKey,
      scheduler,
    });

    expect(controller.getState()).toEqual({ status: 'idle' });

    controller.submit({ amount: 100 });

    const state = controller.getState();
    expect(state.status).toBe('submitting');
    if (state.status === 'submitting') {
      expect(state.input).toEqual({ amount: 100 });
      expect(state.idempotencyKey).toBe('key-1');
      expect(state.attempt).toBe(1);
      expect(state.requestId).toBe(1);
    }
    expect(runCall).not.toBeNull();
    expect(runCall!.input).toEqual({ amount: 100 });
    expect(runCall!.ctx.idempotencyKey).toBe('key-1');
    expect(runCall!.ctx.attempt).toBe(1);
    expect(runCall!.ctx.signal.aborted).toBe(false);
  });

  // CT-02: Double submit while in-flight -> ignored, run() not called a second time
  test('CT-02: Double submit while in-flight is ignored and run() is not called again', async () => {
    const scheduler = createFakeScheduler();
    const deferred = createDeferred<unknown>();
    let runCount = 0;
    const events: ControllerEvent[] = [];

    const controller = createSubmitController<TestIn, TestOut>({
      run: () => {
        runCount++;
        return deferred.promise;
      },
      parseResponse: defaultParse,
      newKey: () => 'key-fixed',
      scheduler,
      onEvent: (e) => events.push(e),
    });

    controller.submit({ amount: 50 });
    expect(runCount).toBe(1);
    const stateBefore = controller.getState();

    // Call submit again while in-flight
    controller.submit({ amount: 999 });
    expect(runCount).toBe(1);
    expect(controller.getState()).toBe(stateBefore);
    expect(events.some((e) => e.type === 'duplicate_ignored')).toBe(true);
  });

  // CT-03: Successful run() -> parsed, dispatches RESOLVE, state is succeeded
  test('CT-03: Successful run() is parsed and transitions controller state to succeeded', async () => {
    const scheduler = createFakeScheduler();
    const deferred = createDeferred<unknown>();

    const controller = createSubmitController<TestIn, TestOut>({
      run: () => deferred.promise,
      parseResponse: defaultParse,
      newKey: () => 'key-1',
      scheduler,
    });

    controller.submit({ amount: 200 });
    expect(controller.getState().status).toBe('submitting');

    deferred.resolve({ id: 'tx-123', status: 'CONFIRMED' });
    await Promise.resolve(); // flush microtask

    const state = controller.getState();
    expect(state.status).toBe('succeeded');
    if (state.status === 'succeeded') {
      expect(state.idempotencyKey).toBe('key-1');
      expect(state.result).toEqual({ id: 'tx-123', status: 'CONFIRMED' });
    }
  });

  // CT-04: Timeout fires -> aborts signal, dispatches REJECT with kind='timeout' and retryable=true
  test('CT-04: Timeout fires, aborting signal and transitioning state to failed with kind timeout', async () => {
    const scheduler = createFakeScheduler();
    const deferred = createDeferred<unknown>();
    let capturedSignal: AbortSignal | null = null;

    const controller = createSubmitController<TestIn, TestOut>({
      run: (_input, ctx) => {
        capturedSignal = ctx.signal;
        return deferred.promise;
      },
      parseResponse: defaultParse,
      newKey: () => 'key-1',
      timeoutMs: 5000,
      scheduler,
    });

    controller.submit({ amount: 300 });
    expect(capturedSignal!.aborted).toBe(false);

    // Advance scheduler past timeout
    scheduler.advance(5000);
    await Promise.resolve();

    expect(capturedSignal!.aborted).toBe(true);
    const state = controller.getState();
    expect(state.status).toBe('failed');
    if (state.status === 'failed') {
      expect(state.error.kind).toBe('timeout');
      expect(state.error.retryable).toBe(true);
      expect(state.input).toEqual({ amount: 300 });
      expect(state.idempotencyKey).toBe('key-1');
    }
  });

  // CT-05: Late resolution after timeout -> ignored, state remains failed
  test('CT-05: Late resolution after timeout is ignored and state remains failed', async () => {
    const scheduler = createFakeScheduler();
    const deferred = createDeferred<unknown>();
    const events: ControllerEvent[] = [];

    const controller = createSubmitController<TestIn, TestOut>({
      run: () => deferred.promise,
      parseResponse: defaultParse,
      newKey: () => 'key-1',
      timeoutMs: 3000,
      scheduler,
      onEvent: (e) => events.push(e),
    });

    controller.submit({ amount: 400 });
    scheduler.advance(3000);
    await Promise.resolve();

    expect(controller.getState().status).toBe('failed');
    const failedState = controller.getState();

    // Late resolution
    deferred.resolve({ id: 'late-tx', status: 'OK' });
    await Promise.resolve();

    expect(controller.getState()).toBe(failedState);
    expect(events.some((e) => e.type === 'stale_ignored')).toBe(true);
  });

  // CT-06: Network error -> REJECT with kind='network', retryable=true
  test('CT-06: Generic network rejection produces failed state with kind network and retryable true', async () => {
    const scheduler = createFakeScheduler();
    const deferred = createDeferred<unknown>();

    const controller = createSubmitController<TestIn, TestOut>({
      run: () => deferred.promise,
      parseResponse: defaultParse,
      newKey: () => 'key-1',
      scheduler,
      networkMessage: 'Custom network failure',
    });

    controller.submit({ amount: 500 });
    deferred.reject(new Error('Connection reset by peer'));
    await Promise.resolve();

    const state = controller.getState();
    expect(state.status).toBe('failed');
    if (state.status === 'failed') {
      expect(state.error.kind).toBe('network');
      expect(state.error.retryable).toBe(true);
      expect(state.error.message).toBe('Custom network failure');
    }
  });

  // CT-07: Business rejection (SubmitRejection) -> REJECT with kind='rejected', code and retryable from error
  test('CT-07: Business SubmitRejection preserves code and retryable flag', async () => {
    const scheduler = createFakeScheduler();
    const deferred = createDeferred<unknown>();

    const controller = createSubmitController<TestIn, TestOut>({
      run: () => deferred.promise,
      parseResponse: defaultParse,
      newKey: () => 'key-1',
      scheduler,
    });

    controller.submit({ amount: 600 });
    deferred.reject(new SubmitRejection('Insufficient balance', 'INSUFFICIENT_FUNDS', false));
    await Promise.resolve();

    const state = controller.getState();
    expect(state.status).toBe('failed');
    if (state.status === 'failed') {
      expect(state.error.kind).toBe('rejected');
      expect(state.error.code).toBe('INSUFFICIENT_FUNDS');
      expect(state.error.retryable).toBe(false);
      expect(state.error.message).toBe('Insufficient balance');
    }
  });

  // CT-08: retry() reuses idempotencyKey and input, increments attempt, does NOT call newKey()
  test('CT-08: retry() reuses idempotencyKey, increments attempt, does not call newKey', async () => {
    const scheduler = createFakeScheduler();
    let d1 = createDeferred<unknown>();
    let keyCallCount = 0;
    const newKey = () => {
      keyCallCount++;
      return `key-${keyCallCount}`;
    };

    let lastCtx: { idempotencyKey: string; attempt: number } | null = null;

    const controller = createSubmitController<TestIn, TestOut>({
      run: (_input, ctx) => {
        lastCtx = ctx;
        return d1.promise;
      },
      parseResponse: defaultParse,
      newKey,
      scheduler,
    });

    controller.submit({ amount: 700 });
    expect(keyCallCount).toBe(1);
    expect(lastCtx!.attempt).toBe(1);
    expect(lastCtx!.idempotencyKey).toBe('key-1');

    // Fail first attempt with retryable network error
    d1.reject(new Error('fail'));
    await Promise.resolve();
    expect(controller.getState().status).toBe('failed');

    // Retry
    d1 = createDeferred<unknown>();
    controller.retry();

    expect(keyCallCount).toBe(1); // newKey NOT called
    const state = controller.getState();
    expect(state.status).toBe('submitting');
    if (state.status === 'submitting') {
      expect(state.attempt).toBe(2);
      expect(state.idempotencyKey).toBe('key-1');
      expect(state.input).toEqual({ amount: 700 });
    }
    expect(lastCtx!.attempt).toBe(2);
    expect(lastCtx!.idempotencyKey).toBe('key-1');
  });

  // CT-09: dispose() aborts in-flight signal, clears timer, stops listener notifications
  test('CT-09: dispose() aborts in-flight request, clears scheduler timer, and prevents listener notifications', async () => {
    const scheduler = createFakeScheduler();
    const deferred = createDeferred<unknown>();
    let capturedSignal: AbortSignal | null = null;
    let listenerNotifications = 0;

    const controller = createSubmitController<TestIn, TestOut>({
      run: (_input, ctx) => {
        capturedSignal = ctx.signal;
        return deferred.promise;
      },
      parseResponse: defaultParse,
      newKey: () => 'key-1',
      timeoutMs: 10000,
      scheduler,
    });

    controller.subscribe(() => {
      listenerNotifications++;
    });

    controller.submit({ amount: 800 });
    expect(listenerNotifications).toBe(1);
    expect(capturedSignal!.aborted).toBe(false);
    expect(scheduler.pendingCount()).toBe(1);

    controller.dispose();

    expect(capturedSignal!.aborted).toBe(true);
    expect(scheduler.pendingCount()).toBe(0);

    // Any subsequent resolve/reject or calls have no effect on listeners
    deferred.resolve({ id: 'ok' });
    await Promise.resolve();
    expect(listenerNotifications).toBe(1);

    controller.submit({ amount: 900 });
    expect(listenerNotifications).toBe(1);
  });
});
