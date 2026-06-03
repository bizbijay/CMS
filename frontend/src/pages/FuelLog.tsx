import { useCallback, useEffect, useState } from "react";
import { fuelLogsApi } from "../services/api";
import type { FuelLogListItem } from "../types/fuelLog";
import FuelLogFormModal, { type FuelLogFormMode } from "../components/FuelLogFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";

export default function FuelLog() {
  const { addToast } = useToast();
  const [items, setItems] = useState<FuelLogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<FuelLogFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FuelLogListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [driverFilter, setDriverFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fuelLogsApi.list();
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fuel logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onSaved(item: FuelLogListItem, kind: FuelLogFormMode["kind"]) {
    if (kind === "add") {
      setItems((prev) => [item, ...prev]);
      addToast("Fuel log added successfully.", "success");
    } else {
      setItems((prev) => prev.map((l) => (l.id === item.id ? item : l)));
      addToast("Fuel log updated successfully.", "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await fuelLogsApi.remove(pendingDelete.id);
      setItems((prev) => prev.filter((l) => l.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast("Fuel log deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const drivers = Array.from(new Set(items.map((l) => l.driverName))).sort();
  const vehicles = Array.from(new Set(items.map((l) => l.vehicleName))).sort();
  const filtered = items.filter(
    (l) =>
      (driverFilter === "" || l.driverName === driverFilter) &&
      (vehicleFilter === "" || l.vehicleName === vehicleFilter),
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Fuel Log</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            Refresh
          </button>
          <Can do="fuel_log.add">
            <button
              onClick={() => setModalMode({ kind: "add" })}
              className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              Add fuel log
            </button>
          </Can>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All drivers</option>
          {drivers.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={vehicleFilter}
          onChange={(e) => setVehicleFilter(e.target.value)}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All vehicles</option>
          {vehicles.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        {(driverFilter || vehicleFilter) && (
          <button
            onClick={() => { setDriverFilter(""); setVehicleFilter(""); }}
            className="px-3 py-1.5 text-sm rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Driver</Th>
                <Th>Vehicle</Th>
                <Th>Fuel type</Th>
                <Th>Qty (L)</Th>
                <Th>Price (रू)</Th>
                <Th>Total (रू)</Th>
                <Th>Date</Th>
                <Th className="text-right whitespace-nowrap">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-6 text-center text-slate-500">
                  {items.length === 0 ? `No fuel logs yet. Click "Add fuel log" to log one.` : "No logs match the selected filters."}
                </td></tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <Td><span className="font-medium text-slate-800">{l.driverName}</span></Td>
                    <Td>{l.vehicleName}</Td>
                    <Td>{l.fuelTypeName}</Td>
                    <Td>{l.quantity.toFixed(2)}</Td>
                    <Td>रू {l.price.toFixed(2)}</Td>
                    <Td className="font-medium">रू {(l.quantity * l.price).toFixed(2)}</Td>
                    <Td>{formatDate(l.date)}</Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Can do="fuel_log.edit">
                          <IconButton tooltip="Edit" icon={<PencilIcon />} onClick={() => setModalMode({ kind: "edit", log: l })} />
                        </Can>
                        <Can do="fuel_log.delete">
                          <IconButton tooltip="Delete" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDelete(l)} />
                        </Can>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FuelLogFormModal
        open={modalMode !== null}
        mode={modalMode ?? { kind: "add" }}
        onClose={() => setModalMode(null)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete fuel log"
        message={pendingDelete ? "Are you sure you want to delete this fuel log? This action cannot be undone." : ""}
        confirmLabel="Delete"
        tone="danger"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium uppercase text-xs tracking-wide px-4 py-3 ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-slate-700 ${className ?? ""}`}>{children}</td>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
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
