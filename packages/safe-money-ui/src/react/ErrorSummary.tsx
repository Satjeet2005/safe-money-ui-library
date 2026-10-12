import type { JSX } from 'react';

export type ErrorSummaryProps = Readonly<{
  id: string;
  title: string;
  errors: ReadonlyArray<{ fieldId: string; message: string }>;
  focusKey: number;
}>;

/**
 * Accessible ErrorSummary component for form validation announcements.
 * @example <ErrorSummary id="summary" title="Errors" errors={errs} focusKey={1} />
 */
export function ErrorSummary(props: ErrorSummaryProps): JSX.Element | null {
  if (props.errors.length === 0) {
    return null;
  }

  return (
    <div id={props.id} role="alert" tabIndex={-1} className="smu-error-summary">
      <h2>{props.title}</h2>
      <ul>
        {props.errors.map((err) => (
          <li key={err.fieldId}>
            <a href={`#${err.fieldId}`}>{err.message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
