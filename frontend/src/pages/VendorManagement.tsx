import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import IconButton from "../components/IconButton";
import Can from "../components/Can";
import { useToast } from "../components/Toaster";
import { useCulture } from "../context/CultureContext";
import { useT } from "../hooks/useT";
import { bankAccountsApi, vendorsApi } from "../services/api";
import type { BankAccountListItem } from "../types/bankAccount";
import type { VendorListItem } from "../types/vendors";

type VendorRow = VendorListItem;
type BalanceModalState = { mode: "credit"; vendor: VendorRow } | null;
type PayModalState = { mode: "pay"; vendor: VendorRow } | null;

export default function VendorManagement() {
  const navigate = useNavigate();
  const t = useT();
  const { locale } = useCulture();
  const { addToast } = useToast();
  const [vendors, setVendors] = useState<VendorRow[]>([]);
  const [accounts, setAccounts] = useState<BankAccountListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalCredit, setModalCredit] = useState<BalanceModalState>(null);
  const [modalPay, setModalPay] = useState<PayModalState>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const formatMoney = useMemo(
    () =>
      new Intl.NumberFormat(locale === "np" ? "ne-NP" : "en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const loadPageData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [vendorData, accountData] = await Promise.all([vendorsApi.list(), bankAccountsApi.list()]);
      setVendors(vendorData ?? []);
      setAccounts(accountData ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load vendor management data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPageData();
  }, [loadPageData]);

  const columns = useMemo<ColumnDef<VendorRow>[]>(() => [
    {
      accessorKey: "name",
      header: t.common.name,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.name}</span>,
    },
    {
      accessorKey: "panNumber",
      header: t.modal.vendors.panNumberLabel,
      cell: ({ row }) => <span className="text-slate-600">{row.original.panNumber || "-"}</span>,
    },
    {
      accessorKey: "totalBalance",
      header: t.pages.vendorManagement.totalBalanceLabel,
      cell: ({ row }) => (
        <span className="font-semibold text-amber-700">
          {t.common.currencySymbol} {formatMoney.format(Number(row.original.totalBalance || 0))}
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
          <Can do="vendors.edit">
            <IconButton
              tooltip={t.pages.vendorManagement.addBalanceButton}
              icon={<PlusIcon />}
              onClick={() => setModalCredit({ mode: "credit", vendor: row.original })}
            />
          </Can>
          <Can do="vendors.edit">
            <IconButton
              tooltip={t.pages.vendorManagement.payAmountButton}
              icon={<PayIcon />}
              onClick={() => setModalPay({ mode: "pay", vendor: row.original })}
            />
          </Can>
          <IconButton
            tooltip={t.pages.vendorManagement.viewLogsButton}
            icon={<InfoIcon />}
            onClick={() => navigate(`/vendor-management/${row.original.id}/logs`)}
          />
        </div>
      ),
    },
  ], [t, formatMoney, navigate]);

  const table = useReactTable({
    data: vendors,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const totalVendorBalance = useMemo(
    () => vendors.reduce((sum, vendor) => sum + Number(vendor.totalBalance || 0), 0),
    [vendors],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{t.pages.vendorManagement.title}</h2>
          <p className="text-sm text-slate-500">{t.pages.vendorManagement.subtitle}</p>
        </div>
        <button
          onClick={() => void loadPageData()}
          className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          type="button"
        >
          {t.common.refresh}
        </button>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs uppercase tracking-wide text-amber-700">{t.pages.vendorManagement.totalOutstandingLabel}</p>
        <p className="mt-1 text-2xl font-semibold text-amber-700">
          {t.common.currencySymbol} {formatMoney.format(totalVendorBalance)}
        </p>
      </div>

      <DataTable table={table} loading={loading} emptyMessage={t.pages.vendorManagement.noData} />

      <AddVendorBalanceModal
        open={modalCredit !== null}
        vendor={modalCredit?.vendor ?? null}
        onClose={() => setModalCredit(null)}
        onSaved={async () => {
          await loadPageData();
          addToast(t.pages.vendorManagement.balanceUpdatedToast, "success");
        }}
      />

      <PayVendorAmountModal
        open={modalPay !== null}
        vendor={modalPay?.vendor ?? null}
        bankAccounts={accounts}
        formatMoney={formatMoney}
        onClose={() => setModalPay(null)}
        onSaved={async () => {
          await loadPageData();
          addToast(t.pages.vendorManagement.paymentRecordedToast, "success");
        }}
      />
    </div>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}

function PayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M2 7h20" />
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 14h.01" />
      <path d="M6 11h6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
