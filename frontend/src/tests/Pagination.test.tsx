import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../components/ui/Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    itemsPerPage: 10,
    onPageChange: vi.fn(),
  };

  it('renders item count correctly', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText(/1–10/)).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('disables First and Prev on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    expect(screen.getByTitle('First page')).toBeDisabled();
    expect(screen.getByTitle('Previous page')).toBeDisabled();
  });

  it('disables Next and Last on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    expect(screen.getByTitle('Next page')).toBeDisabled();
    expect(screen.getByTitle('Last page')).toBeDisabled();
  });

  it('calls onPageChange with correct page on number click', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with last page on Last button', () => {
    const onPageChange = vi.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByTitle('Last page'));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('renders per-page selector when handler provided', () => {
    render(
      <Pagination
        {...defaultProps}
        onItemsPerPageChange={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
  });

  it('returns null when totalItems is 0', () => {
    const { container } = render(
      <Pagination {...defaultProps} totalItems={0} />
    );
    expect(container.firstChild).toBeNull();
  });
});
