import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useCulture } from "../context/CultureContext";
import { useT } from "../hooks/useT";
import { bankAccountsApi } from "../services/api";
import DataTable from "../components/DataTable";
import BankBalanceFormModal from "../components/BankBalanceFormModal";
import type {
  BankAccountBalanceSummary,
  BankAccountCreditLogListItem,
  BankAccountListItem,
} from "../types/bankAccount";

type CreditLogRow = BankAccountCreditLogListItem;

export default function BankAccountDetails() {
  const t = useT();
  const { locale } = useCulture();
  const { accountId } = useParams();
  const parsedId = Number(accountId);
  const [account, setAccount] = useState<BankAccountListItem | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [logs, setLogs] = useState<CreditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openBalanceModal, setOpenBalanceModal] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "loggedOn", desc: true }]);

  const formatMoney = useMemo(
    () =>
      new Intl.NumberFormat(locale === "np" ? "ne-NP" : "en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  useEffect(() => {
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      setError("Invalid account id.");
      setLoading(false);
      return;
    }
    void loadDetails(parsedId);
  }, [parsedId]);

  async function loadDetails(id: number) {
    try {
      setLoading(true);
      setError(null);

      const [accountData, balances, logsData] = await Promise.all([
        bankAccountsApi.getById(id),
        bankAccountsApi.listBalances(),
        bankAccountsApi.listCreditLogsByAccount(id),
      ]);

      setAccount(accountData);
      setLogs(logsData ?? []);

      const matchingBalance = (balances ?? []).find((item: BankAccountBalanceSummary) => item.bankAccountId === id);
      const computedLogTotal = (logsData ?? []).reduce(
        (sum: number, item: BankAccountCreditLogListItem) => sum + Number(item.amount || 0),
        0,
      );
      setTotalBalance(Number(matchingBalance?.totalBalance ?? computedLogTotal));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load account details.");
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo<ColumnDef<CreditLogRow>[]>(() => [
    {
      accessorKey: "loggedOn",
      header: t.pages.bankAccounts.creditDateLabel,
      cell: ({ row }) => <span>{new Date(row.original.loggedOn).toLocaleDateString()}</span>,
    },
    {
      accessorKey: "amount",
      header: t.pages.bankAccounts.creditAmountLabel,
      cell: ({ row }) => (
        <span className="font-medium text-emerald-700">
          {t.common.currencySymbol} {formatMoney.format(Number(row.original.amount || 0))}
        </span>
      ),
    },
    {
      accessorKey: "remarks",
      header: t.pages.bankAccounts.creditRemarksLabel,
      cell: ({ row }) => <span className="text-slate-600">{row.original.remarks || "—"}</span>,
    },
    {
      accessorKey: "createdBy",
      header: t.pages.bankAccounts.loggedByLabel,
      cell: ({ row }) => <span className="text-slate-600">{row.original.createdBy || "—"}</span>,
    },
  ], [t, formatMoney]);

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
          <h2 className="text-2xl font-semibold text-slate-800">{t.pages.bankAccounts.accountDetailTitle}</h2>
          <Link to="/account-management" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
            {t.pages.bankAccounts.backToAccounts}
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setOpenBalanceModal(true)}
          className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          disabled={!account}
        >
          {t.pages.bankAccounts.addBalanceButton}
        </button>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.pages.bankAccounts.bankNameLabel}</p>
          <p className="mt-1 text-base font-medium text-slate-800">{account?.bankName ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.pages.bankAccounts.accountNumberLabel}</p>
          <p className="mt-1 text-base font-medium text-slate-800">{account?.accountNumber ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.pages.bankAccounts.accountHolderLabel}</p>
          <p className="mt-1 text-base font-medium text-slate-800">{account?.accountHolder ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-700">{t.pages.bankAccounts.totalBalanceLabel}</p>
          <p className="mt-1 text-lg font-semibold text-emerald-700">
            {t.common.currencySymbol} {formatMoney.format(totalBalance)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-800">{t.pages.bankAccounts.creditLogsTitle}</h3>
        <DataTable table={table} loading={loading} emptyMessage={t.pages.bankAccounts.noCreditLogs} />
      </div>

      <BankBalanceFormModal
        open={openBalanceModal}
        account={account}
        onClose={() => setOpenBalanceModal(false)}
        onSaved={async () => {
          if (!Number.isFinite(parsedId) || parsedId <= 0) return;
          await loadDetails(parsedId);
        }}
      />
    </div>
  );
}
