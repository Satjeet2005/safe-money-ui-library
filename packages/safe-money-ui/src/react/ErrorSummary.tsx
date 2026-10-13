import React, { useRef, useEffect, type JSX } from 'react';

export type ErrorSummaryProps = Readonly<{
  id: string;
  title: string;
  errors: ReadonlyArray<{ fieldId: string; message: string }>;
  focusKey: number;
}>;

/**
 * Accessible ErrorSummary component announcing form validation errors.
 * @example
 * ```tsx
 * <ErrorSummary
 *   id="error-summary"
 *   title="Fix 2 problems to continue"
 *   errors={[{ fieldId: 'amount', message: 'Enter an amount.' }]}
 *   focusKey={1}
 * />
 * ```
 */
export function ErrorSummary(props: ErrorSummaryProps): JSX.Element | null {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevFocusKeyRef = useRef<number | null>(null);

  useEffect(() => {
    if (props.errors.length > 0 && prevFocusKeyRef.current !== props.focusKey) {
      prevFocusKeyRef.current = props.focusKey;
      containerRef.current?.focus();
    }
  }, [props.focusKey, props.errors.length]);

  if (props.errors.length === 0) {
    return null;
  }

  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, fieldId: string) => {
    event.preventDefault();
    const targetElement = document.getElementById(fieldId);
    targetElement?.focus();
  };

  return (
    <div id={props.id} role="alert" tabIndex={-1} ref={containerRef} className="smu-error-summary">
      <h2 className="smu-error-summary-title">{props.title}</h2>
      <ul className="smu-error-summary-list">
        {props.errors.map((err) => (
          <li key={err.fieldId} className="smu-error-summary-item">
            <a
              href={`#${err.fieldId}`}
              onClick={(e) => {
                handleLinkClick(e, err.fieldId);
              }}
              className="smu-error-summary-link"
            >
              {err.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
