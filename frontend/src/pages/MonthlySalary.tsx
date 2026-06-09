import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { monthlySalaryApi } from "../services/api";
import type { MonthlySalaryRow } from "../types/monthlySalary";
import MonthlySalaryFormModal from "../components/MonthlySalaryFormModal";
import IconButton from "../components/IconButton";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useT } from "../hooks/useT";
import { useCulture } from "../context/CultureContext";
import {
  getCurrentBSDate,
  getBSYearOptions,
  NEPALI_MONTHS_EN,
  NEPALI_MONTHS_NP,
} from "../utils/nepaliDate";

const bsNow = getCurrentBSDate();
const BS_YEAR_OPTIONS = getBSYearOptions(7);

export default function MonthlySalary() {
  const { addToast } = useToast();
  const t = useT();
  const { locale } = useCulture();
  const monthNames = locale === "np" ? NEPALI_MONTHS_NP : NEPALI_MONTHS_EN;

  const [month, setMonth] = useState(bsNow.month);
  const [year, setYear] = useState(bsNow.year);
  const [rows, setRows] = useState<MonthlySalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<MonthlySalaryRow | null>(null);
  const [verifyingAll, setVerifyingAll] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "userName", desc: false }]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await monthlySalaryApi.getForMonth(month, year);
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load monthly salaries.");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  async function handleVerifyAll() {
    setVerifyingAll(true);
    try {
      const updated = await monthlySalaryApi.verifyAll(month, year);
      setRows(updated);
      addToast("All salaries saved and verified.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Verify all failed.", "error");
    } finally {
      setVerifyingAll(false);
    }
  }

  function onSaved(saved: MonthlySalaryRow) {
    setRows((prev) => prev.map((r) => r.userId === saved.userId ? saved : r));
    addToast("Salary saved successfully.", "success");
  }

  const columns = useMemo<ColumnDef<MonthlySalaryRow>[]>(() => [
    {
      accessorKey: "userName",
      header: t.pages.monthlySalary.employee,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.userName}</span>,
    },
    {
      accessorKey: "defaultSalary",
      header: t.pages.monthlySalary.defaultSalary,
      cell: ({ row }) => (
        <span className="text-slate-500 text-sm">
          {t.common.currencySymbol} {row.original.defaultSalary.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "amount",
      header: t.pages.monthlySalary.thisMonth,
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">
          {t.common.currencySymbol} {row.original.amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "isVerified",
      header: t.pages.monthlySalary.status,
      enableSorting: false,
      cell: ({ row }) => {
        const { id, isVerified } = row.original;
        if (id === null) {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
              {t.pages.monthlySalary.notSaved}
            </span>
          );
        }
        return isVerified ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
            {t.pages.monthlySalary.verified}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
            {t.pages.monthlySalary.pending}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <Can do="monthly_salary.edit">
          <IconButton tooltip="Edit salary" icon={<PencilIcon />} onClick={() => setEditRow(row.original)} />
        </Can>
      ),
    },
  ], [t]);

  const table = useReactTable({
    data: rows,
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
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.monthlySalary.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {monthNames.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {BS_YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (month === bsNow.month && year === bsNow.year) {
                load();
              } else {
                setMonth(bsNow.month);
                setYear(bsNow.year);
              }
            }}
            className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {t.common.refresh}
          </button>
          <Can do="monthly_salary.edit">
            <button
              onClick={handleVerifyAll}
              disabled={verifyingAll || rows.length === 0}
              className="px-3 py-2 text-sm rounded bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-medium flex items-center gap-1.5"
            >
              <CheckAllIcon />
              {verifyingAll ? t.common.saving : t.pages.monthlySalary.saveAndVerifyAll}
            </button>
          </Can>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

      <DataTable table={table} loading={loading} emptyMessage={t.pages.monthlySalary.noData} />

      <MonthlySalaryFormModal
        open={editRow !== null}
        row={editRow}
        onClose={() => setEditRow(null)}
        onSaved={onSaved}
      />
    </div>
  );
}

function PencilIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>;
}

function CheckAllIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M2 12l5 5L20 4" /><path d="M8 12l4 4 4-4" /></svg>;
}
