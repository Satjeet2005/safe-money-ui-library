import type { Clock } from '@satjeet2005/safe-money-ui/submit';

export const systemClock: Clock = {
  now: () => Date.now(),
};
