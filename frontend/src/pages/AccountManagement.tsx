import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCulture } from "../context/CultureContext";
import { useT } from "../hooks/useT";
import { bankAccountsApi } from "../services/api";
import BankBalanceFormModal from "../components/BankBalanceFormModal";
import DataTable from "../components/DataTable";
import IconButton from "../components/IconButton";
import type {
  BankAccountBalanceSummary,
  BankAccountListItem,
} from "../types/bankAccount";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

interface AccountRow extends BankAccountListItem {
  totalBalance: number;
}

export default function AccountManagement() {
  const navigate = useNavigate();
  const t = useT();
  const { locale } = useCulture();
  const [accounts, setAccounts] = useState<BankAccountListItem[]>([]);
  const [balances, setBalances] = useState<BankAccountBalanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceAccount, setBalanceAccount] = useState<BankAccountListItem | null>(null);
  const [accountSorting, setAccountSorting] = useState<SortingState>([{ id: "bankName", desc: false }]);

  const formatMoney = useMemo(
    () =>
      new Intl.NumberFormat(locale === "np" ? "ne-NP" : "en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  useEffect(() => {
    void loadPageData();
  }, []);

  async function loadPageData() {
    try {
      setLoading(true);
      setError(null);
      const [accountData, balanceData] = await Promise.all([
        bankAccountsApi.list(),
        bankAccountsApi.listBalances(),
      ]);
      setAccounts(accountData ?? []);
      setBalances(balanceData ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load account management data.");
    } finally {
      setLoading(false);
    }
  }

  const accountRows = useMemo<AccountRow[]>(() => {
    const totals = new Map<number, number>();

    for (const summary of balances) {
      totals.set(summary.bankAccountId, Number(summary.totalBalance || 0));
    }

    return accounts.map((item) => ({
      ...item,
      totalBalance: Number(item.totalBalance ?? totals.get(item.id) ?? 0),
    }));
  }, [accounts, balances]);

  const accountColumns = useMemo<ColumnDef<AccountRow>[]>(() => [
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
      accessorKey: "totalBalance",
      header: t.pages.bankAccounts.totalBalanceLabel,
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-700">
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
          <IconButton tooltip={t.pages.bankAccounts.viewDetailsButton} icon={<InfoIcon />} onClick={() => navigate(`/account-management/${row.original.id}`)} />
          <IconButton tooltip={t.pages.bankAccounts.addBalanceButton} icon={<PlusCircleIcon />} onClick={() => setBalanceAccount(row.original)} />
        </div>
      ),
    },
  ], [t, formatMoney, navigate]);

  const accountsTable = useReactTable({
    data: accountRows,
    columns: accountColumns,
    state: { sorting: accountSorting },
    onSortingChange: setAccountSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const totalBalanceAllAccounts = useMemo(
    () => accountRows.reduce((sum, item) => sum + Number(item.totalBalance || 0), 0),
    [accountRows],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{t.pages.bankAccounts.managementTitle}</h2>
          <p className="text-sm text-slate-500">{t.pages.bankAccounts.subtitle}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">{t.pages.bankAccounts.totalBalanceLabel}</p>
        <p className="mt-1 text-2xl font-semibold text-emerald-700">
          {t.common.currencySymbol} {formatMoney.format(totalBalanceAllAccounts)}
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-slate-800">{t.pages.bankAccounts.accountsTableTitle}</h3>
        <DataTable table={accountsTable} loading={loading} emptyMessage={t.pages.bankAccounts.noData} />
      </div>

      <BankBalanceFormModal
        open={balanceAccount !== null}
        account={balanceAccount}
        onClose={() => setBalanceAccount(null)}
        onSaved={loadPageData}
      />
    </div>
  );
}

function InfoIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>;
}

function PlusCircleIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>;
}
