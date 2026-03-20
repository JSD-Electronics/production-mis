"use client";

import React from "react";

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const safePageSize = Number.isFinite(pageSize) ? Math.max(1, pageSize) : 10;
  const pageCount = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const safePage = Number.isFinite(page) ? Math.min(Math.max(1, page), pageCount) : 1;

  const start = safeTotal === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const end = Math.min(safeTotal, safePage * safePageSize);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="text-gray-600 dark:text-gray-300">
        {safeTotal === 0 ? "No records" : `Showing ${start}-${end} of ${safeTotal}`}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 dark:text-gray-300">Rows</span>
          <select
            value={safePageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded border border-stroke bg-transparent px-2 py-1 text-sm outline-none focus:border-primary dark:border-strokedark dark:text-white"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1}
          className="rounded border border-stroke bg-white px-2.5 py-1 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-strokedark dark:bg-boxdark dark:text-white"
        >
          First
        </button>
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className="rounded border border-stroke bg-white px-2.5 py-1 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-strokedark dark:bg-boxdark dark:text-white"
        >
          Prev
        </button>
        <div className="px-1 text-gray-600 dark:text-gray-300">
          Page <span className="font-semibold text-gray-800 dark:text-white">{safePage}</span> / {pageCount}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= pageCount}
          className="rounded border border-stroke bg-white px-2.5 py-1 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-strokedark dark:bg-boxdark dark:text-white"
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => onPageChange(pageCount)}
          disabled={safePage >= pageCount}
          className="rounded border border-stroke bg-white px-2.5 py-1 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-strokedark dark:bg-boxdark dark:text-white"
        >
          Last
        </button>
      </div>
    </div>
  );
}

