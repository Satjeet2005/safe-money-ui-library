import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MoneyInput, type MoneyInputProps } from '../../src/react/MoneyInput.js';
import type { CurrencyCode, ParseError, ParseErrorCode } from '../../src/money/types.js';

const testMessages: Record<
  ParseErrorCode,
  (ctx: ParseError & { currency: CurrencyCode }) => string
> = {
  EMPTY: () => 'Enter an amount.',
  NOT_A_NUMBER: () => 'Use digits only.',
  NEGATIVE_NOT_ALLOWED: () => 'Amount cannot be negative.',
  MULTIPLE_DECIMAL_SEPARATORS: () => 'Use only one decimal separator.',
  INVALID_GROUPING: () => 'Thousands separators are in the wrong place.',
  TOO_MANY_DECIMALS: (ctx) =>
    `${ctx.currency} allows up to ${'maxDecimals' in ctx ? ctx.maxDecimals : 2} decimals.`,
  ZERO_NOT_ALLOWED: () => 'Amount must be more than zero.',
  BELOW_MIN: (ctx) => `Minimum is ${'limit' in ctx ? ctx.limit : 0}.`,
  ABOVE_MAX: (ctx) => `Maximum is ${'limit' in ctx ? ctx.limit : 0}.`,
  UNSAFE_MAGNITUDE: () => 'That number is too large.',
};

function defaultProps(overrides: Partial<MoneyInputProps> = {}): MoneyInputProps {
  return {
    id: 'test-amount',
    label: 'Send amount',
    currency: 'USD',
    locale: 'en-US',
    value: '',
    onChange: jest.fn(),
    messages: testMessages,
    ...overrides,
  };
}

