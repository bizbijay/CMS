import type { Table } from "@tanstack/react-table";

const PAGE_SIZES = [10, 25, 50, 100];

export default function TablePagination<T>({ table }: { table: Table<T> }) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getPrePaginationRowModel().rows.length;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
      <div className="flex items-center gap-2">
        <span className="text-slate-500">Rows per page:</span>
        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="rounded border border-slate-300 px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <span className="mr-2 text-slate-500 tabular-nums">{from}–{to} of {total}</span>
        <NavBtn onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} title="First page">«</NavBtn>
        <NavBtn onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} title="Previous page">‹</NavBtn>
        <span className="px-2 tabular-nums">{pageIndex + 1} / {table.getPageCount()}</span>
        <NavBtn onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} title="Next page">›</NavBtn>
        <NavBtn onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} title="Last page">»</NavBtn>
      </div>
    </div>
  );
}

function NavBtn({
  children,
  onClick,
  disabled,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-base leading-none"
    >
      {children}
    </button>
  );
}
