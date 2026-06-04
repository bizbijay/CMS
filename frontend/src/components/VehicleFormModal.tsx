import { FormEvent, useEffect, useState } from "react";
import { vehiclesApi } from "../services/api";
import { useT } from "../hooks/useT";
import type { VehicleListItem, VehicleType } from "../types/vehicles";

export type VehicleFormMode =
  | { kind: "add" }
  | { kind: "edit"; vehicle: VehicleListItem };

interface Props {
  open: boolean;
  mode: VehicleFormMode;
  onClose: () => void;
  onSaved: (vehicle: VehicleListItem, mode: VehicleFormMode["kind"]) => void;
}

// Labels translated inside component via useT — kept as static fallback for type only
const VEHICLE_TYPE_VALUES: VehicleType[] = ["tipper", "jcb"];

export default function VehicleFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";

  const [name, setName] = useState("");
  const [numberPlate, setNumberPlate] = useState("");
  const [type, setType] = useState<VehicleType>("tipper");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode.kind === "edit") {
      setName(mode.vehicle.name);
      setNumberPlate(mode.vehicle.numberPlate);
      setType(mode.vehicle.type);
    } else {
      setName("");
      setNumberPlate("");
      setType("tipper");
    }
    setError(null);
  }, [open, mode]);

  if (!open) return null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const body = {
      name: name.trim(),
      numberPlate: numberPlate.trim().toUpperCase(),
      type,
    };

    setSaving(true);
    try {
      if (mode.kind === "add") {
        const created = await vehiclesApi.create(body);
        onSaved(created, "add");
      } else {
        const updated = await vehiclesApi.update(mode.vehicle.id, body);
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
              {isEdit ? t.modal.vehicles.editTitle : t.modal.vehicles.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.vehicles.editSubtitle : t.modal.vehicles.addSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">
            {error}
          </div>
        )}

        <Field label={t.modal.vehicles.nameLabel} required>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Site Tipper 1"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label={t.modal.vehicles.numberPlateLabel} required>
          <input
            type="text"
            value={numberPlate}
            onChange={(e) => setNumberPlate(e.target.value)}
            required
            placeholder="e.g. AB12 CDE"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          />
        </Field>

        <Field label={t.modal.vehicles.typeLabel} required>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as VehicleType)}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VEHICLE_TYPE_VALUES.map((v) => (
              <option key={v} value={v}>
                {v === "tipper" ? t.modal.vehicles.typeTipper : t.modal.vehicles.typeJcb}
              </option>
            ))}
          </select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium"
          >
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.vehicles.addTitle}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