describe('MoneyInput (MI-01..MI-10)', () => {
  it('MI-01: renders visible associated label and controlled input with type="text", autocomplete="off", spellcheck="false"', () => {
    render(<MoneyInput {...defaultProps({ value: '100' })} />);

    const label = screen.getByText('Send amount');
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', 'test-amount');

    const input = screen.getByLabelText('Send amount');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id', 'test-amount');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).not.toHaveAttribute('type', 'number');
    expect(input).toHaveAttribute('autocomplete', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
    expect(input).toHaveValue('100');
  });

  it('MI-02: sets inputMode="decimal" for decimal currencies and "numeric" for non-decimal currencies (JPY)', () => {
    const { rerender } = render(<MoneyInput {...defaultProps({ currency: 'USD' })} />);
    const input = screen.getByLabelText('Send amount');
    expect(input).toHaveAttribute('inputmode', 'decimal');

    rerender(<MoneyInput {...defaultProps({ currency: 'EUR' })} />);
    expect(input).toHaveAttribute('inputmode', 'decimal');

    rerender(<MoneyInput {...defaultProps({ currency: 'JPY' })} />);
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('MI-03: calls onChange with raw unnormalized text and fresh parse result on typing/paste', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<MoneyInput {...defaultProps({ value: '', onChange })} />);

    const input = screen.getByLabelText('Send amount');
    await user.type(input, '12.34');

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[0].text).toBe('4');
    expect(lastCall[0].result).toBeDefined();

    // Pasting raw text calls onChange without rewriting
    onChange.mockClear();
    fireEvent.change(input, { target: { value: '   50.00  ' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        text: '   50.00  ',
        result: expect.objectContaining({ ok: true }),
      }),
    );
  });

  it('MI-04: formats text on blur if valid; leaves invalid text untouched', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <MoneyInput {...defaultProps({ value: '1234.5', locale: 'en-US', onChange })} />,
    );

    const input = screen.getByLabelText('Send amount');
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        text: '1,234.50',
        result: expect.objectContaining({ ok: true }),
      }),
    );

    // When value is invalid, text remains untouched on blur
    onChange.mockClear();
    rerender(<MoneyInput {...defaultProps({ value: 'abc', onChange })} />);
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('MI-05: shows errors only after first blur or when showErrors=true; parse errors take precedence over externalError', () => {
    const { rerender } = render(
      <MoneyInput
        {...defaultProps({
          value: 'abc',
          externalError: 'External balance error',
          showErrors: false,
        })}
      />,
    );

    const input = screen.getByLabelText('Send amount');
    expect(screen.queryByText('Use digits only.')).not.toBeInTheDocument();
    expect(screen.queryByText('External balance error')).not.toBeInTheDocument();

    // Blur reveals error; parse error takes precedence over externalError
    fireEvent.blur(input);
    expect(screen.getByText('Use digits only.')).toBeInTheDocument();
    expect(screen.queryByText('External balance error')).not.toBeInTheDocument();

    // When showErrors is true, error is shown immediately without blur
    rerender(
      <MoneyInput
        {...defaultProps({
          value: '100',
          externalError: 'Not enough funds',
          showErrors: true,
        })}
      />,
    );
    expect(screen.getByText('Not enough funds')).toBeInTheDocument();
  });

  it('MI-06: manages aria-invalid and orders aria-describedby as error, hint, preview', () => {
    const { rerender } = render(
      <MoneyInput
        {...defaultProps({
          value: '100',
          hint: 'Enter between $1 and $10,000',
          previewLabel: (fmt) => `You send ${fmt}`,
          showErrors: false,
        })}
      />,
    );

    const input = screen.getByLabelText('Send amount');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAttribute('aria-describedby', 'test-amount-hint test-amount-preview');

    // With visible error, aria-invalid="true" and error is listed first in aria-describedby
    rerender(
      <MoneyInput
        {...defaultProps({
          value: 'invalid',
          hint: 'Enter between $1 and $10,000',
          previewLabel: (fmt) => `You send ${fmt}`,
          showErrors: true,
        })}
      />,
    );

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'test-amount-error test-amount-hint');
  });

  it('MI-07: renders error element as <p id="${id}-error"> without a role attribute', () => {
    render(<MoneyInput {...defaultProps({ value: 'bad', showErrors: true })} />);

    const error = document.getElementById('test-amount-error');
    expect(error).not.toBeNull();
    expect(error?.tagName.toLowerCase()).toBe('p');
    expect(error).not.toHaveAttribute('role');
  });

  it('MI-08: renders preview element with aria-live="polite" only when text is non-empty and valid; removes it otherwise', () => {
    const { rerender } = render(
      <MoneyInput
        {...defaultProps({
          value: '250',
          previewLabel: (fmt) => `You send ${fmt}`,
        })}
      />,
    );

    let preview = document.getElementById('test-amount-preview');
    expect(preview).not.toBeNull();
    expect(preview).toHaveAttribute('aria-live', 'polite');
    expect(preview).toHaveTextContent('You send $250.00');

    // Empty text removes preview from DOM
    rerender(
      <MoneyInput
        {...defaultProps({
          value: '',
          previewLabel: (fmt) => `You send ${fmt}`,
        })}
      />,
    );
    preview = document.getElementById('test-amount-preview');
    expect(preview).toBeNull();

    // Invalid text removes preview from DOM
    rerender(
      <MoneyInput
        {...defaultProps({
          value: 'xyz',
          previewLabel: (fmt) => `You send ${fmt}`,
        })}
      />,
    );
    preview = document.getElementById('test-amount-preview');
    expect(preview).toBeNull();
  });

  it('MI-09: changing currency or locale re-runs parseAmount on current text without altering text', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <MoneyInput
        {...defaultProps({
          value: '1.234',
          currency: 'USD',
          locale: 'en-US',
          onChange,
        })}
      />,
    );

    // Mount should not call onChange unnecessarily
    expect(onChange).not.toHaveBeenCalled();

    // Change locale to de-DE: '1.234' is 1,234 in German
    rerender(
      <MoneyInput
        {...defaultProps({
          value: '1.234',
          currency: 'USD',
          locale: 'de-DE',
          onChange,
        })}
      />,
    );

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        text: '1.234',
        result: expect.objectContaining({ ok: true }),
      }),
    );
  });

  it('MI-10: disabled sets native disabled attribute and suppresses edit, blur, and prop-change callbacks', () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <MoneyInput
        {...defaultProps({
          value: '100',
          disabled: true,
          onChange,
        })}
      />,
    );

    const input = screen.getByLabelText('Send amount');
    expect(input).toBeDisabled();

    // Blur does not call onChange
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();

    // Prop change does not call onChange
    rerender(
      <MoneyInput
        {...defaultProps({
          value: '100',
          currency: 'EUR',
          disabled: true,
          onChange,
        })}
      />,
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  describe('A11Y-03: MoneyInput alone', () => {
    const AXE_OPTIONS = {
      runOnly: {
        type: 'tag' as const,
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
      rules: {
        // Disable color-contrast in jsdom as specified by PRD §15.2 (jsdom has no layout/rendering engine)
        'color-contrast': { enabled: false },
      },
    };

    it('A11Y-03: default MoneyInput has zero axe violations', async () => {
      const { container } = render(<MoneyInput {...defaultProps()} />);
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });

    it('A11Y-03: MoneyInput with hint has zero axe violations', async () => {
      const { container } = render(
        <MoneyInput {...defaultProps({ hint: 'Enter an amount between 1 and 1000' })} />,
      );
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });

    it('A11Y-03: MoneyInput with parse error has zero axe violations', async () => {
      const { container } = render(
        <MoneyInput {...defaultProps({ value: 'invalid', showErrors: true })} />,
      );
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });

    it('A11Y-03: MoneyInput with external error has zero axe violations', async () => {
      const { container } = render(
        <MoneyInput
          {...defaultProps({
            externalError: 'Insufficient funds in selected account',
            showErrors: true,
          })}
        />,
      );
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });

    it('A11Y-03: disabled MoneyInput has zero axe violations', async () => {
      const { container } = render(
        <MoneyInput {...defaultProps({ disabled: true, value: '100' })} />,
      );
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });
  });
});
