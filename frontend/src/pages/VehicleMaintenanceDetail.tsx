import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import {
  vehicleMaintenanceLogsApi,
  vehicleMaintenancePartsApi,
  vehicleMaintenanceWagesApi,
} from "../services/api";
import type { VehicleMaintenanceLogListItem, VehicleMaintenancePartListItem, VehicleMaintenanceWageListItem } from "../types/vehicleMaintenance";
import VehicleMaintenancePartFormModal, { type VehicleMaintenancePartFormMode } from "../components/VehicleMaintenancePartFormModal";
import VehicleMaintenanceWageFormModal, { type VehicleMaintenanceWageFormMode } from "../components/VehicleMaintenanceWageFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import Can from "../components/Can";
import IconButton from "../components/IconButton";
import { useToast } from "../components/Toaster";
import { useT } from "../hooks/useT";
import NepaliCalendarPicker from "../components/NepaliCalendarPicker";

export default function VehicleMaintenanceDetail() {
  const { vehicleId: vehicleIdParam, logId: logIdParam } = useParams<{ vehicleId: string; logId: string }>();
  const vehicleId = Number(vehicleIdParam);
  const logId = Number(logIdParam);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const t = useT();

  const [log, setLog] = useState<VehicleMaintenanceLogListItem | null>(null);
  const [parts, setParts] = useState<VehicleMaintenancePartListItem[]>([]);
  const [wages, setWages] = useState<VehicleMaintenanceWageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Header edit state
  const [editDate, setEditDate] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [headerSaving, setHeaderSaving] = useState(false);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [headerDirty, setHeaderDirty] = useState(false);

  // Part modal
  const [partMode, setPartMode] = useState<VehicleMaintenancePartFormMode | null>(null);
  const [partKey, setPartKey] = useState(0);
  const [pendingDeletePart, setPendingDeletePart] = useState<VehicleMaintenancePartListItem | null>(null);
  const [deletingPart, setDeletingPart] = useState(false);

  // Wage modal
  const [wageMode, setWageMode] = useState<VehicleMaintenanceWageFormMode | null>(null);
  const [wageKey, setWageKey] = useState(0);
  const [pendingDeleteWage, setPendingDeleteWage] = useState<VehicleMaintenanceWageListItem | null>(null);
  const [deletingWage, setDeletingWage] = useState(false);

  const [partSorting] = useState<SortingState>([]);
  const [wageSorting] = useState<SortingState>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [logData, partsData, wagesData] = await Promise.all([
        vehicleMaintenanceLogsApi.getById(logId),
        vehicleMaintenancePartsApi.listByLog(logId),
        vehicleMaintenanceWagesApi.listByLog(logId),
      ]);
      setLog(logData);
      setEditDate(logData.date.slice(0, 10));
      setEditRemarks(logData.remarks ?? "");
      setParts(partsData);
      setWages(wagesData);
      setHeaderDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load maintenance details.");
    } finally {
      setLoading(false);
    }
  }, [logId]);

  useEffect(() => { load(); }, [load]);

  async function saveHeader(e: React.FormEvent) {
    e.preventDefault();
    if (!log) return;
    setHeaderError(null);
    setHeaderSaving(true);
    try {
      const updated = await vehicleMaintenanceLogsApi.update(logId, {
        vehicleId: log.vehicleId,
        date: editDate,
        remarks: editRemarks.trim() || null,
      });
      setLog(updated);
      setHeaderDirty(false);
      addToast(t.pages.vehicleMaintenance.updatedToast, "success");
    } catch (err) {
      setHeaderError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setHeaderSaving(false);
    }
  }

  function openPartModal(mode: VehicleMaintenancePartFormMode) { setPartKey(k => k + 1); setPartMode(mode); }
  function openWageModal(mode: VehicleMaintenanceWageFormMode) { setWageKey(k => k + 1); setWageMode(mode); }

  function onPartSaved(part: VehicleMaintenancePartListItem, kind: "add" | "edit") {
    if (kind === "add") setParts(prev => [...prev, part]);
    else setParts(prev => prev.map(p => p.id === part.id ? part : p));
    addToast(kind === "add" ? t.pages.vehicleMaintenance.partAddedToast : t.pages.vehicleMaintenance.partUpdatedToast, "success");
  }

  function onWageSaved(wage: VehicleMaintenanceWageListItem, kind: "add" | "edit") {
    if (kind === "add") setWages(prev => [...prev, wage]);
    else setWages(prev => prev.map(w => w.id === wage.id ? wage : w));
    addToast(kind === "add" ? t.pages.vehicleMaintenance.wageAddedToast : t.pages.vehicleMaintenance.wageUpdatedToast, "success");
  }

  async function confirmDeletePart() {
    if (!pendingDeletePart) return;
    setDeletingPart(true);
    try {
      await vehicleMaintenancePartsApi.remove(pendingDeletePart.id);
      setParts(prev => prev.filter(p => p.id !== pendingDeletePart.id));
      setPendingDeletePart(null);
      addToast(t.pages.vehicleMaintenance.partDeletedToast, "success");
    } catch (err) { addToast(err instanceof Error ? err.message : "Delete failed.", "error"); }
    finally { setDeletingPart(false); }
  }

  async function confirmDeleteWage() {
    if (!pendingDeleteWage) return;
    setDeletingWage(true);
    try {
      await vehicleMaintenanceWagesApi.remove(pendingDeleteWage.id);
      setWages(prev => prev.filter(w => w.id !== pendingDeleteWage.id));
      setPendingDeleteWage(null);
      addToast(t.pages.vehicleMaintenance.wageDeletedToast, "success");
    } catch (err) { addToast(err instanceof Error ? err.message : "Delete failed.", "error"); }
    finally { setDeletingWage(false); }
  }

  const fmt = (n: number) =>
    `${t.common.currencySymbol} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const partColumns = useMemo<ColumnDef<VehicleMaintenancePartListItem>[]>(() => [
    { id: "sn", header: "S.N.", size: 50, enableSorting: false, cell: ({ row }) => <span className="text-slate-500 text-sm">{row.index + 1}</span> },
    { accessorKey: "partName", header: t.common.partName, cell: ({ row }) => <span className="font-medium">{row.original.partName}</span> },
    { accessorKey: "quantity", header: t.common.quantity, cell: ({ row }) => <span>{row.original.quantity?.toLocaleString() ?? "—"}</span> },
    { accessorKey: "unitCost", header: t.common.unitCost, cell: ({ row }) => <span>{row.original.unitCost != null ? fmt(row.original.unitCost) : "—"}</span> },
    { accessorKey: "totalCost", header: t.common.totalCost, cell: ({ row }) => <span className="font-semibold">{row.original.totalCost != null ? fmt(row.original.totalCost) : "—"}</span> },
    { accessorKey: "remarks", header: t.common.remarks, enableSorting: false, cell: ({ row }) => <span className="text-slate-500 text-sm">{row.original.remarks ?? "—"}</span> },
    {
      id: "actions", header: t.common.actions, enableSorting: false, meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="inline-flex gap-1.5">
          <Can do="vehicle_maintenance.edit">
            <IconButton tooltip="Edit part" icon={<PencilIcon />} onClick={() => openPartModal({ kind: "edit", part: row.original })} />
          </Can>
          <Can do="vehicle_maintenance.delete">
            <IconButton tooltip="Delete part" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDeletePart(row.original)} />
          </Can>
        </div>
      ),
    },
  ], [t, fmt]);

  const wageColumns = useMemo<ColumnDef<VehicleMaintenanceWageListItem>[]>(() => [
    { id: "sn", header: "S.N.", size: 50, enableSorting: false, cell: ({ row }) => <span className="text-slate-500 text-sm">{row.index + 1}</span> },
    { accessorKey: "numberOfWorkers", header: t.common.numberOfWorkers, cell: ({ row }) => <span>{row.original.numberOfWorkers}</span> },
    { accessorKey: "rate", header: t.common.rate, cell: ({ row }) => <span>{fmt(row.original.rate)}</span> },
    { accessorKey: "totalAmount", header: t.common.totalAmount, cell: ({ row }) => <span className="font-semibold">{fmt(row.original.totalAmount)}</span> },
    { accessorKey: "remarks", header: t.common.remarks, enableSorting: false, cell: ({ row }) => <span className="text-slate-500 text-sm">{row.original.remarks ?? "—"}</span> },
    {
      id: "actions", header: t.common.actions, enableSorting: false, meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="inline-flex gap-1.5">
          <Can do="vehicle_maintenance.edit">
            <IconButton tooltip="Edit wage" icon={<PencilIcon />} onClick={() => openWageModal({ kind: "edit", wage: row.original })} />
          </Can>
          <Can do="vehicle_maintenance.delete">
            <IconButton tooltip="Delete wage" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDeleteWage(row.original)} />
          </Can>
        </div>
      ),
    },
  ], [t, fmt]);

  const partTable = useReactTable({ data: parts, columns: partColumns, state: { sorting: partSorting }, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });
  const wageTable = useReactTable({ data: wages, columns: wageColumns, state: { sorting: wageSorting }, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() });

  const partsCostTotal = useMemo(() => parts.reduce((s, p) => s + (p.totalCost ?? 0), 0), [parts]);
  const wagesCostTotal = useMemo(() => wages.reduce((s, w) => s + w.totalAmount, 0), [wages]);
  const grandTotal = partsCostTotal + wagesCostTotal;

  if (loading) return <div className="flex items-center justify-center py-20 text-slate-500 text-sm">{t.common.loading}</div>;
  if (error) return <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>;
  if (!log) return null;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate(`/vehicle-maintenance/${vehicleId}`)} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 group">
          <BackIcon />
          <span className="group-hover:underline">{t.pages.vehicleMaintenance.backToLogs}</span>
        </button>
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.vehicleMaintenance.detailTitle}</h2>
        <p className="text-slate-500 mt-0.5">{log.vehicleName} ({log.vehicleNumberPlate})</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label={t.pages.vehicleMaintenance.partsCost} value={fmt(partsCostTotal)} color="orange" />
        <SummaryCard label={t.pages.vehicleMaintenance.wagesCost} value={fmt(wagesCostTotal)} color="blue" />
        <SummaryCard label={t.pages.vehicleMaintenance.totalCost} value={fmt(grandTotal)} color="slate" grand />
      </div>

      {/* Log Header Edit */}
      <form onSubmit={saveHeader} className="rounded-lg border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-700">{t.pages.vehicleMaintenance.logDetails}</h3>
        {headerError && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{headerError}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.date}<span className="text-red-500 ml-0.5">*</span></label>
            <NepaliCalendarPicker value={editDate} onChange={v => { setEditDate(v); setHeaderDirty(true); }} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.remarks}</label>
            <input type="text" value={editRemarks} onChange={e => { setEditRemarks(e.target.value); setHeaderDirty(true); }} placeholder="Optional notes" className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
          </div>
        </div>
        {headerDirty && (
          <div className="flex justify-end">
            <button type="submit" disabled={headerSaving} className="px-4 py-2 text-sm rounded bg-orange-600 hover:bg-orange-700 text-white font-medium disabled:opacity-50">
              {headerSaving ? t.common.saving : t.common.saveChanges}
            </button>
          </div>
        )}
      </form>

      {/* Parts Section */}
      <SectionCard
        title={t.pages.vehicleMaintenance.partsTitle}
        subtotal={fmt(partsCostTotal)}
        color="orange"
        count={parts.length}
        addButton={
          <Can do="vehicle_maintenance.add">
            <button onClick={() => openPartModal({ kind: "add", logId })} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-orange-600 hover:bg-orange-700 text-white transition-colors">
              <PlusIcon />
              {t.pages.vehicleMaintenance.addPart}
            </button>
          </Can>
        }
      >
        <DataTable table={partTable} loading={false} emptyMessage={t.pages.vehicleMaintenance.noParts} />
      </SectionCard>

      {/* Wages Section */}
      <SectionCard
        title={t.pages.vehicleMaintenance.wagesTitle}
        subtotal={fmt(wagesCostTotal)}
        color="blue"
        count={wages.length}
        addButton={
          <Can do="vehicle_maintenance.add">
            <button onClick={() => openWageModal({ kind: "add", logId })} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors">
              <PlusIcon />
              {t.pages.vehicleMaintenance.addWage}
            </button>
          </Can>
        }
      >
        <DataTable table={wageTable} loading={false} emptyMessage={t.pages.vehicleMaintenance.noWages} />
      </SectionCard>

      {/* Grand Total */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between">
        <span className="text-base font-bold text-slate-700">{t.pages.vehicleMaintenance.totalCost}</span>
        <span className="text-xl font-bold text-slate-900">{fmt(grandTotal)}</span>
      </div>

      {/* Part Modals */}
      {partMode && (
        <VehicleMaintenancePartFormModal key={partKey} open mode={partMode} onClose={() => setPartMode(null)} onSaved={onPartSaved} />
      )}
      <ConfirmDialog open={pendingDeletePart !== null} title={t.modal.vehicleMaintenance.deletePartTitle} message={t.modal.vehicleMaintenance.deletePartMessage}
        confirmLabel={t.common.delete} tone="danger" busy={deletingPart} onConfirm={confirmDeletePart} onCancel={() => deletingPart ? undefined : setPendingDeletePart(null)} />

      {/* Wage Modals */}
      {wageMode && (
        <VehicleMaintenanceWageFormModal key={wageKey} open mode={wageMode} onClose={() => setWageMode(null)} onSaved={onWageSaved} />
      )}
      <ConfirmDialog open={pendingDeleteWage !== null} title={t.modal.vehicleMaintenance.deleteWageTitle} message={t.modal.vehicleMaintenance.deleteWageMessage}
        confirmLabel={t.common.delete} tone="danger" busy={deletingWage} onConfirm={confirmDeleteWage} onCancel={() => deletingWage ? undefined : setPendingDeleteWage(null)} />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, grand }: { label: string; value: string; color: "orange" | "blue" | "slate"; grand?: boolean }) {
  const colorMap = {
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    slate: "bg-slate-100 border-slate-300 text-slate-700",
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className={`font-bold ${grand ? "text-lg" : "text-base"}`}>{value}</p>
    </div>
  );
}

function SectionCard({ title, subtotal, color, count, addButton, children }: {
  title: string; subtotal: string; color: "orange" | "blue"; count: number;
  addButton: ReactNode; children: ReactNode;
}) {
  const headerColor = { orange: "bg-orange-50 border-orange-200 text-orange-800", blue: "bg-blue-50 border-blue-200 text-blue-800" }[color];
  const badgeColor = { orange: "bg-orange-100 text-orange-700", blue: "bg-blue-100 text-blue-700" }[color];
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-3 border-b ${headerColor}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>{count} records</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm">{subtotal}</span>
          {addButton}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function PencilIcon() { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>; }
function TrashIcon() { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>; }
function PlusIcon() { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14" /></svg>; }
function BackIcon() { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>; }
