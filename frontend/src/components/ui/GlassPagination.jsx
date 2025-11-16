import GlassButton from './GlassButton';
import Icon from './Icon';

/**
 * Glass Pagination Component
 */
export default function GlassPagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className,
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisible = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={`flex items-center justify-center gap-1 sm:gap-2 flex-wrap ${className}`}>
      {/* Previous Button */}
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <Icon name="arrowRight" size="sm" className="rotate-180" />
      </GlassButton>

      {/* First Page */}
      {startPage > 1 && (
        <>
          <GlassButton
            variant={1 === currentPage ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(1)}
          >
            1
          </GlassButton>
          {startPage > 2 && <span className="text-neutral-text-secondary px-2">...</span>}
        </>
      )}

      {/* Page Numbers */}
      {pages.map((page) => (
        <GlassButton
          key={page}
          variant={page === currentPage ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onPageChange(page)}
        >
          {page}
        </GlassButton>
      ))}

      {/* Last Page */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="text-neutral-text-secondary px-2">...</span>}
          <GlassButton
            variant={totalPages === currentPage ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </GlassButton>
        </>
      )}

      {/* Next Button */}
      <GlassButton
        variant="ghost"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <Icon name="arrowRight" size="sm" />
      </GlassButton>
    </div>
  );
}

