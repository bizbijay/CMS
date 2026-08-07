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
import { AddPartyBalanceModal, ReceivePartyAmountModal } from "../components/PartyBalanceModals";
import { partyNamesApi } from "../services/api";
import type { PartyNameListItem } from "../types/partyName";
import IconButton from "../components/IconButton";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useCulture } from "../context/CultureContext";
import { useT } from "../hooks/useT";

export default function PartyManagement() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const t = useT();
  const { locale } = useCulture();
  const [partyNames, setPartyNames] = useState<PartyNameListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addBalanceParty, setAddBalanceParty] = useState<PartyNameListItem | null>(null);
  const [receiveParty, setReceiveParty] = useState<PartyNameListItem | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const formatMoney = useMemo(
    () =>
      new Intl.NumberFormat(locale === "np" ? "ne-NP" : "en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [locale],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await partyNamesApi.list();
      setPartyNames(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load party names.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo<ColumnDef<PartyNameListItem>[]>(() => [
    {
      accessorKey: "name",
      header: t.common.name,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.name}</span>,
    },
    {
      accessorKey: "totalBalance",
      header: t.pages.partyManagement.totalBalanceLabel,
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
        <div className="inline-flex gap-1.5">
          <Can do="party_names.edit">
            <IconButton tooltip={t.pages.partyManagement.addBalanceButton} icon={<PlusIcon />} onClick={() => setAddBalanceParty(row.original)} />
          </Can>
          <Can do="party_names.edit">
            <IconButton tooltip={t.pages.partyManagement.receiveAmountButton} icon={<ReceiveIcon />} onClick={() => setReceiveParty(row.original)} />
          </Can>
          <IconButton tooltip={t.pages.partyManagement.viewLogsButton} icon={<InfoIcon />} onClick={() => navigate(`/party-management/${row.original.id}/logs`)} />
        </div>
      ),
    },
  ], [t, formatMoney, navigate]);

  const table = useReactTable({
    data: partyNames,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const totalPartyBalance = useMemo(
    () => partyNames.reduce((sum, item) => sum + Number(item.totalBalance || 0), 0),
    [partyNames],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800">{t.pages.partyManagement.title}</h2>
          <p className="text-sm text-slate-500">{t.pages.partyManagement.subtitle}</p>
        </div>
        <button onClick={() => void load()} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">{t.common.refresh}</button>
      </div>

      {error ? <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div> : null}

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs uppercase tracking-wide text-amber-700">{t.pages.partyManagement.totalOutstandingLabel}</p>
        <p className="mt-1 text-2xl font-semibold text-amber-700">{t.common.currencySymbol} {formatMoney.format(totalPartyBalance)}</p>
      </div>

      <DataTable table={table} loading={loading} emptyMessage={t.pages.partyManagement.noData} />

      <AddPartyBalanceModal
        open={addBalanceParty !== null}
        party={addBalanceParty}
        onClose={() => setAddBalanceParty(null)}
        onSaved={async () => {
          await load();
          addToast(t.pages.partyManagement.balanceUpdatedToast, "success");
        }}
      />

      <ReceivePartyAmountModal
        open={receiveParty !== null}
        party={receiveParty}
        formatMoney={formatMoney}
        onClose={() => setReceiveParty(null)}
        onSaved={async () => {
          await load();
          addToast(t.pages.partyManagement.receiveRecordedToast, "success");
        }}
      />
    </div>
  );
}

function PlusIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>;
}

function ReceiveIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 4v16" /><path d="m5 11 7-7 7 7" /></svg>;
}

function InfoIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>;
}
