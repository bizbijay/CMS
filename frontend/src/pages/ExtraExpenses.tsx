import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { extraExpensesApi, getStoredUser } from "../services/api";
import { formatBSDate } from "../utils/nepaliDate";
import type { ExtraExpenseListItem } from "../types/extraExpense";
import ExtraExpenseFormModal, { type ExtraExpenseFormMode } from "../components/ExtraExpenseFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import IconButton from "../components/IconButton";
import Can from "../components/Can";
import { useT } from "../hooks/useT";
import { useCulture } from "../context/CultureContext";
import { useToast } from "../components/Toaster";

export default function ExtraExpenses() {
  const t = useT();
  const { locale } = useCulture();
  const { addToast } = useToast();

  const commonT = t.common;
  const extraExpensesT = t.pages.extraExpenses;

  const currentUser = getStoredUser();
  const isAdmin = currentUser?.roleName?.toLowerCase() === "admin";

  const [items, setItems] = useState<ExtraExpenseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<ExtraExpenseFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExtraExpenseListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [pendingVerify, setPendingVerify] = useState<ExtraExpenseListItem | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "id", desc: true }]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat(locale === "np" ? "ne-NP" : "en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    [locale],
  );

  const openModal = useCallback((mode: ExtraExpenseFormMode) => {
    setModalMode(mode);
  }, []);

  const closeModal = useCallback(() => {
    setModalMode(null);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await extraExpensesApi.list();
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load extra expenses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function onSaved(item: ExtraExpenseListItem, kind: ExtraExpenseFormMode["kind"]) {
    if (kind === "add") {
      setItems((prev) => [item, ...prev]);
      addToast("Extra expense added successfully.", "success");
    } else {
      setItems((prev) => prev.map((x) => (x.id === item.id ? item : x)));
      addToast("Extra expense updated successfully.", "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await extraExpensesApi.remove(pendingDelete.id);
      setItems((prev) => prev.filter((x) => x.id !== pendingDelete.id));
      addToast("Extra expense deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  async function confirmVerify() {
    if (!pendingVerify) return;
    setVerifying(true);
    try {
      const updated = await extraExpensesApi.verify(pendingVerify.id);
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      addToast(`Extra expense #${updated.id} verified successfully!`, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Verification failed.", "error");
    } finally {
      setVerifying(false);
      setPendingVerify(null);
    }
  }

  const formatCurrency = useCallback(
    (value: number | null | undefined) => {
      if (value == null || Number.isNaN(value)) return "—";
      return `${commonT.currencySymbol} ${currencyFormatter.format(value)}`;
    },
    [commonT.currencySymbol, currencyFormatter],
  );

  const columns = useMemo<ColumnDef<ExtraExpenseListItem>[]>(() => {
    const cols: ColumnDef<ExtraExpenseListItem>[] = [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className="font-mono text-slate-500">{row.original.id}</span>,
      },
    ];

    if (isAdmin) {
      cols.push({
        accessorKey: "expensedByName",
        header: commonT.expensedBy,
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">
            {row.original.expensedByName || row.original.expensedByOther || "—"}
          </span>
        ),
      });
    }

    cols.push(
      {
        accessorKey: "item",
        header: commonT.item,
        cell: ({ row }) => <span className="font-semibold text-slate-800">{row.original.item}</span>,
      },
      {
        accessorKey: "quantity",
        header: commonT.quantity,
        cell: ({ row }) => row.original.quantity != null ? row.original.quantity : <span className="text-slate-400">—</span>,
      },
      {
        accessorKey: "cost",
        header: commonT.perUnitCost,
        cell: ({ row }) => row.original.cost != null ? formatCurrency(row.original.cost) : <span className="text-slate-400">—</span>,
      },
      {
        accessorKey: "totalCost",
        header: commonT.totalCost,
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">
            {formatCurrency(row.original.totalCost)}
          </span>
        ),
      },
      {
        accessorKey: "remarks",
        header: commonT.remarks,
        cell: ({ row }) => row.original.remarks || <span className="text-slate-400">—</span>,
      },
      {
        accessorKey: "date",
        header: commonT.date,
        cell: ({ row }) => row.original.date ? formatBSDate(row.original.date, locale) : "—",
      },
      {
        accessorKey: "isVerified",
        header: commonT.status,
        cell: ({ row }) => {
          const isVer = row.original.isVerified;
          return isVer ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
              {extraExpensesT.verified}
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
              {extraExpensesT.unverified}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: commonT.actions,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {!row.original.isVerified && (
              <Can do="extra_expenses.verify">
                <button
                  type="button"
                  onClick={() => setPendingVerify(row.original)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                  title={extraExpensesT.verify}
                >
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  {extraExpensesT.verify}
                </button>
              </Can>
            )}

            <Can do="extra_expenses.edit">
              <IconButton tooltip={commonT.edit} icon={<PencilIcon />} onClick={() => openModal({ kind: "edit", expense: row.original })} />
            </Can>
            <Can do="extra_expenses.delete">
              <IconButton tooltip={commonT.delete} icon={<TrashIcon />} tone="danger" onClick={() => setPendingDelete(row.original)} />
            </Can>
          </div>
        ),
      }
    );

    return cols;
  }, [commonT, extraExpensesT, locale, isAdmin, openModal, formatCurrency]);

  const ownItems = useMemo(() => {
    if (isAdmin) return items;
    const uid = currentUser?.id;
    return items.filter(
      (e) => e.expensedById === uid || e.createdById === uid
    );
  }, [items, isAdmin, currentUser?.id]);

  const table = useReactTable({
    data: ownItems,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{t.pages.extraExpenses.title}</h2>
        </div>
        <Can do="extra_expenses.add">
          <button
            type="button"
            onClick={() => openModal({ kind: "add" })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            {t.pages.extraExpenses.addButton}
          </button>
        </Can>
      </div>

      {error && (
        <div className="rounded bg-red-50 p-4 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-slate-200 p-4 space-y-4">
        <div className="flex items-center gap-2 max-w-xs">
          <div className="relative w-full">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={t.pages.extraExpenses.searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <DataTable table={table} loading={loading} emptyMessage={t.pages.extraExpenses.noData} />
      </div>

      {modalMode && (
        <ExtraExpenseFormModal
          open={!!modalMode}
          mode={modalMode}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          open={!!pendingDelete}
          title={t.modal.extraExpenses.deleteTitle}
          message={`Are you sure you want to delete expense record #${pendingDelete.id} ("${pendingDelete.item}")?`}
          confirmLabel="Delete"
          tone="danger"
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {pendingVerify && (
        <ConfirmDialog
          open={!!pendingVerify}
          title={t.modal.extraExpenses.verifyTitle}
          message={`Are you sure you want to verify expense record #${pendingVerify.id} ("${pendingVerify.item}" for ${t.common.currencySymbol} ${pendingVerify.totalCost.toLocaleString()})?`}
          confirmLabel={t.pages.extraExpenses.verify}
          tone="neutral"
          busy={verifying}
          onConfirm={confirmVerify}
          onCancel={() => setPendingVerify(null)}
        />
      )}
    </div>
  );
}

function PencilIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );
}

function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function PlusIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
