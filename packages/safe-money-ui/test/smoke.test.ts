import { createDeferred } from './helpers/deferred.js';
import { createFakeClock } from './helpers/fakeClock.js';
import { createFakeScheduler } from './helpers/fakeScheduler.js';

describe('safe-money-ui test environment smoke test', () => {
  it('executes TypeScript under Jest and SWC', () => {
    expect(1 + 1).toBe(2);
  });

  it('verifies createDeferred helper functionality', async () => {
    const deferred = createDeferred<string>();
    deferred.resolve('success');
    await expect(deferred.promise).resolves.toBe('success');
  });

  it('verifies fakeScheduler and fakeClock helpers', () => {
    const clock = createFakeClock(100);
    expect(clock.now()).toBe(100);
    clock.advance(50);
    expect(clock.now()).toBe(150);

    const scheduler = createFakeScheduler();
    let fired = false;
    scheduler.setTimeout(() => {
      fired = true;
    }, 100);
    expect(fired).toBe(false);
    scheduler.advance(100);
    expect(fired).toBe(true);
  });

  it('verifies jest-axe matcher from setup.ts', async () => {
    const { axe } = await import('jest-axe');
    const html = '<main><h1>Title</h1><p>Content</p></main>';
    const results = await axe(html);
    expect(results).toHaveNoViolations();
  });
});
