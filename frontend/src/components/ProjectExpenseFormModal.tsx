import { useEffect, useState } from "react";
import { materialsApi, vendorsApi } from "../services/api";
import type { MaterialListItem } from "../types/materials";
import type { VendorListItem } from "../types/vendors";
import type { ProjectExpenseListItem } from "../types/projectExpenses";
import NepaliCalendarPicker from "./NepaliCalendarPicker";
import { useT } from "../hooks/useT";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export type ProjectExpenseFormMode =
  | { kind: "add"; projectId: number }
  | { kind: "edit"; expense: ProjectExpenseListItem };

interface Props {
  open: boolean;
  mode: ProjectExpenseFormMode;
  onClose: () => void;
  onSaved: (expense: ProjectExpenseListItem, kind: ProjectExpenseFormMode["kind"]) => void;
}

interface Field { label: string; required?: boolean; children: React.ReactNode }
function Field({ label, required, children }: Field) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ProjectExpenseFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";

  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [materialId, setMaterialId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [vendorSel, setVendorSel] = useState<string>("");
  const [vendorOther, setVendorOther] = useState("");
  const [date, setDate] = useState(todayIso());
  const [remarks, setRemarks] = useState("");

  const OTHER = "__other__";
  const isOtherVendor = vendorSel === OTHER;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computedTotalCost =
    quantity !== "" && costPerUnit !== ""
      ? Number(quantity) * Number(costPerUnit)
      : null;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoadingOptions(true);
    Promise.all([materialsApi.list(), vendorsApi.list()])
      .then(([m, v]) => {
        setMaterials(m ?? []);
        setVendors(v ?? []);
        if (isEdit) {
          const e = mode.expense;
          setMaterialId(e.materialId ?? null);
          setQuantity(e.quantity != null ? String(e.quantity) : "1");
          setCostPerUnit(e.costPerUnit != null ? String(e.costPerUnit) : "");
          if (e.vendorId) { setVendorSel(String(e.vendorId)); setVendorOther(""); }
          else { setVendorSel(OTHER); setVendorOther(e.vendorOther ?? ""); }
          setDate(e.date.slice(0, 10));
          setRemarks(e.remarks ?? "");
        } else {
          setMaterialId(null);
          setQuantity("1");
          setCostPerUnit("");
          setVendorSel(v[0] ? String(v[0].id) : OTHER);
          setVendorOther("");
          setDate(todayIso());
          setRemarks("");
        }
      })
      .catch(() => setError(t.modal.loadError))
      .finally(() => setLoadingOptions(false));
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
        materialId: materialId ?? null,
        quantity: quantity !== "" ? Number(quantity) : null,
        costPerUnit: costPerUnit !== "" ? Number(costPerUnit) : null,
        vendorId: isOtherVendor ? null : (vendorSel ? Number(vendorSel) : null),
        vendorOther: isOtherVendor ? vendorOther.trim() || null : null,
        date,
        remarks: remarks.trim() || null,
      };

      let result: ProjectExpenseListItem;
      if (isEdit) {
        const { projectExpensesApi } = await import("../services/api");
        result = await projectExpensesApi.update(mode.expense.id, body);
      } else {
        const { projectExpensesApi } = await import("../services/api");
        result = await projectExpensesApi.create({ ...body, projectId: mode.projectId });
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
        className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-3 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? t.modal.projectExpenses.editTitle : t.modal.projectExpenses.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.projectExpenses.editSubtitle : t.modal.projectExpenses.addSubtitle}
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
          <p className="text-sm text-slate-500 py-4 text-center">{t.modal.loadingOptions}</p>
        ) : (
          <>
            <Field label={t.common.material}>
              <select
                value={materialId ?? ""}
                onChange={(e) => setMaterialId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— {t.common.none} —</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.common.quantity}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label={t.common.costPerUnit}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>

            {computedTotalCost !== null && (
              <div className="flex items-center justify-between rounded bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
                <span className="text-slate-500">{t.common.totalCost}</span>
                <span className="font-semibold text-slate-800">
                  {t.common.currencySymbol} {computedTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <Field label={t.common.vendor} required>
              <select
                value={vendorSel}
                onChange={(e) => { setVendorSel(e.target.value); setVendorOther(""); }}
                required={!isOtherVendor}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={String(v.id)}>{v.name}</option>
                ))}
                <option value={OTHER}>{t.common.other}</option>
              </select>
              {isOtherVendor && (
                <input
                  type="text"
                  value={vendorOther}
                  onChange={(e) => setVendorOther(e.target.value)}
                  placeholder="Enter vendor name"
                  required
                  className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </Field>

            <Field label={t.common.date} required>
              <NepaliCalendarPicker value={date} onChange={setDate} />
            </Field>

            <Field label={t.common.remarks}>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder={t.modal.projectExpenses.remarksPlaceholder}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </Field>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving || loadingOptions}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50">
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.projectExpenses.addTitle}
          </button>
        </div>
      </form>
    </div>
  );
}
