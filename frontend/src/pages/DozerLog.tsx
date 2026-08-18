import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";
import { dozerLogsApi, usersApi, vehiclesApi, getStoredUser } from "../services/api";
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
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<DozerLogFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DozerLogListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [filterDriverId, setFilterDriverId] = useState<number | "">("");
  const [filterVehicleId, setFilterVehicleId] = useState<number | "">("");
  const [driverOptions, setDriverOptions] = useState<[number, string][]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<[number, string][]>([]);

  const [sorting, setSorting] = useState<SortingState>([{ id: "operationDate", desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const currentUserId = getStoredUser()?.id ?? 0;
  const [isDriver, setIsDriver] = useState(false);

  // Load operator and vehicle lookup options on mount
  useEffect(() => {
    Promise.all([
      usersApi.dozerDrivers().catch(() => []),
      vehiclesApi.list().catch(() => []),
    ])
      .then(([operators, vehicleList]) => {
        const isDriverUser = (operators ?? []).some((d) => d.id === currentUserId);
        setIsDriver(isDriverUser);

        const dOpts: [number, string][] = (operators ?? []).map((d) => [
          d.id,
          [d.firstName, d.lastName].filter(Boolean).join(" ") || d.username,
        ]);
        dOpts.sort((a, b) => a[1].localeCompare(b[1]));
        setDriverOptions(dOpts);

        const vOpts: [number, string][] = (vehicleList ?? [])
          .filter((v) => !!v.name)
          .map((v) => [v.id, v.name]);
        vOpts.sort((a, b) => a[1].localeCompare(b[1]));
        setVehicleOptions(vOpts);
      })
      .catch(() => {});
  }, [currentUserId]);

  // Server-side data fetching
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sortField = sorting[0]?.id ?? "operationDate";
      const sortDescending = sorting[0]?.desc ?? true;

      const res = await dozerLogsApi.list({
        pageNumber: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        driverId: isDriver
          ? currentUserId
          : filterDriverId !== ""
          ? filterDriverId
          : undefined,
        vehicleId: filterVehicleId !== "" ? filterVehicleId : undefined,
        sortBy: sortField,
        sortDescending,
      });

      setItems(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dozer logs.");
    } finally {
      setLoading(false);
    }
  }, [pagination, sorting, filterDriverId, filterVehicleId, isDriver, currentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDriverFilterChange = (val: number | "") => {
    setFilterDriverId(val);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleVehicleFilterChange = (val: number | "") => {
    setFilterVehicleId(val);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const hasFilters = filterDriverId !== "" || filterVehicleId !== "";

  function clearFilters() {
    setFilterDriverId("");
    setFilterVehicleId("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }

  function onSaved(_item: DozerLogListItem, kind: DozerLogFormMode["kind"]) {
    if (kind === "add") {
      addToast("JCB log added successfully.", "success");
    } else {
      addToast("JCB log updated successfully.", "success");
    }
    load();
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await dozerLogsApi.remove(pendingDelete.id);
      addToast("JCB log deleted.", "success");
      setPendingDelete(null);
      load();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<DozerLogListItem>[]>(
    () => [
      {
        accessorKey: "driverName",
        header: t.common.operator,
        cell: ({ row }) => (
          <span className="font-medium text-slate-800">{row.original.driverName}</span>
        ),
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
        accessorKey: "totalMeterRun",
        header: t.common.totalMeterRun,
        cell: ({ row }) => formatMeterTime(row.original.totalMeterRun),
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
        id: "paymentType",
        accessorKey: "paymentType",
        header: t.common.paymentType,
        cell: ({ row }) => {
          const pt = row.original.paymentType;
          if (!pt) return <span className="text-slate-400">—</span>;
          if (pt === "Cash") {
            const amt = row.original.cashAmount;
            return amt != null
              ? `${t.common.cash} (${t.common.currencySymbol} ${amt.toLocaleString()})`
              : t.common.cash;
          }
          return pt === "Credit" ? t.common.credit : pt;
        },
      },
      {
        accessorKey: "workOrderBy",
        header: t.common.workOrderBy,
        cell: ({ row }) => row.original.workOrderBy ?? <span className="text-slate-400">—</span>,
      },
      {
        accessorKey: "wages",
        header: t.common.wagesNrs,
        cell: ({ row }) =>
          row.original.wages != null ? (
            `${t.common.currencySymbol} ${row.original.wages.toLocaleString()}`
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
      {
        id: "actions",
        header: t.common.actions,
        enableSorting: false,
        meta: { className: "text-right" },
        cell: ({ row }) => (
          <div className="inline-flex gap-1.5">
            <Can do="dozer_log.edit">
              <IconButton
                tooltip="Edit"
                icon={<PencilIcon />}
                onClick={() => setModalMode({ kind: "edit", log: row.original })}
              />
            </Can>
            <Can do="dozer_log.delete">
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.dozerLog.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {t.common.refresh}
          </button>
          <Can do="dozer_log.add">
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
              {t.pages.dozerLog.addButton}
            </button>
          </Can>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isDriver && (
          <select
            value={filterDriverId}
            onChange={(e) =>
              handleDriverFilterChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.common.allDrivers}</option>
            {driverOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
        <select
          value={filterVehicleId}
          onChange={(e) =>
            handleVehicleFilterChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t.common.allVehicles}</option>
          {vehicleOptions.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
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

      {error && (
        <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">
          {error}
        </div>
      )}

      <DataTable
        table={table}
        loading={loading}
        emptyMessage={t.pages.dozerLog.noData}
        totalCount={totalCount}
      />

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
