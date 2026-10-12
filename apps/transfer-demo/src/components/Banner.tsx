import type { JSX, ReactNode } from 'react';

export type BannerKind = 'info' | 'warning' | 'error';

export type BannerProps = {
  kind: BannerKind;
  children: ReactNode;
};

export function Banner({ kind, children }: BannerProps): JSX.Element {
  const role = kind === 'error' ? 'alert' : 'status';
  return (
    <div role={role} className={`banner banner-${kind}`}>
      {children}
    </div>
  );
}
