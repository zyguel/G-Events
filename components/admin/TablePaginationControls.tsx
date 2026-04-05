"use client";

import React from "react";

interface TablePaginationControlsProps {
  totalItems: number;
  currentPage: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  pageSizeOptions?: number[];
}

export default function TablePaginationControls({
  totalItems,
  currentPage,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  pageSizeOptions = [10, 25, 50, 100],
}: TablePaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const end = totalItems === 0 ? 0 : Math.min(safePage * rowsPerPage, totalItems);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-xs text-gray-600 dark:text-gray-400">
        Showing {start}-{end} of {totalItems}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="rows-per-page" className="text-xs text-gray-600 dark:text-gray-400">
          Rows per page
        </label>
        <select
          id="rows-per-page"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
        >
          Previous
        </button>

        <span className="text-xs text-gray-600 dark:text-gray-400">
          Page {safePage} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}
