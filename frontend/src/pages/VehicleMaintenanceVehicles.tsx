import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  type ColumnDef, type SortingState,
} from "@tanstack/react-table";
import { vehiclesApi } from "../services/api";
import type { VehicleListItem } from "../types/vehicles";
import DataTable from "../components/DataTable";
import { useT } from "../hooks/useT";

const TYPE_LABELS: Record<string, string> = { tipper: "Tipper", jcb: "JCB", nissan: "Nissan" };

export default function VehicleMaintenanceVehicles() {
  const navigate = useNavigate();
  const t = useT();
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "name", desc: false }]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVehicles(await vehiclesApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const columns = useMemo<ColumnDef<VehicleListItem>[]>(() => [
    {
      accessorKey: "name",
      header: t.common.vehicle,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.name}</span>,
    },
    {
      accessorKey: "numberPlate",
      header: t.pages.vehicles.numberPlate,
      cell: ({ row }) => <span className="font-mono">{row.original.numberPlate}</span>,
    },
    {
      accessorKey: "type",
      header: t.pages.vehicles.type,
      cell: ({ row }) => TYPE_LABELS[row.original.type] ?? row.original.type,
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <button
          onClick={() => navigate(`/vehicle-maintenance/${row.original.id}`)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
        >
          <WrenchIcon />
          {t.common.maintenance}
        </button>
      ),
    },
  ], [t, navigate]);

  const table = useReactTable({
    data: vehicles, columns, state: { sorting }, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.nav.vehicleMaintenance}</h2>
        <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">{t.common.refresh}</button>
      </div>
      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}
      <DataTable table={table} loading={loading} emptyMessage={t.pages.vehicles.noData} />
    </div>
  );
}

function WrenchIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
}
