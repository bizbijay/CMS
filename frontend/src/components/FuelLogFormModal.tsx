import { FormEvent, useEffect, useState } from "react";
import { fuelLogsApi, usersApi, fuelsApi, getStoredUser } from "../services/api";
import type { FuelLogListItem } from "../types/fuelLog";
import type { UserListItem } from "../types/users";
import type { FuelListItem } from "../types/fuels";

export type FuelLogFormMode =
  | { kind: "add" }
  | { kind: "edit"; log: FuelLogListItem };

interface Props {
  open: boolean;
  mode: FuelLogFormMode;
  onClose: () => void;
  onSaved: (item: FuelLogListItem, mode: FuelLogFormMode["kind"]) => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function displayName(u: UserListItem) {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return full || u.username;
}

export default function FuelLogFormModal({ open, mode, onClose, onSaved }: Props) {
  const isEdit = mode.kind === "edit";

  const [drivers, setDrivers] = useState<UserListItem[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelListItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [driverId, setDriverId] = useState<number>(0);
  const [fuelTypeId, setFuelTypeId] = useState<number>(0);
  const [quantity, setQuantity] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [date, setDate] = useState(todayIso());

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    Promise.all([usersApi.list(), fuelsApi.list()])
      .then(([users, f]) => {
        const driverList = users.filter((u) => u.roleName?.toLowerCase() === "driver");
        setDrivers(driverList);
        setFuelTypes(f);

        if (mode.kind === "edit") {
          setDriverId(mode.log.driverId);
          setFuelTypeId(mode.log.fuelTypeId);
          setQuantity(String(mode.log.quantity));
          setPrice(String(mode.log.price));
          setDate(mode.log.date.slice(0, 10));
        } else {
          const stored = getStoredUser();
          const match = driverList.find((u) => u.id === stored?.id);
          setDriverId(match?.id ?? driverList[0]?.id ?? 0);
          setFuelTypeId(f[0]?.id ?? 0);
          setQuantity("");
          setPrice("");
          setDate(todayIso());
        }
      })
      .catch(() => setError("Failed to load dropdown options."))
      .finally(() => setLoadingOptions(false));
    setError(null);
  }, [open, mode]);

  if (!open) return null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  const selectedDriver = drivers.find((u) => u.id === driverId);
  const assignedVehicleId = selectedDriver?.vehicleId ?? null;
  const assignedVehicleName = selectedDriver?.assignedVehicleName ?? null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!driverId) { setError("Please select a driver."); return; }
    if (!assignedVehicleId) { setError("Selected driver has no assigned vehicle."); return; }
    if (!fuelTypeId) { setError("Please select a fuel type."); return; }
    if (!quantity || Number(quantity) <= 0) { setError("Please enter a valid quantity."); return; }
    if (!price || Number(price) <= 0) { setError("Please enter a valid price."); return; }

    const body = { driverId, vehicleId: assignedVehicleId, fuelTypeId, quantity: Number(quantity), price: Number(price), date };
    setSaving(true);
    try {
      if (mode.kind === "add") {
        const created = await fuelLogsApi.create(body);
        onSaved(created, "add");
      } else {
        const updated = await fuelLogsApi.update(mode.log.id, body);
        onSaved(updated, "edit");
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? "Edit fuel log" : "Add fuel log"}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? "Update fuel log details." : "Log a new fuel entry."}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>
        )}

        {loadingOptions ? (
          <p className="text-sm text-slate-500 py-4 text-center">Loading options...</p>
        ) : (
          <>
            <Field label="Driver" required>
              {drivers.length === 0 ? (
                <p className="text-sm text-amber-600 py-1">No drivers found. Add a driver user first.</p>
              ) : (
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(Number(e.target.value))}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {drivers.map((u) => (
                    <option key={u.id} value={u.id}>{displayName(u)}</option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Vehicle">
              <input
                type="text"
                value={assignedVehicleName ?? "— No vehicle assigned —"}
                disabled
                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
              />
            </Field>

            <Field label="Fuel type" required>
              {fuelTypes.length === 0 ? (
                <p className="text-sm text-amber-600 py-1">No fuel types found. Add a fuel type first.</p>
              ) : (
                <select
                  value={fuelTypeId}
                  onChange={(e) => setFuelTypeId(Number(e.target.value))}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fuelTypes.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity (litres)" required>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>

              <Field label="Price (रू)" required>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>

            {quantity && price && Number(quantity) > 0 && Number(price) > 0 && (
              <div className="rounded bg-slate-50 border border-slate-200 px-4 py-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Total price</span>
                <span className="font-semibold text-slate-800">
                  रू {(Number(quantity) * Number(price)).toFixed(2)}
                </span>
              </div>
            )}

            <Field label="Date" required>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving || loadingOptions}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium">
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add fuel log"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
