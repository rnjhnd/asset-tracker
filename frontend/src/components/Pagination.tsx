import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex justify-center items-center gap-4 mb-12 ${className}`}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous Page"
        className="bg-white border-2 border-[#e4e4e7] p-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>

      <span className="font-mono text-sm font-bold">
        PAGE {currentPage} OF {totalPages}
      </span>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next Page"
        className="bg-white border-2 border-[#e4e4e7] p-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};
