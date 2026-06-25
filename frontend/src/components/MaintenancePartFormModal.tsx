import { useEffect, useState } from "react";
import type { MaintenancePartListItem } from "../types/maintenancePart";
import { maintenancePartsApi } from "../services/api";
import { useT } from "../hooks/useT";

export type MaintenancePartFormMode =
  | { kind: "add" }
  | { kind: "edit"; part: MaintenancePartListItem };

interface Props {
  open: boolean;
  mode: MaintenancePartFormMode;
  onClose: () => void;
  onSaved: (part: MaintenancePartListItem, kind: "add" | "edit") => void;
}

export default function MaintenancePartFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setName(isEdit ? mode.part.name : "");
  }, [open, mode.kind]);

  function handleClose() { if (!saving) onClose(); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      let result: MaintenancePartListItem;
      if (isEdit) {
        result = await maintenancePartsApi.update(mode.part.id, { name: name.trim() });
      } else {
        result = await maintenancePartsApi.create({ name: name.trim() });
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
      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? t.modal.maintenanceParts.editTitle : t.modal.maintenanceParts.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.maintenanceParts.editSubtitle : t.modal.maintenanceParts.addSubtitle}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M6 6l12 12M6 18L18 6" /></svg>
          </button>
        </div>

        {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.common.partName}<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Engine oil filter"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={handleClose} disabled={saving} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">{t.common.cancel}</button>
          <button type="submit" disabled={saving || !name.trim()} className="px-4 py-2 text-sm rounded bg-orange-600 hover:bg-orange-700 text-white font-medium disabled:opacity-50">
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.common.add}
          </button>
        </div>
      </form>
    </div>
  );
}
