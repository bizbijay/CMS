import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { dozerLogsApi, usersApi, getStoredUser } from "../services/api";
import { formatBSDate } from "../utils/nepaliDate";
import type { DozerLogListItem } from "../types/dozerLog";
import DozerLogFormModal, { type DozerLogFormMode } from "../components/DozerLogFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useT } from "../hooks/useT";

export default function DozerLog() {
  const { addToast } = useToast();
  const t = useT();
  const [items, setItems] = useState<DozerLogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<DozerLogFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DozerLogListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "operationDate", desc: true }]);

  const currentUserId = getStoredUser()?.id ?? 0;
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    usersApi.dozerDrivers()
      .then(list => setIsDriver(list.some(d => d.id === currentUserId)))
      .catch(() => {});
  }, [currentUserId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await dozerLogsApi.list();
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dozer logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onSaved(item: DozerLogListItem, kind: DozerLogFormMode["kind"]) {
    if (kind === "add") {
      setItems((prev) => [item, ...prev]);
      addToast("JCB log added successfully.", "success");
    } else {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      addToast("JCB log updated successfully.", "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await dozerLogsApi.remove(pendingDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast("JCB log deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const visibleItems = useMemo(
    () => isDriver ? items.filter(i => i.driverId === currentUserId) : items,
    [isDriver, items, currentUserId]
  );

  const columns = useMemo<ColumnDef<DozerLogListItem>[]>(() => [
    {
      accessorKey: "driverName",
      header: t.common.operator,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.driverName}</span>,
    },
    {
      accessorKey: "vehicleName",
      header: t.common.vehicle,
      cell: ({ row }) => row.original.vehicleName ?? <span className="text-slate-400">—</span>,
    },
    {
      accessorKey: "operationDate",
      header: t.common.date,
      cell: ({ row }) => formatDate(row.original.operationDate),
    },
    {
      id: "totalMeterRun",
      header: t.common.totalMeterRun,
      cell: ({ row }) => formatMeterTime(row.original.totalMeterRun),
    },
    {
      accessorKey: "projectName",
      header: t.common.project,
    },
    {
      accessorKey: "wages",
      header: t.common.wagesNrs,
      cell: ({ row }) => row.original.wages != null
        ? `${t.common.currencySymbol} ${row.original.wages.toLocaleString()}`
        : <span className="text-slate-400">—</span>,
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="inline-flex gap-1.5">
          <Can do="dozer_log.edit">
            <IconButton tooltip="Edit" icon={<PencilIcon />} onClick={() => setModalMode({ kind: "edit", log: row.original })} />
          </Can>
          <Can do="dozer_log.delete">
            <IconButton tooltip="Delete" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDelete(row.original)} />
          </Can>
        </div>
      ),
    },
  ], [t, setModalMode, setPendingDelete]);

  const columnVisibility = useMemo(() => ({
    driverName: !isDriver,
    vehicleName: !isDriver,
  }), [isDriver]);

  const table = useReactTable({
    data: visibleItems,
    columns,
    state: { sorting, columnVisibility },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.dozerLog.title}</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {t.common.refresh}
          </button>
          <Can do="dozer_log.add">
            <button
              onClick={() => setModalMode({ kind: "add" })}
              className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {t.pages.dozerLog.addButton}
            </button>
          </Can>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

      <DataTable table={table} loading={loading} emptyMessage={t.pages.dozerLog.noData} />

      <DozerLogFormModal
        open={modalMode !== null}
        mode={modalMode ?? { kind: "add" }}
        onClose={() => setModalMode(null)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.modal.dozerLog.deleteTitle}
        message={pendingDelete ? t.modal.dozerLog.deleteMessage : ""}
        confirmLabel={t.common.delete}
        tone="danger"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </div>
  );
}

function formatDate(iso: string) {
  return formatBSDate(iso);
}

function formatMeterTime(decimalHours: number) {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${decimalHours.toFixed(1)} hrs (${hours}h ${String(minutes).padStart(2, "0")}m)`;
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
