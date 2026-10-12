export interface Scheduler {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface FakeScheduler extends Scheduler {
  now(): number;
  advance(ms: number): void;
  pendingCount(): number;
  clearAll(): void;
}

interface ScheduledTask {
  id: number;
  fn: () => void;
  dueTime: number;
}

export function createFakeScheduler(initialTime = 0): FakeScheduler {
  let currentTime = initialTime;
  let nextId = 1;
  const tasks = new Map<number, ScheduledTask>();

  return {
    setTimeout(fn: () => void, ms: number): number {
      const id = nextId++;
      const delay = Math.max(0, ms);
      tasks.set(id, {
        id,
        fn,
        dueTime: currentTime + delay,
      });
      return id;
    },

    clearTimeout(handle: unknown): void {
      if (typeof handle === 'number') {
        tasks.delete(handle);
      }
    },

    now(): number {
      return currentTime;
    },

    pendingCount(): number {
      return tasks.size;
    },

    clearAll(): void {
      tasks.clear();
    },

    advance(ms: number): void {
      if (ms < 0) {
        throw new Error('Cannot advance backwards in time');
      }
      const targetTime = currentTime + ms;

      while (true) {
        let earliest: ScheduledTask | null = null;
        for (const task of tasks.values()) {
          if (task.dueTime <= targetTime) {
            if (
              !earliest ||
              task.dueTime < earliest.dueTime ||
              (task.dueTime === earliest.dueTime && task.id < earliest.id)
            ) {
              earliest = task;
            }
          }
        }

        if (!earliest) {
          break;
        }

        tasks.delete(earliest.id);
        currentTime = earliest.dueTime;
        earliest.fn();
      }

      currentTime = targetTime;
    },
  };
}
