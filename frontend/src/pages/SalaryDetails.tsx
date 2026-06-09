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
import { salaryDetailApi, salaryPaymentApi } from "../services/api";
import type { SalaryDetailDto } from "../types/salaryDetail";
import type { SalaryPaymentListItem } from "../types/salaryPayment";
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
  const [sorting, setSorting] = useState<SortingState>([{ id: "userName", desc: false }]);

  // Make Payment modal
  const [payTarget, setPayTarget] = useState<SalaryDetailDto | null>(null);

  // View Payments modal
  const [viewTarget, setViewTarget] = useState<SalaryDetailDto | null>(null);
  const [viewPayments, setViewPayments] = useState<SalaryPaymentListItem[]>([]);
  const [viewLoading, setViewLoading] = useState(false);

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

  // Load payments when View Payments opens
  useEffect(() => {
    if (!viewTarget) return;
    setViewLoading(true);
    salaryPaymentApi.list()
      .then((all) => setViewPayments(all.filter((p) => p.userId === viewTarget.userId)))
      .catch(() => setViewPayments([]))
      .finally(() => setViewLoading(false));
  }, [viewTarget]);

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
              onClick={() => setViewTarget(row.original)}
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
    data: items,
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
        <button
          onClick={load}
          className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          {t.common.refresh}
        </button>
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
              {t.common.currencySymbol} {items.reduce((s, i) => s + i.totalSalary, 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-sm text-green-700">
              {t.common.currencySymbol} {items.reduce((s, i) => s + i.paid, 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-sm text-red-600">
              {t.common.currencySymbol} {items.reduce((s, i) => s + i.remaining, 0).toLocaleString()}
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

      {/* View Payments modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{t.pages.salaryDetails.paymentsFor} {viewTarget.userName}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {t.pages.salaryDetails.paid}: {t.common.currencySymbol} {viewTarget.paid.toLocaleString()}
                  {" · "}
                  {t.pages.salaryDetails.remaining}: {t.common.currencySymbol} {viewTarget.remaining.toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setViewTarget(null)}
                className="w-8 h-8 inline-flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close"
              >
                <XIcon />
              </button>
            </div>

            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {viewLoading ? (
                <p className="text-sm text-slate-500 py-4 text-center">{t.common.loading}</p>
              ) : viewPayments.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">{t.pages.salaryDetails.noPayments}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                      <th className="pb-2 pr-4">{t.pages.salaryPayments.paidOn}</th>
                      <th className="pb-2 pr-4">{t.pages.salaryPayments.amount}</th>
                      <th className="pb-2">{t.pages.salaryPayments.remarks}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewPayments.map((p) => {
                      const [y, m, d] = p.paidOn.split("-");
                      return (
                        <tr key={p.id}>
                          <td className="py-2 pr-4 text-slate-600">{d}/{m}/{y}</td>
                          <td className="py-2 pr-4 font-medium text-slate-800">
                            {t.common.currencySymbol} {p.amount.toLocaleString()}
                          </td>
                          <td className="py-2 text-slate-500">{p.remarks ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewTarget(null)}
                className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
