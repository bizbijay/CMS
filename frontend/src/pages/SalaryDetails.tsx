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
import { salaryDetailApi } from "../services/api";
import type { SalaryDetailDto } from "../types/salaryDetail";
import SalaryPaymentFormModal from "../components/SalaryPaymentFormModal";
import DataTable from "../components/DataTable";
import Can from "../components/Can";
import { useToast } from "../components/Toaster";
import { useT } from "../hooks/useT";

export default function SalaryDetails() {
  const t = useT();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<SalaryDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "userName", desc: false }]);

  const employeeOptions = useMemo(
    () => [...items].sort((a, b) => a.userName.localeCompare(b.userName)),
    [items]
  );

  const filtered = useMemo(
    () => items.filter((i) => {
      const matchesSearch = i.userName.toLowerCase().includes(search.toLowerCase());
      const matchesDropdown = selectedUserId === "" || i.userId === selectedUserId;
      return matchesSearch && matchesDropdown;
    }),
    [items, search, selectedUserId]
  );

  // Make Payment modal
  const [payTarget, setPayTarget] = useState<SalaryDetailDto | null>(null);


  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salaryDetailApi.list();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load salary details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);


  function onPaymentSaved() {
    setPayTarget(null);
    addToast("Payment saved successfully.", "success");
    load();
  }

  const columns = useMemo<ColumnDef<SalaryDetailDto>[]>(() => [
    {
      accessorKey: "userName",
      header: t.pages.salaryDetails.employee,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.userName}</span>,
    },
    {
      accessorKey: "totalSalary",
      header: t.pages.salaryDetails.totalSalary,
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">
          {t.common.currencySymbol} {row.original.totalSalary.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "paid",
      header: t.pages.salaryDetails.paid,
      cell: ({ row }) => (
        <span className="font-medium text-green-700">
          {t.common.currencySymbol} {row.original.paid.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "remaining",
      header: t.pages.salaryDetails.remaining,
      cell: ({ row }) => (
        <span className={`font-semibold ${row.original.remaining > 0 ? "text-red-600" : "text-slate-600"}`}>
          {t.common.currencySymbol} {row.original.remaining.toLocaleString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => navigate(`/salary-details/${row.original.userId}`)}
            className="px-2.5 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
          >
            {t.pages.salaryDetails.viewBreakdown}
          </button>
          <Can do="salary_payment.view">
            <button
              onClick={() => navigate(`/salary-payments?userId=${row.original.userId}`)}
              className="px-2.5 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium"
            >
              {t.pages.salaryDetails.viewPayments}
            </button>
          </Can>
          <Can do="salary_payment.add">
            <button
              onClick={() => setPayTarget(row.original)}
              className="px-2.5 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {t.pages.salaryDetails.makePayment}
            </button>
          </Can>
        </div>
      ),
    },
  ], [t]);

  const table = useReactTable({
    data: filtered,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.salaryDetails.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {/* Dropdown employee filter */}
          <select
            value={selectedUserId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedUserId(val === "" ? "" : Number(val));
              setSearch("");
            }}
            className="py-2 pl-3 pr-8 text-sm rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
          >
            <option value="">All employees</option>
            {employeeOptions.map((emp) => (
              <option key={emp.userId} value={emp.userId}>{emp.userName}</option>
            ))}
          </select>

          {/* Text search filter */}
          <div className="relative">
            <SearchIcon />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedUserId(""); }}
              placeholder="Search by name..."
              className="pl-8 pr-3 py-2 text-sm rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Clear"
              >
                <XSmallIcon />
              </button>
            )}
          </div>

          <button
            onClick={load}
            className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {t.common.refresh}
          </button>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

      <DataTable
        table={table}
        loading={loading}
        emptyMessage={t.pages.salaryDetails.noData}
        footerRow={
          <tr>
            <td className="px-4 py-3 text-sm">{t.pages.salaryDetails.total}</td>
            <td className="px-4 py-3 text-sm">
              {t.common.currencySymbol} {filtered.reduce((s, i) => s + i.totalSalary, 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-sm text-green-700">
              {t.common.currencySymbol} {filtered.reduce((s, i) => s + i.paid, 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-sm text-red-600">
              {t.common.currencySymbol} {filtered.reduce((s, i) => s + i.remaining, 0).toLocaleString()}
            </td>
            <td className="px-4 py-3" />
          </tr>
        }
      />

      {/* Make Payment modal */}
      <SalaryPaymentFormModal
        open={payTarget !== null}
        item={null}
        prefillUserId={payTarget?.userId}
        onClose={() => setPayTarget(null)}
        onSaved={onPaymentSaved}
      />

    </div>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function XSmallIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
