import { useEffect, useRef, type JSX } from 'react';

export type StepHeadingProps = {
  title: string;
};

/**
 * Step heading that receives focus on arrival (tabindex="-1").
 * @example
 * ```tsx
 * <StepHeading title="Send money" />
 * ```
 */
export function StepHeading({ title }: StepHeadingProps): JSX.Element {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [title]);

  return (
    <h1 ref={headingRef} tabIndex={-1} className="step-heading">
      {title}
    </h1>
  );
}
