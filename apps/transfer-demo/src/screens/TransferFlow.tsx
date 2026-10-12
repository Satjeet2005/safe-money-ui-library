import type { JSX } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store.js';
import { SendForm } from './SendForm.js';
import { Review } from './Review.js';
import { Result } from './Result.js';

export function TransferFlow(): JSX.Element {
  const step = useSelector((state: RootState) => state.flow.step);

  switch (step) {
    case 'form':
      return <SendForm />;
    case 'review':
      return <Review />;
    case 'result':
      return <Result />;
  }
}
