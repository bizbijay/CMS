import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { fuelLogsApi, usersApi, vehiclesApi, getStoredUser } from "../services/api";
import { formatBSDate } from "../utils/nepaliDate";
import type { FuelLogListItem } from "../types/fuelLog";
import FuelLogFormModal, { type FuelLogFormMode } from "../components/FuelLogFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useT } from "../hooks/useT";

export default function FuelLog() {
  const { addToast } = useToast();
  const t = useT();

  const [items, setItems] = useState<FuelLogListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<FuelLogFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FuelLogListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [driverFilter, setDriverFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [driverOptions, setDriverOptions] = useState<string[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);

  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const currentUserId = getStoredUser()?.id ?? 0;
  const [isDriver, setIsDriver] = useState(false);

  // Fetch driver options and vehicle options on mount
  useEffect(() => {
    Promise.all([
      usersApi.drivers().catch(() => []),
      usersApi.dozerDrivers().catch(() => []),
      vehiclesApi.list().catch(() => []),
    ])
      .then(([drivers, operators, vehicleList]) => {
        const isDriverUser =
          drivers.some((d) => d.id === currentUserId) ||
          operators.some((o) => o.id === currentUserId);
        setIsDriver(isDriverUser);

        const allDriverNames = Array.from(
          new Set(
            [...drivers, ...operators]
              .map((u) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username)
              .filter(Boolean)
          )
        ).sort();
        setDriverOptions(allDriverNames);

        const allVehicles = Array.from(
          new Set(vehicleList.map((v) => v.name).filter((v): v is string => !!v))
        ).sort();
        setVehicleOptions(allVehicles);
      })
      .catch(() => {});
  }, [currentUserId]);

  // Server-side data fetching
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sortField = sorting[0]?.id ?? "date";
      const sortDescending = sorting[0]?.desc ?? true;

      const res = await fuelLogsApi.list({
        pageNumber: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        driverName: driverFilter || undefined,
        vehicleName: vehicleFilter || undefined,
        driverId: isDriver ? currentUserId : undefined,
        sortBy: sortField,
        sortDescending,
      });

      setItems(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fuel logs.");
    } finally {
      setLoading(false);
    }
  }, [pagination, sorting, driverFilter, vehicleFilter, isDriver, currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDriverFilterChange = (val: string) => {
    setDriverFilter(val);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleVehicleFilterChange = (val: string) => {
    setVehicleFilter(val);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  function onSaved(_item: FuelLogListItem, kind: FuelLogFormMode["kind"]) {
    if (kind === "add") {
      addToast("Fuel log added successfully.", "success");
    } else {
      addToast("Fuel log updated successfully.", "success");
    }
    load();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await fuelLogsApi.remove(pendingDelete.id);
      addToast("Fuel log deleted.", "success");
      setPendingDelete(null);
      load();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<FuelLogListItem>[]>(
    () => [
      {
        accessorKey: "driverName",
        header: t.common.driver,
        cell: ({ row }) => (
          <span className="font-medium text-slate-800">{row.original.driverName}</span>
        ),
      },
      {
        accessorKey: "vehicleName",
        header: t.common.vehicle,
      },
      {
        id: "partyName",
        header: t.common.partyName,
        enableSorting: false,
        cell: ({ row }) => row.original.partyNameName || row.original.partyNameOther || "-",
      },
      {
        accessorKey: "fuelTypeName",
        header: t.common.fuelType,
      },
      {
        accessorKey: "quantity",
        header: t.common.quantityL,
        cell: ({ row }) => row.original.quantity.toFixed(2),
      },
      {
        accessorKey: "price",
        header: t.common.price,
        cell: ({ row }) => `${t.common.currencySymbol} ${row.original.price.toFixed(2)}`,
      },
      {
        id: "total",
        header: t.common.total,
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-medium">
            {t.common.currencySymbol}{" "}
            {(row.original.quantity * row.original.price).toFixed(2)}
          </span>
        ),
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
            <Can do="fuel_log.edit">
              <IconButton
                tooltip="Edit"
                icon={<PencilIcon />}
                onClick={() => setModalMode({ kind: "edit", log: row.original })}
              />
            </Can>
            <Can do="fuel_log.delete">
              <IconButton
                tooltip="Delete"
                tone="danger"
                icon={<TrashIcon />}
                onClick={() => setPendingDelete(row.original)}
              />
            </Can>
          </div>
        ),
      },
    ],
    [t, setModalMode, setPendingDelete]
  );

  const columnVisibility = useMemo(
    () => ({
      driverName: !isDriver,
      vehicleName: !isDriver,
    }),
    [isDriver]
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, pagination, columnVisibility },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    rowCount: totalCount,
    getCoreRowModel: getCoreRowModel(),
  });

  const emptyMessage =
    totalCount === 0
      ? driverFilter || vehicleFilter
        ? t.pages.fuelLog.noMatch
        : t.pages.fuelLog.noData
      : t.pages.fuelLog.noMatch;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.fuelLog.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {t.common.refresh}
          </button>
          <Can do="fuel_log.add">
            <button
              onClick={() => setModalMode({ kind: "add" })}
              className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.2}
                className="w-4 h-4"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {t.pages.fuelLog.addButton}
            </button>
          </Can>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {!isDriver && (
          <select
            value={driverFilter}
            onChange={(e) => handleDriverFilterChange(e.target.value)}
            className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.common.allDrivers}</option>
            {driverOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
        <select
          value={vehicleFilter}
          onChange={(e) => handleVehicleFilterChange(e.target.value)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t.common.allVehicles}</option>
          {vehicleOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {(driverFilter || vehicleFilter) && (
          <button
            onClick={() => {
              setDriverFilter("");
              setVehicleFilter("");
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="px-3 py-1.5 text-sm rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            {t.common.clearFilters}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">
          {error}
        </div>
      )}

      <DataTable table={table} loading={loading} emptyMessage={emptyMessage} totalCount={totalCount} />

      <FuelLogFormModal
        open={modalMode !== null}
        mode={modalMode ?? { kind: "add" }}
        onClose={() => setModalMode(null)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.modal.fuelLog.deleteTitle}
        message={pendingDelete ? t.modal.fuelLog.deleteMessage : ""}
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
