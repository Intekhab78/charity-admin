import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, onPageChange, totalEntries, entriesPerPage, startIndex }) => {
  if (totalPages <= 1) return null;

  // Generate page numbers to show, e.g., max 5 pages with ellipsis if needed
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      if (start === 1) {
        end = maxVisible;
      } else if (end === totalPages) {
        start = totalPages - maxVisible + 1;
      }
      
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="pagination-container px-6 py-4" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '24px',
      paddingTop: '20px',
      borderTop: '1px solid #f1f5f9',
      fontSize: '13px',
      color: '#64748b',
      fontWeight: '500',
      width: '100%'
    }}>
      <div style={{ color: '#94a3b8' }}>
        Showing {startIndex + 1} to {Math.min(startIndex + entriesPerPage, totalEntries)} of {totalEntries} entries
      </div>
      
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            borderRadius: '8px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.4 : 1,
            color: '#475569',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { if (currentPage !== 1) e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
        >
          <ChevronLeft size={16} />
        </button>

        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              style={{
                padding: '8px 14px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#475569',
                fontWeight: '600'
              }}
            >
              1
            </button>
            {pages[0] > 2 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              padding: '8px 14px',
              border: '1px solid',
              borderColor: currentPage === page ? '#10b981' : '#e2e8f0',
              background: currentPage === page ? '#10b981' : '#ffffff',
              color: currentPage === page ? '#ffffff' : '#475569',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '700',
              transition: 'all 0.2s'
            }}
          >
            {page}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              style={{
                padding: '8px 14px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#475569',
                fontWeight: '600'
              }}
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            borderRadius: '8px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.4 : 1,
            color: '#475569',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => { if (currentPage !== totalPages) e.currentTarget.style.background = '#f8fafc'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
