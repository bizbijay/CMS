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
import { AddPartyBalanceModal, ReceivePartyAmountModal } from "../components/PartyBalanceModals";
import { useToast } from "../components/Toaster";
import { useCulture } from "../context/CultureContext";
import { useT } from "../hooks/useT";
import { partyNamesApi } from "../services/api";
import type { PartyBalanceLogListItem, PartyNameListItem } from "../types/partyName";
import { formatBSDate } from "../utils/nepaliDate";

export default function PartyManagementLogs() {
  const t = useT();
  const { locale } = useCulture();
  const { addToast } = useToast();
  const { partyId } = useParams();
  const parsedId = Number(partyId);
  const [party, setParty] = useState<PartyNameListItem | null>(null);
  const [logs, setLogs] = useState<PartyBalanceLogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addBalanceOpen, setAddBalanceOpen] = useState(false);
  const [receiveAmountOpen, setReceiveAmountOpen] = useState(false);
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
      setError("Invalid party id.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [partyData, logsData] = await Promise.all([
        partyNamesApi.getById(parsedId),
        partyNamesApi.listBalanceLogsByParty(parsedId),
      ]);
      setParty(partyData);
      setLogs(logsData ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load party logs.");
    } finally {
      setLoading(false);
    }
  }, [parsedId]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<PartyBalanceLogListItem>[]>(() => [
    {
      accessorKey: "loggedOn",
      header: t.pages.bankAccounts.creditDateLabel,
      cell: ({ row }) => <span>{formatBSDate(row.original.loggedOn, locale)}</span>,
    },
    {
      accessorKey: "entryType",
      header: t.pages.partyManagement.entryTypeLabel,
      cell: ({ row }) => {
        const isCredit = row.original.entryType === "credit";
        return (
          <span className={isCredit ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>
            {isCredit ? t.pages.partyManagement.creditLabel : t.pages.partyManagement.debitLabel}
          </span>
        );
      },
    },
    {
      accessorKey: "amount",
      header: t.pages.bankAccounts.amountLabel,
      cell: ({ row }) => (
        <span className="font-medium text-slate-800">
          {t.common.currencySymbol} {formatMoney.format(Number(row.original.amount || 0))}
        </span>
      ),
    },
    {
      accessorKey: "remarks",
      header: t.common.remarks,
      cell: ({ row }) => <span className="text-slate-600">{row.original.remarks || "-"}</span>,
    },
    {
      accessorKey: "createdBy",
      header: t.pages.bankAccounts.loggedByLabel,
      cell: ({ row }) => <span className="text-slate-600">{row.original.createdBy || "-"}</span>,
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
          <h2 className="text-2xl font-semibold text-slate-800">{t.pages.partyManagement.logsTitle}</h2>
          <Link to="/party-management" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
            {t.pages.partyManagement.backToManagement}
          </Link>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {t.common.refresh}
          </button>
          <button type="button" onClick={() => setAddBalanceOpen(true)} className="inline-flex items-center justify-center rounded border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100" disabled={!party}>
            {t.pages.partyManagement.addBalanceButton}
          </button>
          <button type="button" onClick={() => setReceiveAmountOpen(true)} className="inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" disabled={!party}>
            {t.pages.partyManagement.receiveAmountButton}
          </button>
        </div>
      </div>

      {error ? <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{t.common.name}</p>
          <p className="mt-1 text-base font-medium text-slate-800">{party?.name ?? "-"}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-700">{t.pages.partyManagement.totalBalanceLabel}</p>
          <p className="mt-1 text-lg font-semibold text-amber-700">{t.common.currencySymbol} {formatMoney.format(Number(party?.totalBalance || 0))}</p>
        </div>
      </div>

      <DataTable table={table} loading={loading} emptyMessage={t.pages.partyManagement.noLogs} />

      <AddPartyBalanceModal
        open={addBalanceOpen}
        party={party}
        onClose={() => setAddBalanceOpen(false)}
        onSaved={async () => {
          await load();
          addToast(t.pages.partyManagement.balanceUpdatedToast, "success");
        }}
      />

      <ReceivePartyAmountModal
        open={receiveAmountOpen}
        party={party}
        formatMoney={formatMoney}
        onClose={() => setReceiveAmountOpen(false)}
        onSaved={async () => {
          await load();
          addToast(t.pages.partyManagement.receiveRecordedToast, "success");
        }}
      />
    </div>
  );
}
