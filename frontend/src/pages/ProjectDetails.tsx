import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { projectsApi } from "../services/api";
import type { ProjectListItem, ProjectExpenseSummary } from "../types/projects";
import DataTable from "../components/DataTable";
import { useT } from "../hooks/useT";

export default function ProjectDetails() {
  const t = useT();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [summaries, setSummaries] = useState<ProjectExpenseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "id", desc: false }]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s] = await Promise.all([projectsApi.list(), projectsApi.expenseSummary()]);
      setProjects(p);
      setSummaries(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const fmt = (n: number) =>
    `${t.common.currencySymbol} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const columns = useMemo<ColumnDef<ProjectListItem>[]>(() => [
    {
      accessorKey: "id",
      header: "S.N.",
      size: 60,
      enableSorting: false,
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        return <span className="text-slate-500 text-sm">{pageIndex * pageSize + row.index + 1}</span>;
      },
    },
    {
      accessorKey: "name",
      header: t.common.name,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.name}</span>,
    },
    {
      id: "totalExpenses",
      header: t.common.totalExpenses,
      enableSorting: false,
      cell: ({ row }) => {
        const s = summaries.find((s) => s.projectId === row.original.id);
        if (!s) return <span className="text-slate-400 text-sm">—</span>;
        return (
          <div className="inline-flex items-center gap-2">
            <span className="font-semibold text-slate-800">{fmt(s.grandTotal)}</span>
            <button
              onClick={() => navigate(`/project-details/${row.original.id}/breakdown`)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors"
            >
              <BreakdownIcon />
              {t.common.breakdown}
            </button>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="inline-flex gap-2">
          <button
            onClick={() => navigate(`/project-details/${row.original.id}/expenses`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            <ExpensesIcon />
            {t.common.expenses}
          </button>
          <button
            onClick={() => navigate(`/project-details/${row.original.id}/wages`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
          >
            <WagesIcon />
            {t.common.wages}
          </button>
          <button
            onClick={() => navigate(`/project-details/${row.original.id}/commissions`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors"
          >
            <CommissionIcon />
            {t.common.commission}
          </button>
        </div>
      ),
    },
  ], [t, navigate, summaries, fmt]);

  const table = useReactTable({
    data: projects,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.projectDetails.title}</h2>
        <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
          {t.common.refresh}
        </button>
      </div>
      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}
      <DataTable table={table} loading={loading} emptyMessage={t.pages.projectDetails.noData} />
    </div>
  );
}

function ExpensesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
      <line x1="14" y1="15" x2="18" y2="15" />
    </svg>
  );
}

function WagesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="23" y1="11" x2="17" y2="11" />
      <line x1="20" y1="8" x2="20" y2="14" />
    </svg>
  );
}

function CommissionIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function BreakdownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
