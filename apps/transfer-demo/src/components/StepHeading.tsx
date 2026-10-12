import type { JSX } from 'react';

export type StepHeadingProps = {
  title: string;
};

export function StepHeading({ title }: StepHeadingProps): JSX.Element {
  return (
    <h1 tabIndex={-1} className="step-heading">
      {title}
    </h1>
  );
}
