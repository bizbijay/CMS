import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import DataTable from "../components/DataTable";
import { AddVendorBalanceModal, PayVendorAmountModal } from "../components/VendorBalanceModals";
import { useToast } from "../components/Toaster";
import { useCulture } from "../context/CultureContext";
import { useT } from "../hooks/useT";
import { bankAccountsApi, vendorsApi } from "../services/api";
import type { BankAccountListItem } from "../types/bankAccount";
import type { VendorBalanceLogListItem, VendorListItem } from "../types/vendors";
import { formatBSDate } from "../utils/nepaliDate";

export default function VendorManagementLogs() {
  const t = useT();
  const { locale } = useCulture();
  const { addToast } = useToast();
  const { vendorId } = useParams();
  const parsedId = Number(vendorId);
  const [vendor, setVendor] = useState<VendorListItem | null>(null);
  const [logs, setLogs] = useState<VendorBalanceLogListItem[]>([]);
  const [accounts, setAccounts] = useState<BankAccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalCreditOpen, setModalCreditOpen] = useState(false);
  const [modalPayOpen, setModalPayOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "loggedOn", desc: true }]);

  const formatMoney = useMemo(
    () =>
      new Intl.NumberFormat(locale === "np" ? "ne-NP" : "en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const load = useCallback(async () => {
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      setError("Invalid vendor id.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [vendorData, logsData, accountData] = await Promise.all([
        vendorsApi.getById(parsedId),
        vendorsApi.listBalanceLogsByVendor(parsedId),
        bankAccountsApi.list(),
      ]);
      setVendor(vendorData);
      setLogs(logsData ?? []);
      setAccounts(accountData ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load vendor logs.");
    } finally {
      setLoading(false);
    }
  }, [parsedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<VendorBalanceLogListItem>[]>(() => [
    {
      accessorKey: "loggedOn",
      header: t.pages.bankAccounts.creditDateLabel,
      cell: ({ row }) => <span>{formatBSDate(row.original.loggedOn, locale)}</span>,
    },
    {
      accessorKey: "entryType",
      header: t.pages.vendorManagement.entryTypeLabel,
      cell: ({ row }) => {
        const isCredit = row.original.entryType === "credit";
        return (
          <span className={isCredit ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>
            {isCredit ? t.pages.vendorManagement.creditLabel : t.pages.vendorManagement.debitLabel}
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: t.pages.bankAccounts.creditAmountLabel,
      cell: ({ row }) => (
        <span className="font-medium text-slate-800">
          {t.common.currencySymbol} {formatMoney.format(Number(row.original.amount || 0))}
        </span>
      ),
    },
    {
      accessorKey: "bankAccountName",
      header: t.nav.bankAccounts,
      cell: ({ row }) => <span className="text-slate-600">{row.original.bankAccountName || "-"}</span>,
    },
    {
      accessorKey: "remarks",
      header: t.common.remarks,
      cell: ({ row }) => <span className="text-slate-600">{row.original.remarks || "-"}</span>,
    },
  ], [t, formatMoney, locale]);

  const table = useReactTable({
    data: logs,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{t.pages.vendorManagement.logsTitle}</h2>
          <Link to="/vendor-management" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
            {t.pages.vendorManagement.backToManagement}
          </Link>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {t.common.refresh}
          </button>
          <button
            type="button"
            onClick={() => setModalCreditOpen(true)}
            className="inline-flex items-center justify-center rounded border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            disabled={!vendor}
          >
            {t.pages.vendorManagement.addBalanceButton}
          </button>
          <button
            type="button"
            onClick={() => setModalPayOpen(true)}
            className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            disabled={!vendor}
          >
            {t.pages.vendorManagement.payAmountButton}
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.common.name}</p>
          <p className="mt-1 text-base font-medium text-slate-800">{vendor?.name ?? "-"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.modal.vendors.panNumberLabel}</p>
          <p className="mt-1 text-base font-medium text-slate-800">{vendor?.panNumber ?? "-"}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-700">{t.pages.vendorManagement.totalBalanceLabel}</p>
          <p className="mt-1 text-lg font-semibold text-amber-700">
            {t.common.currencySymbol} {formatMoney.format(Number(vendor?.totalBalance || 0))}
          </p>
        </div>
      </div>

      <DataTable table={table} loading={loading} emptyMessage={t.pages.vendorManagement.noLogs} />

      <AddVendorBalanceModal
        open={modalCreditOpen}
        vendor={vendor}
        onClose={() => setModalCreditOpen(false)}
        onSaved={async () => {
          await load();
          addToast(t.pages.vendorManagement.balanceUpdatedToast, "success");
        }}
      />

      <PayVendorAmountModal
        open={modalPayOpen}
        vendor={vendor}
        bankAccounts={accounts}
        formatMoney={formatMoney}
        onClose={() => setModalPayOpen(false)}
        onSaved={async () => {
          await load();
          addToast(t.pages.vendorManagement.paymentRecordedToast, "success");
        }}
      />
    </div>
  );
}
