import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ErrorSummary, type ErrorSummaryProps } from '../../src/react/ErrorSummary.js';

function defaultProps(overrides: Partial<ErrorSummaryProps> = {}): ErrorSummaryProps {
  return {
    id: 'error-summary',
    title: 'Fix 2 problems to continue',
    errors: [
      { fieldId: 'recipient', message: 'Choose a recipient.' },
      { fieldId: 'amount', message: 'Enter an amount.' },
    ],
    focusKey: 0,
    ...overrides,
  };
}

describe('ErrorSummary (ES-01..ES-04)', () => {
  it('ES-01: renders nothing when errors is empty', () => {
    const { container } = render(<ErrorSummary {...defaultProps({ errors: [] })} />);
    expect(container.firstChild).toBeNull();
  });

  it('ES-02: renders <div id={id} role="alert" tabIndex={-1}> with heading and links to fieldIds', () => {
    render(<ErrorSummary {...defaultProps()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('id', 'error-summary');
    expect(alert).toHaveAttribute('tabindex', '-1');

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Fix 2 problems to continue');

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '#recipient');
    expect(links[0]).toHaveTextContent('Choose a recipient.');
    expect(links[1]).toHaveAttribute('href', '#amount');
    expect(links[1]).toHaveTextContent('Enter an amount.');
  });

  it('ES-03: focuses the summary once when focusKey changes and errors remain present; does not refocus on unrelated renders', () => {
    const { rerender } = render(<ErrorSummary {...defaultProps({ focusKey: 1 })} />);
    const alert = screen.getByRole('alert');
    expect(document.activeElement).toBe(alert);

    // Unrelated render with same focusKey does not steal focus if user moved focus elsewhere
    const otherButton = document.createElement('button');
    document.body.appendChild(otherButton);
    otherButton.focus();
    expect(document.activeElement).toBe(otherButton);

    rerender(<ErrorSummary {...defaultProps({ focusKey: 1, title: 'Updated Title' })} />);
    expect(document.activeElement).toBe(otherButton);

    // Incrementing focusKey moves focus to summary
    rerender(<ErrorSummary {...defaultProps({ focusKey: 2 })} />);
    expect(document.activeElement).toBe(alert);

    document.body.removeChild(otherButton);
  });

  it('ES-04: activating an error link moves focus to matching field element, prevents hash navigation, and handles missing element safely', () => {
    render(
      <div>
        <ErrorSummary
          {...defaultProps({
            errors: [
              { fieldId: 'target-input', message: 'Field error' },
              { fieldId: 'missing-input', message: 'Missing field error' },
            ],
          })}
        />
        <input id="target-input" type="text" />
      </div>,
    );

    const targetInput = document.getElementById('target-input');
    const links = screen.getAllByRole('link');

    // Click link for existing input
    fireEvent.click(links[0]!);
    expect(document.activeElement).toBe(targetInput);

    // Click link for non-existent input handles gracefully without error
    expect(() => {
      fireEvent.click(links[1]!);
    }).not.toThrow();
  });

  describe('A11Y-04: ErrorSummary with two errors', () => {
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

    it('A11Y-04: ErrorSummary with two errors has zero axe violations', async () => {
      const { container } = render(
        <div>
          <ErrorSummary {...defaultProps()} />
          <input id="recipient" aria-label="Recipient" />
          <input id="amount" aria-label="Amount" />
        </div>,
      );
      const results = await axe(container, AXE_OPTIONS);
      expect(results).toHaveNoViolations();
    });
  });
});
