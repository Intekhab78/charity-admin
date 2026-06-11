import React from 'react';

const TableSkeleton = ({ rows = 5, cols = 5, hasAvatar = false }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="skeleton-pulse border-b border-slate-100">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <td key={cIdx} className="py-4 px-6 text-center align-middle">
              {cIdx === 0 && hasAvatar ? (
                <div className="skeleton-avatar" />
              ) : (
                <div 
                  className="skeleton-line" 
                  style={{ 
                    width: cIdx === 0 ? '40px' : cIdx === cols - 1 ? '80px' : `${Math.floor(Math.random() * 40) + 50}%` 
                  }} 
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export default TableSkeleton;
