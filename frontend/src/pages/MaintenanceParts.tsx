import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { maintenancePartsApi } from "../services/api";
import type { MaintenancePartListItem } from "../types/maintenancePart";
import MaintenancePartFormModal, { type MaintenancePartFormMode } from "../components/MaintenancePartFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import Can from "../components/Can";
import { useToast } from "../components/Toaster";
import { useT } from "../hooks/useT";

export default function MaintenanceParts() {
  const { addToast } = useToast();
  const t = useT();
  const [parts, setParts] = useState<MaintenancePartListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<MaintenancePartFormMode | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<MaintenancePartListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setParts(await maintenancePartsApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load parts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openModal(mode: MaintenancePartFormMode) { setModalKey(k => k + 1); setModalMode(mode); }

  function onSaved(part: MaintenancePartListItem, kind: "add" | "edit") {
    if (kind === "add") {
      setParts(prev => [...prev, part].sort((a, b) => a.name.localeCompare(b.name)));
      addToast(t.pages.maintenanceParts.addedToast, "success");
    } else {
      setParts(prev => prev.map(p => p.id === part.id ? part : p));
      addToast(t.pages.maintenanceParts.updatedToast, "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await maintenancePartsApi.remove(pendingDelete.id);
      setParts(prev => prev.filter(p => p.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast(t.pages.maintenanceParts.deletedToast, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<MaintenancePartListItem>[]>(() => [
    {
      id: "sn", header: "S.N.", size: 60, enableSorting: false,
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        return <span className="text-slate-500 text-sm">{pageIndex * pageSize + row.index + 1}</span>;
      },
    },
    {
      accessorKey: "name",
      header: t.common.partName,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.name}</span>,
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="inline-flex gap-1.5">
          <Can do="maintenance_parts.edit">
            <IconButton tooltip="Edit part" icon={<PencilIcon />} onClick={() => openModal({ kind: "edit", part: row.original })} />
          </Can>
          <Can do="maintenance_parts.delete">
            <IconButton tooltip="Delete part" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDelete(row.original)} />
          </Can>
        </div>
      ),
    },
  ], [t]);

  const table = useReactTable({
    data: parts, columns, state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.maintenanceParts.title}</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">{t.common.refresh}</button>
          <Can do="maintenance_parts.add">
            <button onClick={() => openModal({ kind: "add" })} className="px-3 py-2 text-sm rounded bg-orange-600 hover:bg-orange-700 text-white font-medium flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              {t.pages.maintenanceParts.addButton}
            </button>
          </Can>
        </div>
      </div>
      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}
      <DataTable table={table} loading={loading} emptyMessage={t.pages.maintenanceParts.noData} />
      <MaintenancePartFormModal key={modalKey} open={modalMode !== null} mode={modalMode ?? { kind: "add" }} onClose={() => setModalMode(null)} onSaved={onSaved} />
      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.modal.maintenanceParts.deleteTitle}
        message={pendingDelete ? t.modal.maintenanceParts.deleteMessage.replace("{{name}}", pendingDelete.name) : ""}
        confirmLabel={t.common.delete} tone="danger" busy={deleting}
        onConfirm={confirmDelete} onCancel={() => deleting ? undefined : setPendingDelete(null)}
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
