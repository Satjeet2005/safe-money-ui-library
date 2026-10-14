import { render, screen } from '@testing-library/react';
import { Banner } from './Banner.js';

describe('Banner component (AC-09)', () => {
  it('renders role="status" for info kind', () => {
    render(<Banner kind="info">Informational message</Banner>);
    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Informational message');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders role="status" for warning kind', () => {
    render(<Banner kind="warning">Warning message</Banner>);
    const banner = screen.getByRole('status');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Warning message');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders role="alert" for error kind', () => {
    render(<Banner kind="error">Error message</Banner>);
    const banner = screen.getByRole('alert');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveTextContent('Error message');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
