import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  empty?: ReactNode;
  className?: string;
};

export function DataTable<T>({
  className,
  columns,
  empty,
  getRowKey,
  rows
}: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border border-industrial-rail", className)}>
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-industrial-paper text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
          <tr>
            {columns.map((column) => (
              <th className={cn("px-3 py-2.5", column.className)} key={column.key}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
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
                  <p className="text-center text-sm text-industrial-steel">
                    No records found.
                  </p>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
