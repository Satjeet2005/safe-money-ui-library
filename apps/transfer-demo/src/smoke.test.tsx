import { render, screen } from '@testing-library/react';

function SmokeComponent() {
  return (
    <main>
      <h1>Northwind Pay Smoke Test</h1>
      <p>Transfer demo test environment is operational.</p>
    </main>
  );
}

describe('transfer-demo test environment smoke test', () => {
  it('renders React JSX into jsdom and asserts with jest-dom', () => {
    render(<SmokeComponent />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Northwind Pay Smoke Test');
    expect(screen.getByText('Transfer demo test environment is operational.')).toBeInTheDocument();
  });
});
