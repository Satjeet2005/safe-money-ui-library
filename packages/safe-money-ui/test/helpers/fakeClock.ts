export interface Clock {
  now(): number;
}

export interface FakeClock extends Clock {
  set(time: number): void;
  advance(ms: number): void;
}

export function createFakeClock(initialTime = 0): FakeClock {
  let currentTime = initialTime;

  return {
    now(): number {
      return currentTime;
    },

    set(time: number): void {
      currentTime = time;
    },

    advance(ms: number): void {
      if (ms < 0) {
        throw new Error('Cannot advance backwards in time');
      }
      currentTime += ms;
    },
  };
}
