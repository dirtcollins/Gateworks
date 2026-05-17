"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
};

type SortDirection = "asc" | "desc";

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  caption?: string;
  empty?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  loadingRows?: number;
  pageSize?: number;
  className?: string;
};

export function DataTable<T>({
  caption,
  className,
  columns,
  empty,
  emptyDescription,
  emptyTitle = "No records found",
  getRowKey,
  isLoading = false,
  loadingRows = 5,
  pageSize,
  rows
}: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(null);
  const [page, setPage] = useState(0);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column?.sortValue) return rows;
    const sortValue = column.sortValue;
    const direction = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const aValue = sortValue(a);
      const bValue = sortValue(b);
      if (aValue < bValue) return -direction;
      if (aValue > bValue) return direction;
      return 0;
    });
  }, [columns, rows, sort]);

  const totalPages = pageSize ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1;
  const currentPage = Math.min(page, totalPages - 1);
  const pagedRows = pageSize
    ? sortedRows.slice(currentPage * pageSize, currentPage * pageSize + pageSize)
    : sortedRows;

  function toggleSort(key: string) {
    setPage(0);
    setSort((current) => {
      if (current?.key !== key) return { key, direction: "asc" };
      if (current.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  return (
    <div className={cn("rounded-card border border-industrial-rail", className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-industrial-paper text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
            <tr>
              {columns.map((column) => {
                const isSorted = sort?.key === column.key;
                const canSort = Boolean(column.sortable && column.sortValue);
                const ariaSort = !canSort
                  ? undefined
                  : isSorted
                    ? sort?.direction === "asc"
                      ? "ascending"
                      : "descending"
                    : "none";

                return (
                  <th
                    aria-sort={ariaSort}
                    className={cn("px-3 py-2.5", column.className)}
                    key={column.key}
                    scope="col"
                  >
                    {canSort ? (
                      <button
                        aria-label={`Sort by ${column.key}`}
                        className="inline-flex items-center gap-1 rounded font-black uppercase tracking-[0.1em] hover:text-industrial-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-industrial-pine"
                        onClick={() => toggleSort(column.key)}
                        type="button"
                      >
                        {column.header}
                        {isSorted ? (
                          sort?.direction === "asc" ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <ChevronsUpDown className="text-industrial-rail" size={14} />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: loadingRows }).map((_, rowIndex) => (
                <tr className="border-t border-industrial-rail" key={`skeleton-${rowIndex}`}>
                  {columns.map((column) => (
                    <td className={cn("px-3 py-2.5", column.className)} key={column.key}>
                      <span className="block h-4 w-full animate-pulse rounded bg-industrial-paper" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pagedRows.length ? (
              pagedRows.map((row) => (
                <tr className="border-t border-industrial-rail" key={getRowKey(row)}>
                  {columns.map((column) => (
                    <td className={cn("px-3 py-2.5", column.className)} key={column.key}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-6" colSpan={columns.length}>
                  {empty || (
                    <EmptyState
                      bordered={false}
                      description={emptyDescription}
                      title={emptyTitle}
                    />
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pageSize && !isLoading && sortedRows.length > 0 ? (
        <div className="flex items-center justify-between gap-3 border-t border-industrial-rail bg-industrial-paper px-3 py-2 text-xs text-industrial-steel">
          <span>
            Showing {currentPage * pageSize + 1}–
            {Math.min((currentPage + 1) * pageSize, sortedRows.length)} of {sortedRows.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              disabled={currentPage === 0}
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              size="sm"
              variant="secondary"
            >
              Prev
            </Button>
            <span>
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
              size="sm"
              variant="secondary"
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
