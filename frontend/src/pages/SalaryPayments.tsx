import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { salaryPaymentApi } from "../services/api";
import type { SalaryPaymentListItem } from "../types/salaryPayment";
import SalaryPaymentFormModal from "../components/SalaryPaymentFormModal";
import IconButton from "../components/IconButton";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useT } from "../hooks/useT";

export default function SalaryPayments() {
  const { addToast } = useToast();
  const t = useT();

  const [items, setItems] = useState<SalaryPaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<SalaryPaymentListItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SalaryPaymentListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "paidOn", desc: true }]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salaryPaymentApi.list();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load salary payments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onSaved(saved: SalaryPaymentListItem) {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setAddOpen(false);
    setEditItem(null);
    addToast("Payment saved successfully.", "success");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await salaryPaymentApi.remove(deleteTarget.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      addToast("Payment deleted.", "success");
      setDeleteTarget(null);
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<SalaryPaymentListItem>[]>(() => [
    {
      accessorKey: "userName",
      header: t.pages.salaryPayments.employee,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.userName}</span>,
    },
    {
      accessorKey: "amount",
      header: t.pages.salaryPayments.amount,
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">
          {t.common.currencySymbol} {row.original.amount.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "paidOn",
      header: t.pages.salaryPayments.paidOn,
      cell: ({ row }) => {
        const [y, m, d] = row.original.paidOn.split("-");
        return <span className="text-slate-600 text-sm">{d}/{m}/{y}</span>;
      },
    },
    {
      accessorKey: "remarks",
      header: t.pages.salaryPayments.remarks,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-slate-500 text-sm">{row.original.remarks ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Can do="salary_payment.edit">
            <IconButton tooltip="Edit" icon={<PencilIcon />} onClick={() => setEditItem(row.original)} />
          </Can>
          <Can do="salary_payment.delete">
            <IconButton tooltip="Delete" icon={<TrashIcon />} onClick={() => setDeleteTarget(row.original)} tone="danger" />
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
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.salaryPayments.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {t.common.refresh}
          </button>
          <Can do="salary_payment.add">
            <button
              onClick={() => setAddOpen(true)}
              className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
            >
              <PlusIcon />
              {t.pages.salaryPayments.addButton}
            </button>
          </Can>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

      <DataTable table={table} loading={loading} emptyMessage={t.pages.salaryPayments.noData} />

      <SalaryPaymentFormModal
        open={addOpen}
        item={null}
        onClose={() => setAddOpen(false)}
        onSaved={onSaved}
      />

      <SalaryPaymentFormModal
        open={editItem !== null}
        item={editItem}
        onClose={() => setEditItem(null)}
        onSaved={onSaved}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm px-6 py-5 space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">{t.modal.salaryPayment.deleteTitle}</h3>
            <p className="text-sm text-slate-600">{t.modal.salaryPayment.deleteMessage}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium"
              >
                {deleting ? t.modal.working : t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PencilIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>;
}

function TrashIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>;
}

function PlusIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
