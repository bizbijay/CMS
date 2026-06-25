import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { vehicleMaintenanceLogsApi, vehiclesApi } from "../services/api";
import type { VehicleMaintenanceLogListItem } from "../types/vehicleMaintenance";
import DataTable from "../components/DataTable";
import ConfirmDialog from "../components/ConfirmDialog";
import Can from "../components/Can";
import { useToast } from "../components/Toaster";
import { useT } from "../hooks/useT";
import { formatBSDate } from "../utils/nepaliDate";
import NepaliCalendarPicker from "../components/NepaliCalendarPicker";

function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function VehicleMaintenanceLogs() {
  const { vehicleId: vehicleIdParam } = useParams<{ vehicleId: string }>();
  const vehicleId = Number(vehicleIdParam);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const t = useT();

  const [vehicleName, setVehicleName] = useState("");
  const [items, setItems] = useState<VehicleMaintenanceLogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);

  // Add log modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDate, setAddDate] = useState(todayIso());
  const [addRemarks, setAddRemarks] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Delete state
  const [pendingDelete, setPendingDelete] = useState<VehicleMaintenanceLogListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logs, vehicles] = await Promise.all([
        vehicleMaintenanceLogsApi.listByVehicle(vehicleId),
        vehiclesApi.list(),
      ]);
      setItems(logs);
      const v = vehicles.find(v => v.id === vehicleId);
      setVehicleName(v ? `${v.name} (${v.numberPlate})` : `Vehicle #${vehicleId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load maintenance logs.");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddSaving(true);
    try {
      const log = await vehicleMaintenanceLogsApi.create({
        vehicleId,
        date: addDate,
        remarks: addRemarks.trim() || null,
      });
      setShowAddModal(false);
      navigate(`/vehicle-maintenance/${vehicleId}/${log.id}`);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to create log.");
    } finally {
      setAddSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await vehicleMaintenanceLogsApi.remove(pendingDelete.id);
      setItems(prev => prev.filter(i => i.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast(t.pages.vehicleMaintenance.deletedToast, "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const fmt = (n: number) =>
    `${t.common.currencySymbol} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const columns = useMemo<ColumnDef<VehicleMaintenanceLogListItem>[]>(() => [
    {
      id: "sn", header: "S.N.", size: 60, enableSorting: false,
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        return <span className="text-slate-500 text-sm">{pageIndex * pageSize + row.index + 1}</span>;
      },
    },
    {
      accessorKey: "date",
      header: t.common.date,
      cell: ({ row }) => <span className="font-medium">{formatBSDate(row.original.date)}</span>,
    },
    {
      accessorKey: "partsCostTotal",
      header: t.pages.vehicleMaintenance.partsCost,
      cell: ({ row }) => <span>{fmt(row.original.partsCostTotal)}</span>,
    },
    {
      accessorKey: "wagesCostTotal",
      header: t.pages.vehicleMaintenance.wagesCost,
      cell: ({ row }) => <span>{fmt(row.original.wagesCostTotal)}</span>,
    },
    {
      accessorKey: "totalCost",
      header: t.pages.vehicleMaintenance.totalCost,
      cell: ({ row }) => <span className="font-semibold text-slate-800">{fmt(row.original.totalCost)}</span>,
    },
    {
      accessorKey: "remarks",
      header: t.common.remarks,
      enableSorting: false,
      cell: ({ row }) => <span className="text-slate-500 text-sm">{row.original.remarks ?? "—"}</span>,
    },
    {
      id: "actions", header: t.common.actions, enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="inline-flex gap-1.5">
          <Can do="vehicle_maintenance.edit">
            <button
              onClick={() => navigate(`/vehicle-maintenance/${vehicleId}/${row.original.id}`)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
            >
              <WrenchIcon />
              {t.common.edit}
            </button>
          </Can>
          <Can do="vehicle_maintenance.delete">
            <button
              onClick={() => setPendingDelete(row.original)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
            >
              <TrashIcon />
            </button>
          </Can>
        </div>
      ),
    },
  ], [t, navigate, vehicleId, fmt]);

  const table = useReactTable({
    data: items, columns, state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  const grandTotal = useMemo(() => items.reduce((s, i) => s + i.totalCost, 0), [items]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/vehicle-maintenance")} className="text-slate-500 hover:text-slate-800 transition-colors" title={t.common.back}>
            <BackIcon />
          </button>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">{t.pages.vehicleMaintenance.title}</h2>
            {vehicleName && <p className="text-sm text-slate-500">{vehicleName}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">{t.common.refresh}</button>
          <Can do="vehicle_maintenance.add">
            <button
              onClick={() => { setAddDate(todayIso()); setAddRemarks(""); setAddError(null); setShowAddModal(true); }}
              className="px-3 py-2 text-sm rounded bg-orange-600 hover:bg-orange-700 text-white font-medium flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              {t.pages.vehicleMaintenance.addButton}
            </button>
          </Can>
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex items-center justify-end gap-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded px-4 py-2">
          <span>{t.pages.vehicleMaintenance.totalCost}:</span>
          <span className="font-semibold text-slate-800">{fmt(grandTotal)}</span>
        </div>
      )}

      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

      <DataTable table={table} loading={loading} emptyMessage={t.pages.vehicleMaintenance.noData} />

      {/* Add Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <form onSubmit={handleAdd} className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{t.pages.vehicleMaintenance.addButton}</h3>
                <p className="text-sm text-slate-500">{t.pages.vehicleMaintenance.addSubtitle}</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M6 6l12 12M6 18L18 6" /></svg>
              </button>
            </div>
            {addError && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{addError}</div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.date}<span className="text-red-500 ml-0.5">*</span></label>
              <NepaliCalendarPicker value={addDate} onChange={setAddDate} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.remarks}</label>
              <textarea value={addRemarks} onChange={e => setAddRemarks(e.target.value)} rows={2} placeholder="Optional notes" className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddModal(false)} disabled={addSaving} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">{t.common.cancel}</button>
              <button type="submit" disabled={addSaving} className="px-4 py-2 text-sm rounded bg-orange-600 hover:bg-orange-700 text-white font-medium disabled:opacity-50">
                {addSaving ? t.common.saving : t.pages.vehicleMaintenance.createAndOpen}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.modal.vehicleMaintenance.deleteTitle}
        message={t.modal.vehicleMaintenance.deleteMessage}
        confirmLabel={t.common.delete}
        tone="danger" busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => deleting ? undefined : setPendingDelete(null)}
      />
    </div>
  );
}

function WrenchIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
}
function TrashIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>;
}
function BackIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
}
