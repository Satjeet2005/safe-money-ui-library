import { useEffect, useRef, type JSX } from 'react';
import { useSelector, useDispatch, useStore } from 'react-redux';
import { useSafeSubmit } from '@satjeet2005/safe-money-ui/react';
import {
  SubmitRejection,
  type Clock,
  type Scheduler,
  type SubmitState,
} from '@satjeet2005/safe-money-ui/submit';
import { parseBoundary } from '@satjeet2005/safe-money-ui/boundary';
import type { RootState, AppDispatch, AppStore, ThunkExtra } from '../store/store.js';
import { goToResult, type ReviewSnapshot } from '../store/flowSlice.js';
import { SendForm } from './SendForm.js';
import { Review } from './Review.js';
import { Result } from './Result.js';
import { RejectionBody, TransferResponse } from '../service/schemas.js';
import type { MockService } from '../service/mockService.js';
import { verifyTransfer } from '../service/verifyTransfer.js';
import { createIdGenerator } from '../service/ids.js';
import { systemClock } from '../service/clock.js';
import { FIXTURES } from '../service/fixtures.js';
import { COPY } from '../copy.js';
import type { z } from 'zod';

export type TransferInput = {
  quoteId: string;
  recipientId: string;
  sourceCurrency: string;
  sourceMinor: number;
};

export type TransferResponsePayload = z.infer<typeof TransferResponse>;

export type TransferFlowProps = {
  service?: MockService | undefined;
  clock?: Clock | undefined;
  scheduler?: Scheduler | undefined;
  newKey?: (() => string) | undefined;
  onControllerStateChange?:
    ((state: SubmitState<TransferInput, TransferResponsePayload>) => void) | undefined;
};

/**
 * Executes a transfer submission against the mock service and classifies rejections.
 * @example
 * ```ts
 * const res = await executeTransferRun(service, input, ctx);
 * ```
 */
export async function executeTransferRun(
  service: MockService,
  input: TransferInput,
  ctx: { signal: AbortSignal; idempotencyKey: string; attempt: number },
): Promise<unknown> {
  const raw = await service.submitTransfer(
    {
      ...input,
      idempotencyKey: ctx.idempotencyKey,
    },
    { signal: ctx.signal },
  );

  const rejectionResult = RejectionBody.safeParse(raw);
  if (rejectionResult.success) {
    const { code, message } = rejectionResult.data.error;
    throw new SubmitRejection(message, code, code === 'SERVICE_UNAVAILABLE');
  }

  return raw;
}

/**
 * Parses and verifies transfer responses against schema and expected review snapshot.
 * @example
 * ```ts
 * const res = parseTransferResponse(raw, snapshot);
 * ```
 */
export function parseTransferResponse(
  raw: unknown,
  snapshot: ReviewSnapshot | null,
): { ok: true; value: TransferResponsePayload } | { ok: false; message: string } {
  const boundaryResult = parseBoundary('TransferResponse', TransferResponse, raw);
  if (!boundaryResult.ok) {
    return { ok: false, message: COPY['submit.invalid_response'] };
  }

  if (!snapshot || !verifyTransfer(boundaryResult.value, snapshot)) {
    return { ok: false, message: COPY['submit.invalid_response'] };
  }

  return { ok: true, value: boundaryResult.value };
}

/**
 * Resolves the idempotency key generator according to URL deterministic flag.
 * @example
 * ```ts
 * const newKey = resolveIdempotencyKeyGenerator();
 * ```
 */
export function resolveIdempotencyKeyGenerator(): () => string {
  const isDeterministic =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('deterministic') === '1';
  const ids = createIdGenerator(isDeterministic);
  return ids.idempotencyKey;
}

function useFlowController({
  service,
  scheduler,
  newKey,
  snapshot,
  onControllerStateChange,
}: {
  service: MockService;
  scheduler?: Scheduler | undefined;
  newKey?: (() => string) | undefined;
  snapshot: ReviewSnapshot | null;
  onControllerStateChange?:
    ((state: SubmitState<TransferInput, TransferResponsePayload>) => void) | undefined;
}) {
  const newKeyRef = useRef(newKey ?? resolveIdempotencyKeyGenerator());
  if (newKey) {
    newKeyRef.current = newKey;
  }

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const controller = useSafeSubmit<TransferInput, TransferResponsePayload>({
    run: (input, ctx) => executeTransferRun(service, input, ctx),
    parseResponse: (raw) => parseTransferResponse(raw, snapshotRef.current),
    newKey: () => newKeyRef.current(),
    timeoutMs: FIXTURES.SUBMIT_TIMEOUT_MS,
    ...(scheduler ? { scheduler } : {}),
    timeoutMessage: COPY['controller.timeout'],
    networkMessage: COPY['controller.network'],
    invalidResponseMessage: COPY['submit.invalid_response'],
  });

  useEffect(() => {
    onControllerStateChange?.(controller.state);
  }, [controller.state, onControllerStateChange]);

  return controller;
}

/**
 * Single owner of transfer step routing and safe-submit controller lifecycle.
 * @example
 * ```tsx
 * <TransferFlow clock={clock} service={service} />
 * ```
 */
export function TransferFlow({
  service: injectedService,
  clock: injectedClock,
  scheduler,
  newKey,
  onControllerStateChange,
}: TransferFlowProps = {}): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore() as AppStore & { extra?: ThunkExtra };
  const step = useSelector((state: RootState) => state.flow.step);
  const snapshot = useSelector((state: RootState) => state.flow.snapshot);

  const service = injectedService ?? store.extra?.service;
  if (!service) {
    throw new Error('TransferFlow requires an injected or store-provided service');
  }
  const clock = injectedClock ?? store.extra?.clock ?? systemClock;

  const {
    state: controllerState,
    submit,
    retry,
    reset,
  } = useFlowController({
    service,
    scheduler,
    newKey,
    snapshot,
    onControllerStateChange,
  });

  const prevStatusRef = useRef(controllerState.status);
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = controllerState.status;

    if (
      prevStatus === 'submitting' &&
      (controllerState.status === 'succeeded' || controllerState.status === 'failed')
    ) {
      dispatch(goToResult());
    }
  }, [controllerState.status, dispatch]);

  switch (step) {
    case 'form':
      return <SendForm />;
    case 'review':
      return (
        <Review
          onSubmit={submit}
          submitting={controllerState.status === 'submitting'}
          clock={clock}
        />
      );
    case 'result':
      return <Result state={controllerState} onRetry={retry} onReset={reset} />;
  }
}
