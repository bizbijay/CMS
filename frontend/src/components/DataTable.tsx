import { flexRender, type Table } from "@tanstack/react-table";
import TablePagination from "./TablePagination";

interface Props<T> {
  table: Table<T>;
  loading?: boolean;
  emptyMessage?: string;
  footerRow?: React.ReactNode;
  headerClassName?: string;
  totalCount?: number;
}

export default function DataTable<T>({ table, loading, emptyMessage = "No data.", footerRow, headerClassName, totalCount }: Props<T>) {
  const colCount = table.getVisibleLeafColumns().length;
  const hasRows = table.getRowModel().rows.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm table-auto">
          <thead className={headerClassName ?? "bg-slate-200 text-slate-700"}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const meta = header.column.columnDef.meta;
                  return (
                    <th
                      key={header.id}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      className={[
                        "text-left font-medium uppercase text-xs tracking-wide px-4 py-3 whitespace-nowrap",
                        canSort ? "cursor-pointer select-none group" : "",
                        meta?.className ?? "",
                      ].join(" ")}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && <SortIcon sorted={sorted} />}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : !hasRows ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-6 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={["px-4 py-3 text-slate-700", cell.column.columnDef.meta?.className ?? ""].join(" ")}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footerRow && !loading && hasRows && (
            <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-semibold text-slate-800">
              {footerRow}
            </tfoot>
          )}
        </table>
      </div>
      {!loading && hasRows && <TablePagination table={table} totalCount={totalCount} />}
    </div>
  );
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 10 16"
      fill="currentColor"
      className={`w-2.5 h-3.5 shrink-0 transition-opacity ${
        sorted ? "text-blue-600" : "opacity-30 group-hover:opacity-60"
      }`}
    >
      <path d="M5 0L0 6h10L5 0z" opacity={!sorted || sorted === "asc" ? 1 : 0.3} />
      <path d="M5 16L0 10h10L5 16z" opacity={!sorted || sorted === "desc" ? 1 : 0.3} />
    </svg>
  );
}
