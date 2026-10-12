import type { JSX } from 'react';

export function ChaosPanel(): JSX.Element {
  return (
    <section id="chaos-panel" aria-labelledby="chaos-heading">
      <h2 id="chaos-heading">Chaos mode</h2>
      <p>These switches change the simulated server so you can try to break the app.</p>
    </section>
  );
}
