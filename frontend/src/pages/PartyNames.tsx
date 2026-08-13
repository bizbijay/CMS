import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { partyNamesApi } from "../services/api";
import type { PartyNameListItem } from "../types/partyName";
import PartyNameFormModal, { type PartyNameFormMode } from "../components/PartyNameFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useT } from "../hooks/useT";

export default function PartyNames() {
  const { addToast } = useToast();
  const t = useT();
  const [partyNames, setPartyNames] = useState<PartyNameListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<PartyNameFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PartyNameListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

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

  useEffect(() => { load(); }, [load]);

  function onSaved(partyName: PartyNameListItem, kind: PartyNameFormMode["kind"]) {
    if (kind === "add") {
      setPartyNames((prev) => [partyName, ...prev]);
      addToast("Party name added successfully.", "success");
    } else {
      setPartyNames((prev) => prev.map((item) => (item.id === partyName.id ? partyName : item)));
      addToast("Party name updated successfully.", "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await partyNamesApi.remove(pendingDelete.id);
      setPartyNames((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast("Party name deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<PartyNameListItem>[]>(() => [
    {
      accessorKey: "name",
      header: t.common.name,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.name}</span>,
    },
    {
      accessorKey: "type",
      header: t.modal.partyNames.typeLabel,
      cell: ({ row }) => <span className="text-slate-700">{formatPartyTypeLabel(row.original.type, t.modal.partyNames.typePetrolPump, t.modal.partyNames.typeOther)}</span>,
    },
    {
      accessorKey: "address",
      header: t.common.address,
      cell: ({ row }) => <span className="text-slate-700">{row.original.address?.trim() || "-"}</span>,
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="inline-flex gap-1.5">
          <Can do="party_names.edit">
            <IconButton tooltip="Edit party name" icon={<PencilIcon />} onClick={() => setModalMode({ kind: "edit", partyName: row.original })} />
          </Can>
          <Can do="party_names.delete">
            <IconButton tooltip="Delete party name" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDelete(row.original)} />
          </Can>
        </div>
      ),
    },
  ], [t]);

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.partyNames.title}</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">{t.common.refresh}</button>
          <Can do="party_names.add">
            <button onClick={() => setModalMode({ kind: "add" })} className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              {t.pages.partyNames.addButton}
            </button>
          </Can>
        </div>
      </div>
      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}
      <DataTable table={table} loading={loading} emptyMessage={t.pages.partyNames.noData} />
      <PartyNameFormModal open={modalMode !== null} mode={modalMode ?? { kind: "add" }} onClose={() => setModalMode(null)} onSaved={onSaved} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.modal.partyNames.deleteTitle}
        message={pendingDelete ? t.modal.partyNames.deleteMessage.replace("{{name}}", pendingDelete.name) : ""}
        confirmLabel={t.common.delete} tone="danger" busy={deleting}
        onConfirm={confirmDelete} onCancel={() => (deleting ? undefined : setPendingDelete(null))}
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

function formatPartyTypeLabel(type: PartyNameListItem["type"], petrolPumpLabel: string, otherLabel: string) {
  const normalized = String(type ?? "").toLowerCase().replace(/\s+/g, "_");
  if (normalized === "petrol_pump" || normalized === "petrolpump") {
    return petrolPumpLabel;
  }
  return otherLabel;
}
