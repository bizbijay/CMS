import { useEffect, useState } from "react";
import { projectWagesApi } from "../services/api";
import type { ProjectWageListItem } from "../types/projectWages";
import NepaliCalendarPicker from "./NepaliCalendarPicker";
import { useT } from "../hooks/useT";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export type ProjectWageFormMode =
  | { kind: "add"; projectId: number }
  | { kind: "edit"; wage: ProjectWageListItem };

interface Props {
  open: boolean;
  mode: ProjectWageFormMode;
  onClose: () => void;
  onSaved: (wage: ProjectWageListItem, kind: ProjectWageFormMode["kind"]) => void;
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

export default function ProjectWageFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";

  const [numberOfWorkers, setNumberOfWorkers] = useState("1");
  const [rate, setRate] = useState("");
  const [date, setDate] = useState(todayIso());
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedTotal =
    numberOfWorkers !== "" && rate !== ""
      ? Number(numberOfWorkers) * Number(rate)
      : null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (isEdit) {
      const w = mode.wage;
      setNumberOfWorkers(String(w.numberOfWorkers));
      setRate(String(w.rate));
      setDate(w.date.slice(0, 10));
      setRemarks(w.remarks ?? "");
    } else {
      setNumberOfWorkers("1");
      setRate("");
      setDate(todayIso());
      setRemarks("");
    }
  }, [open, mode.kind]);

  function handleClose() {
    if (!saving) onClose();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = {
        numberOfWorkers: Number(numberOfWorkers),
        rate: Number(rate),
        date,
        remarks: remarks.trim() || null,
      };

      let result: ProjectWageListItem;
      if (isEdit) {
        result = await projectWagesApi.update(mode.wage.id, body);
      } else {
        result = await projectWagesApi.create({ ...body, projectId: mode.projectId });
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
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-3 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? t.modal.projectWages.editTitle : t.modal.projectWages.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.projectWages.editSubtitle : t.modal.projectWages.addSubtitle}
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

        <div className="grid grid-cols-2 gap-3">
          <Field label={t.common.numberOfWorkers} required>
            <input
              type="number"
              min="1"
              step="1"
              value={numberOfWorkers}
              onChange={(e) => setNumberOfWorkers(e.target.value)}
              required
              placeholder="1"
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field label={t.common.rate} required>
            <input
              type="number"
              min="0"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
              placeholder="0.00"
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

        <Field label={t.common.date} required>
          <NepaliCalendarPicker value={date} onChange={setDate} />
        </Field>

        <Field label={t.common.remarks}>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={2}
            placeholder={t.modal.projectWages.remarksPlaceholder}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50">
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.projectWages.addTitle}
          </button>
        </div>
      </form>
    </div>
  );
}
