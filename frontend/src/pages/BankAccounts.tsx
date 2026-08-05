import { useEffect, useMemo, useState } from "react";
import { useT } from "../hooks/useT";
import { bankAccountsApi } from "../services/api";
import BankAccountFormModal, { type BankAccountFormMode } from "../components/BankAccountFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import IconButton from "../components/IconButton";
import { useToast } from "../components/Toaster";
import type { BankAccountListItem } from "../types/bankAccount";
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";

export default function BankAccounts() {
  const t = useT();
  const { addToast } = useToast();
  const [accounts, setAccounts] = useState<BankAccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<BankAccountFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BankAccountListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "bankName", desc: false }]);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      setLoading(true);
      setError(null);
      const data = await bankAccountsApi.list();
      setAccounts(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load bank accounts.");
    } finally {
      setLoading(false);
    }
  }

  function onSaved(account: BankAccountListItem, kind: BankAccountFormMode["kind"]) {
    setAccounts((prev) => {
      const next = prev.map((item) => ({
        ...item,
        isPrimary: account.isPrimary && item.id === account.id ? true : false,
      }));

      if (kind === "add") {
        return [account, ...next.filter((item) => item.id !== account.id)];
      }

      return next.map((item) => (item.id === account.id ? account : item));
    });

    addToast(kind === "add" ? "Bank account added successfully." : "Bank account updated successfully.", "success");
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await bankAccountsApi.remove(pendingDelete.id);
      setAccounts((prev) => prev.filter((account) => account.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast("Bank account deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<BankAccountListItem>[]>(() => [
    {
      accessorKey: "bankName",
      header: t.pages.bankAccounts.bankNameLabel,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.bankName}</span>,
    },
    {
      accessorKey: "accountHolder",
      header: t.pages.bankAccounts.accountHolderLabel,
      cell: ({ row }) => <span className="text-slate-600">{row.original.accountHolder}</span>,
    },
    {
      accessorKey: "accountNumber",
      header: t.pages.bankAccounts.accountNumberLabel,
      cell: ({ row }) => <span className="text-slate-600">{row.original.accountNumber}</span>,
    },
    {
      accessorKey: "branch",
      header: t.pages.bankAccounts.branchLabel,
      cell: ({ row }) => <span className="text-slate-600">{row.original.branch || "—"}</span>,
    },
    {
      accessorKey: "isPrimary",
      header: t.pages.bankAccounts.primaryLabel,
      cell: ({ row }) => (
        <span className={row.original.isPrimary ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700" : "text-slate-400"}>
          {row.original.isPrimary ? t.pages.bankAccounts.primaryLabel : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="flex justify-end gap-1.5">
          <IconButton tooltip="Edit bank account" icon={<PencilIcon />} onClick={() => setModalMode({ kind: "edit", account: row.original })} />
          <IconButton tooltip="Delete bank account" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDelete(row.original)} />
        </div>
      ),
    },
  ], [t]);

  const table = useReactTable({
    data: accounts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.bankAccounts.title}</h2>
        <button
          type="button"
          onClick={() => setModalMode({ kind: "add" })}
          className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {t.pages.bankAccounts.addButton}
        </button>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <DataTable table={table} loading={loading} emptyMessage={t.pages.bankAccounts.noData} />

      <BankAccountFormModal open={modalMode !== null} mode={modalMode ?? { kind: "add" }} onClose={() => setModalMode(null)} onSaved={onSaved} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.common.delete}
        message={pendingDelete ? `Delete bank account ${pendingDelete.bankName}?` : "Delete this bank account?"}
        confirmLabel={t.common.delete}
        tone="danger"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </div>
  );
}

function PencilIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>;
}

function TrashIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>;
}
