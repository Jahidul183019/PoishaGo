import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (count: number) => void;
}

const PER_PAGE_OPTIONS = [5, 10, 20, 50];

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  // Generate page number buttons (max 5 visible)
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem   = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="py-4 px-6 bg-[var(--bg-secondary)] border-t border-[var(--border)]
                    flex flex-col sm:flex-row items-center justify-between gap-3 select-none">

      {/* Left — item count info */}
      <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
        <span>
          Showing <strong className="text-[var(--text-primary)]">{startItem}–{endItem}</strong>{' '}
          of <strong className="text-[var(--text-primary)]">{totalItems}</strong> transactions
        </span>

        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1); // reset to first page
              }}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg
                         px-2 py-1 text-xs text-[var(--text-primary)] outline-none
                         focus:border-[var(--accent-teal)] cursor-pointer"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span>per page</span>
          </div>
        )}
      </div>

      {/* Right — page buttons */}
      <div className="flex items-center gap-1">

        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card)]
                     text-[var(--text-secondary)] disabled:opacity-30
                     disabled:pointer-events-none transition-all outline-none"
          title="First page"
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Prev page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card)]
                     text-[var(--text-secondary)] disabled:opacity-30
                     disabled:pointer-events-none transition-all outline-none"
          title="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page number buttons */}
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 text-xs text-[var(--text-secondary)]"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`min-w-[32px] h-8 px-2 rounded-lg border text-xs font-semibold
                          transition-all outline-none
                          ${currentPage === page
                            ? 'bg-[#00C9A7] border-[#00C9A7] text-white'
                            : 'border-[var(--border)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)]'
                          }`}
            >
              {page}
            </button>
          )
        )}

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card)]
                     text-[var(--text-secondary)] disabled:opacity-30
                     disabled:pointer-events-none transition-all outline-none"
          title="Next page"
        >
          <ChevronRight size={14} />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card)]
                     text-[var(--text-secondary)] disabled:opacity-30
                     disabled:pointer-events-none transition-all outline-none"
          title="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
