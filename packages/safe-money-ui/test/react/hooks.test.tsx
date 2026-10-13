import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useSafeSubmit } from '../../src/react/useSafeSubmit.js';
import { useReviewGuard } from '../../src/react/useReviewGuard.js';
import { createDeferred } from '../helpers/deferred.js';

type TestInput = { amount: number };
type TestOutput = { id: string };

describe('useSafeSubmit (HK-01..HK-04)', () => {
  it('HK-01: initial hook state is idle', () => {
    let capturedState: unknown;
    function Consumer() {
      const { state } = useSafeSubmit<TestInput, TestOutput>({
        run: jest.fn(),
        parseResponse: jest.fn(),
        newKey: () => 'key-1',
      });
      capturedState = state;
      return <div>Status: {state.status}</div>;
    }

    render(<Consumer />);
    expect(capturedState).toEqual({ status: 'idle' });
    expect(screen.getByText('Status: idle')).toBeInTheDocument();
  });

  it('HK-02: controller state changes cause React consumers to rerender', async () => {
    const deferred = createDeferred<unknown>();
    const run = jest.fn().mockReturnValue(deferred.promise);
    const parseResponse = jest.fn().mockReturnValue({ ok: true, value: { id: 'TRF-1' } });

    let submitFn: (input: TestInput) => void = () => {};

    function Consumer() {
      const { state, submit } = useSafeSubmit<TestInput, TestOutput>({
        run,
        parseResponse,
        newKey: () => 'key-1',
      });
      submitFn = submit;
      return <div data-testid="status">{state.status}</div>;
    }

    render(<Consumer />);
    expect(screen.getByTestId('status')).toHaveTextContent('idle');

    act(() => {
      submitFn({ amount: 100 });
    });
    expect(screen.getByTestId('status')).toHaveTextContent('submitting');

    await act(async () => {
      deferred.resolve({ id: 'TRF-1' });
    });
    expect(screen.getByTestId('status')).toHaveTextContent('succeeded');
  });

  it('HK-03: unmount disposes the controller so no timers, listeners, or state updates survive', () => {
    jest.useFakeTimers();
    try {
      const run = jest.fn().mockImplementation(() => new Promise(() => {}));

      function Consumer() {
        const { submit } = useSafeSubmit<TestInput, TestOutput>({
          run,
          parseResponse: jest.fn(),
          newKey: () => 'key-1',
          timeoutMs: 5000,
        });

        React.useEffect(() => {
          submit({ amount: 50 });
        }, [submit]);

        return <div>Submitting</div>;
      }

      const { unmount } = render(<Consumer />);
      expect(run).toHaveBeenCalledTimes(1);

      // Unmounting must dispose the controller and clear active timers
      unmount();

      // Advancing timer past timeout should not cause any warning or state update on unmounted component
      act(() => {
        jest.advanceTimersByTime(10000);
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it('HK-04: uses the latest run and parseResponse callbacks across rerenders with new closures', async () => {
    const deferred = createDeferred<unknown>();
    const runV1 = jest.fn();
    const runV2 = jest.fn().mockReturnValue(deferred.promise);

    function Consumer({ version }: { version: number }) {
      const { submit } = useSafeSubmit<TestInput, TestOutput>({
        run: version === 1 ? runV1 : runV2,
        parseResponse: () => ({ ok: true, value: { id: 'TRF-2' } }),
        newKey: () => 'key-2',
      });

      return (
        <button
          type="button"
          onClick={() => {
            submit({ amount: 200 });
          }}
        >
          Submit
        </button>
      );
    }

    const { rerender } = render(<Consumer version={1} />);
    rerender(<Consumer version={2} />);

    act(() => {
      screen.getByRole('button').click();
    });

    expect(runV1).not.toHaveBeenCalled();
    expect(runV2).toHaveBeenCalledTimes(1);

    await act(async () => {
      deferred.resolve({ id: 'TRF-2' });
    });
  });
});

describe('useReviewGuard', () => {
  it('returns a stable guard instance across component rerenders', () => {
    const guardInstances: unknown[] = [];

    function Consumer({ count }: { count: number }) {
      const guard = useReviewGuard<{ amount: number }>();
      guardInstances.push(guard);
      return <div>Render {count}</div>;
    }

    const { rerender } = render(<Consumer count={1} />);
    rerender(<Consumer count={2} />);
    rerender(<Consumer count={3} />);

    expect(guardInstances).toHaveLength(3);
    expect(guardInstances[0]).toBe(guardInstances[1]);
    expect(guardInstances[1]).toBe(guardInstances[2]);
  });
});
