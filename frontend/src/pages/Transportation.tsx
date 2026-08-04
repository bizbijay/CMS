import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { transportationsApi, usersApi, getStoredUser } from "../services/api";
import { formatBSDate } from "../utils/nepaliDate";
import type { TransportationListItem } from "../types/transportation";
import TransportationFormModal, { type TransportationFormMode } from "../components/TransportationFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useT } from "../hooks/useT";

export default function Transportation() {
  const { addToast } = useToast();
  const t = useT();
  const [items, setItems] = useState<TransportationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<TransportationFormMode | null>(null);
  const [modalKey, setModalKey] = useState(0);

  const openModal = useCallback((mode: TransportationFormMode) => {
    setModalKey(k => k + 1);
    setModalMode(mode);
  }, []);
  const [pendingDelete, setPendingDelete] = useState<TransportationListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);

  const currentUserId = getStoredUser()?.id ?? 0;
  const [isDriver, setIsDriver] = useState(false);
  const canViewCosts = getStoredUser()?.roleName?.toLowerCase() === 'admin';

  const [filterDriverId, setFilterDriverId] = useState<number | "">("");
  const [filterVehicleId, setFilterVehicleId] = useState<number | "">("");

  useEffect(() => {
    usersApi.drivers()
      .then(list => setIsDriver((list ?? []).some(d => d.id === currentUserId)))
      .catch(() => {});
  }, [currentUserId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await transportationsApi.list();
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transportation records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onSaved(item: TransportationListItem, kind: TransportationFormMode["kind"]) {
    if (kind === "add") {
      setItems((prev) => [item, ...prev]);
      addToast("Transportation added successfully.", "success");
    } else {
      setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
      addToast("Transportation updated successfully.", "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await transportationsApi.remove(pendingDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast("Transportation deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const driverOptions = useMemo(() => {
    const seen = new Map<number, string>();
    items.forEach(i => { if (i.transportedById != null && !seen.has(i.transportedById)) seen.set(i.transportedById, i.transportedByName); });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const vehicleOptions = useMemo(() => {
    const seen = new Map<number, string>();
    items.forEach(i => { if (i.vehicleId != null && i.vehicleName && !seen.has(i.vehicleId)) seen.set(i.vehicleId, i.vehicleName); });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const visibleItems = useMemo(() => {
    let result = isDriver ? items.filter(i => i.transportedById === currentUserId) : items;
    if (filterDriverId !== "") result = result.filter(i => i.transportedById === filterDriverId);
    if (filterVehicleId !== "") result = result.filter(i => i.vehicleId === filterVehicleId);
    return result;
  }, [isDriver, items, currentUserId, filterDriverId, filterVehicleId]);

  const hasFilters = filterDriverId !== "" || filterVehicleId !== "";

  function clearFilters() {
    setFilterDriverId("");
    setFilterVehicleId("");
  }

  const columns = useMemo<ColumnDef<TransportationListItem>[]>(() => [
    {
      accessorKey: "transportedByName",
      header: t.common.transportedBy,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.transportedByName}</span>,
    },
    {
      accessorKey: "vehicleName",
      header: t.common.vehicle,
      cell: ({ row }) => row.original.vehicleName ?? <span className="text-slate-400">—</span>,
    },
    {
      accessorKey: "materialName",
      header: t.common.material,
      cell: ({ row }) => row.original.materialName ?? <span className="text-slate-400">—</span>,
    },
    {
      accessorKey: "vendorName",
      header: t.common.vendor,
    },
    {
      accessorKey: "projectName",
      header: t.common.project,
    },
    {
      accessorKey: "partyNameName",
      header: t.common.partyName,
      cell: ({ row }) => row.original.partyNameName ?? <span className="text-slate-400">—</span>,
    },
    {
      accessorKey: "location",
      header: t.common.location,
      cell: ({ row }) => row.original.location ?? <span className="text-slate-400">—</span>,
    },
    {
      accessorKey: "noOfTip",
      header: t.common.noOfTip,
      cell: ({ row }) => row.original.noOfTip != null ? String(row.original.noOfTip) : <span className="text-slate-400">—</span>,
    },
    {
      accessorKey: "materialCost",
      header: t.common.materialCost,
      cell: ({ row }) => row.original.materialCost != null
        ? `${t.common.currencySymbol} ${row.original.materialCost.toLocaleString()}`
        : <span className="text-slate-400">—</span>,
    },
    {
      accessorKey: "tax",
      header: t.common.tax,
      cell: ({ row }) => row.original.tax != null
        ? `${t.common.currencySymbol} ${row.original.tax.toLocaleString()}`
        : <span className="text-slate-400">—</span>,
    },
    {
      accessorKey: "wages",
      header: t.common.wagesNrs,
      cell: ({ row }) => row.original.wages != null
        ? `${t.common.currencySymbol} ${row.original.wages.toLocaleString()}`
        : <span className="text-slate-400">—</span>,
    },
    {
      accessorKey: "date",
      header: t.common.date,
      cell: ({ row }) => formatDate(row.original.date),
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="inline-flex gap-1.5">
          <Can do="transportation.edit">
            <IconButton tooltip="Edit" icon={<PencilIcon />} onClick={() => openModal({ kind: "edit", transportation: row.original })} />
          </Can>
          <Can do="transportation.delete">
            <IconButton tooltip="Delete" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDelete(row.original)} />
          </Can>
        </div>
      ),
    },
  ], [t, openModal, setPendingDelete]);

  const columnVisibility = useMemo(() => ({
    transportedByName: !isDriver,
    vehicleName: !isDriver,
    materialCost: canViewCosts,
    tax: canViewCosts,
  }), [isDriver, canViewCosts]);

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
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.transportation.title}</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {t.common.refresh}
          </button>
          <Can do="transportation.add">
            <button
              onClick={() => openModal({ kind: "add" })}
              className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {t.pages.transportation.addButton}
            </button>
          </Can>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isDriver && (
          <select
            value={filterDriverId}
            onChange={e => setFilterDriverId(e.target.value === "" ? "" : Number(e.target.value))}
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.common.allDrivers}</option>
            {driverOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}
        <select
          value={filterVehicleId}
          onChange={e => setFilterVehicleId(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t.common.allVehicles}</option>
          {vehicleOptions.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-500 hover:bg-slate-50"
          >
            {t.common.clearFilters}
          </button>
        )}
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

      <DataTable table={table} loading={loading} emptyMessage={t.pages.transportation.noData} />

      <TransportationFormModal
        key={modalKey}
        open={modalMode !== null}
        mode={modalMode ?? { kind: "add" }}
        onClose={() => setModalMode(null)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.modal.transportation.deleteTitle}
        message={pendingDelete ? t.modal.transportation.deleteMessage : ""}
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
