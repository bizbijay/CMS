import { useEffect, useState } from "react";
import type { VehicleMaintenanceWageListItem } from "../types/vehicleMaintenance";
import { useT } from "../hooks/useT";

export type VehicleMaintenanceWageFormMode =
  | { kind: "add"; logId: number }
  | { kind: "edit"; wage: VehicleMaintenanceWageListItem };

interface Props {
  open: boolean;
  mode: VehicleMaintenanceWageFormMode;
  onClose: () => void;
  onSaved: (wage: VehicleMaintenanceWageListItem, kind: "add" | "edit") => void;
}

interface FieldProps { label: string; required?: boolean; children: React.ReactNode }
function Field({ label, required, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = "w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500";

export default function VehicleMaintenanceWageFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";

  const [workers, setWorkers] = useState("1");
  const [rate, setRate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedTotal = workers !== "" && rate !== "" ? Number(workers) * Number(rate) : null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (isEdit) {
      const w = mode.wage;
      setWorkers(String(w.numberOfWorkers));
      setRate(String(w.rate));
      setRemarks(w.remarks ?? "");
    } else {
      setWorkers("1"); setRate(""); setRemarks("");
    }
  }, [open, mode.kind]);

  function handleClose() { if (!saving) onClose(); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = {
        numberOfWorkers: Number(workers),
        rate: Number(rate),
        remarks: remarks.trim() || null,
      };
      let result: VehicleMaintenanceWageListItem;
      if (isEdit) {
        const { vehicleMaintenanceWagesApi } = await import("../services/api");
        result = await vehicleMaintenanceWagesApi.update(mode.wage.id, body);
      } else {
        const { vehicleMaintenanceWagesApi } = await import("../services/api");
        result = await vehicleMaintenanceWagesApi.create({ ...body, maintenanceLogId: mode.logId });
      }
      onSaved(result, mode.kind);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? t.modal.vehicleMaintenance.editWageTitle : t.modal.vehicleMaintenance.addWageTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.vehicleMaintenance.editWageSubtitle : t.modal.vehicleMaintenance.addWageSubtitle}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M6 6l12 12M6 18L18 6" /></svg>
          </button>
        </div>

        {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

        <div className="grid grid-cols-2 gap-3">
          <Field label={t.common.numberOfWorkers} required>
            <input type="number" min="1" step="1" value={workers} onChange={e => setWorkers(e.target.value)} required className={INPUT} />
          </Field>
          <Field label={t.common.rate} required>
            <input type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="0.00" required className={INPUT} />
          </Field>
        </div>

        {computedTotal !== null && (
          <div className="flex items-center justify-between rounded bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
            <span className="text-slate-500">{t.common.totalAmount}</span>
            <span className="font-semibold text-slate-800">
              {t.common.currencySymbol} {computedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <Field label={t.common.remarks}>
          <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} placeholder="Optional notes" className={`${INPUT} resize-none`} />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={handleClose} disabled={saving} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">{t.common.cancel}</button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded bg-orange-600 hover:bg-orange-700 text-white font-medium disabled:opacity-50">
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.vehicleMaintenance.addWageTitle}
          </button>
        </div>
      </form>
    </div>
  );
}
