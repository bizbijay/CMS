import { useEffect, useState } from "react";
import type { VehicleMaintenancePartListItem } from "../types/vehicleMaintenance";
import type { MaintenancePartListItem } from "../types/maintenancePart";
import { maintenancePartsApi } from "../services/api";
import { useT } from "../hooks/useT";

export type VehicleMaintenancePartFormMode =
  | { kind: "add"; logId: number }
  | { kind: "edit"; part: VehicleMaintenancePartListItem };

interface Props {
  open: boolean;
  mode: VehicleMaintenancePartFormMode;
  onClose: () => void;
  onSaved: (part: VehicleMaintenancePartListItem, kind: "add" | "edit") => void;
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

const INPUT = "w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm";

export default function VehicleMaintenancePartFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";

  const [masterParts, setMasterParts] = useState<MaintenancePartListItem[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [maintenancePartId, setMaintenancePartId] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Searchable combobox state
  const [inputValue, setInputValue] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addingPart, setAddingPart] = useState(false);

  const computedTotal =
    quantity !== "" && unitCost !== "" ? Number(quantity) * Number(unitCost) : null;

  const filteredParts = inputValue.trim()
    ? masterParts.filter(p => p.name.toLowerCase().includes(inputValue.trim().toLowerCase()))
    : masterParts;

  // Show "Add X" when typed text doesn't exactly match any existing part
  const showAddOption =
    inputValue.trim().length > 0 &&
    !masterParts.some(p => p.name.toLowerCase() === inputValue.trim().toLowerCase());

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDropdownOpen(false);
    if (isEdit) {
      const p = mode.part;
      setMaintenancePartId(p.maintenancePartId);
      setInputValue(p.partName);
      setQuantity(p.quantity != null ? String(p.quantity) : "");
      setUnitCost(p.unitCost != null ? String(p.unitCost) : "");
      setRemarks(p.remarks ?? "");
    } else {
      setMaintenancePartId(0);
      setInputValue("");
      setQuantity("");
      setUnitCost("");
      setRemarks("");
    }

    setLoadingParts(true);
    maintenancePartsApi.list()
      .then(setMasterParts)
      .catch(() => setMasterParts([]))
      .finally(() => setLoadingParts(false));
  }, [open, mode.kind]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
    setMaintenancePartId(0);
    setDropdownOpen(true);
  }

  function handleInputFocus() {
    setDropdownOpen(true);
  }

  function handleInputBlur() {
    // Delay to let dropdown item click events fire first
    setTimeout(() => {
      setDropdownOpen(false);
      if (maintenancePartId === 0) setInputValue("");
    }, 150);
  }

  function selectPart(part: MaintenancePartListItem) {
    setMaintenancePartId(part.id);
    setInputValue(part.name);
    setDropdownOpen(false);
  }

  async function handleAddPart() {
    const name = inputValue.trim();
    if (!name) return;
    setAddingPart(true);
    setError(null);
    try {
      const newPart = await maintenancePartsApi.create({ name });
      setMasterParts(prev => [...prev, newPart]);
      setMaintenancePartId(newPart.id);
      setInputValue(newPart.name);
      setDropdownOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add part.");
    } finally {
      setAddingPart(false);
    }
  }

  function handleClose() { if (!saving) onClose(); }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!maintenancePartId) return;
    setError(null);
    setSaving(true);
    try {
      const body = {
        maintenancePartId,
        quantity: quantity !== "" ? Number(quantity) : null,
        unitCost: unitCost !== "" ? Number(unitCost) : null,
        remarks: remarks.trim() || null,
      };
      let result: VehicleMaintenancePartListItem;
      if (isEdit) {
        const { vehicleMaintenancePartsApi } = await import("../services/api");
        result = await vehicleMaintenancePartsApi.update(mode.part.id, body);
      } else {
        const { vehicleMaintenancePartsApi } = await import("../services/api");
        result = await vehicleMaintenancePartsApi.create({ ...body, maintenanceLogId: mode.logId });
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
              {isEdit ? t.modal.vehicleMaintenance.editPartTitle : t.modal.vehicleMaintenance.addPartTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.vehicleMaintenance.editPartSubtitle : t.modal.vehicleMaintenance.addPartSubtitle}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path d="M6 6l12 12M6 18L18 6" /></svg>
          </button>
        </div>

        {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

        <Field label={t.common.partName} required>
          {loadingParts ? (
            <div className={`${INPUT} text-slate-400`}>{t.modal.loadingOptions}</div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Search or type to add a new part…"
                required
                autoComplete="off"
                className={INPUT}
              />

              {dropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded shadow-lg max-h-52 overflow-y-auto">
                  {filteredParts.length === 0 && !showAddOption && (
                    <div className="px-3 py-2 text-sm text-slate-400">No parts found.</div>
                  )}
                  {filteredParts.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => selectPart(p)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-orange-50 hover:text-orange-700 ${maintenancePartId === p.id ? "bg-orange-50 text-orange-700 font-medium" : "text-slate-700"}`}
                    >
                      {p.name}
                    </button>
                  ))}
                  {showAddOption && (
                    <button
                      type="button"
                      onMouseDown={e => e.preventDefault()}
                      onClick={handleAddPart}
                      disabled={addingPart}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 border-t border-slate-100 flex items-center gap-2 disabled:opacity-50"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      {addingPart ? "Adding…" : `Add "${inputValue.trim()}"`}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t.common.quantity}>
            <input type="number" min="0" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" className={INPUT} />
          </Field>
          <Field label={t.common.unitCost}>
            <input type="number" min="0" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="0.00" className={INPUT} />
          </Field>
        </div>

        {computedTotal !== null && (
          <div className="flex items-center justify-between rounded bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
            <span className="text-slate-500">{t.common.totalCost}</span>
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
          <button type="submit" disabled={saving || !maintenancePartId} className="px-4 py-2 text-sm rounded bg-orange-600 hover:bg-orange-700 text-white font-medium disabled:opacity-50">
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.vehicleMaintenance.addPartTitle}
          </button>
        </div>
      </form>
    </div>
  );
}
