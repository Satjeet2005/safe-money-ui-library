import type { Clock } from '@satjeetsingh1/safe-money-ui/submit';

export const systemClock: Clock = {
  now: () => Date.now(),
};
