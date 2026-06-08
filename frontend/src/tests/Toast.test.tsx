import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastContainer } from '../components/ui/Toast';

describe('ToastContainer', () => {
  it('renders nothing when no toasts', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onDismiss={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders error toast with message', () => {
    render(
      <ToastContainer
        toasts={[{ id: 1, message: 'Network error', type: 'error' }]}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('renders success toast', () => {
    render(
      <ToastContainer
        toasts={[{ id: 2, message: 'Transfer successful!', type: 'success' }]}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText('Transfer successful!')).toBeInTheDocument();
  });

  it('calls onDismiss when X clicked', () => {
    const onDismiss = vi.fn();
    render(
      <ToastContainer
        toasts={[{ id: 3, message: 'Test', type: 'info' }]}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onDismiss).toHaveBeenCalledWith(3);
  });

  it('renders multiple toasts', () => {
    render(
      <ToastContainer
        toasts={[
          { id: 1, message: 'First error', type: 'error' },
          { id: 2, message: 'Second warning', type: 'warning' },
        ]}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText('First error')).toBeInTheDocument();
    expect(screen.getByText('Second warning')).toBeInTheDocument();
  });
});
