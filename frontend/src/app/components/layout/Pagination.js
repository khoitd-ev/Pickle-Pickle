"use client";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const baseBtn =
    "inline-flex items-center justify-center rounded-md border border-zinc-300 px-3 py-1 text-xs md:text-sm bg-white text-slate-600 hover:bg-zinc-100 transition";

  return (
    <div className="mt-6 flex justify-center">
      <div className="flex items-center gap-2">
        {/* Previous */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          className={`${baseBtn} ${
            currentPage === 1
              ? "cursor-not-allowed opacity-50 hover:bg-white"
              : ""
          }`}
        >
          Previews
        </button>

        {/* Page numbers */}
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={
              page === currentPage
                ? "inline-flex items-center justify-center rounded-md border border-zinc-500 px-3 py-1 text-xs md:text-sm bg-zinc-500 text-white"
                : baseBtn
            }
          >
            {page}
          </button>
        ))}

        {/* Next */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() =>
            currentPage < totalPages && onPageChange(currentPage + 1)
          }
          className={`${baseBtn} ${
            currentPage === totalPages
              ? "cursor-not-allowed opacity-50 hover:bg-white"
              : ""
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
