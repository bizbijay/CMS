import { useEffect, useState } from "react";
import { governmentOfficesApi } from "../services/api";
import type { GovernmentOfficeListItem } from "../types/governmentOffice";
import type { ProjectCommissionListItem } from "../types/projectCommissions";
import { useT } from "../hooks/useT";

export type ProjectCommissionFormMode =
  | { kind: "add"; projectId: number }
  | { kind: "edit"; commission: ProjectCommissionListItem };

interface Props {
  open: boolean;
  mode: ProjectCommissionFormMode;
  onClose: () => void;
  onSaved: (commission: ProjectCommissionListItem, kind: ProjectCommissionFormMode["kind"]) => void;
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

const OTHER = "__other__";

export default function ProjectCommissionFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";

  const [offices, setOffices] = useState<GovernmentOfficeListItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [officeSel, setOfficeSel] = useState<string>("");
  const [otherOption, setOtherOption] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const isOther = officeSel === OTHER;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoadingOptions(true);
    governmentOfficesApi
      .list()
      .then((list) => {
        setOffices(list ?? []);
        if (isEdit) {
          const c = mode.commission;
          if (c.officeId) {
            setOfficeSel(String(c.officeId));
            setOtherOption("");
          } else {
            setOfficeSel(OTHER);
            setOtherOption(c.otherOption ?? "");
          }
          setAmount(String(c.amount));
          setRemarks(c.remarks ?? "");
        } else {
          setOfficeSel(list[0] ? String(list[0].id) : OTHER);
          setOtherOption("");
          setAmount("");
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
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body = {
        officeId: isOther ? null : (officeSel ? Number(officeSel) : null),
        otherOption: isOther ? otherOption.trim() || null : null,
        amount: Number(amount),
        remarks: remarks.trim() || null,
      };

      let result: ProjectCommissionListItem;
      if (isEdit) {
        const { projectCommissionsApi } = await import("../services/api");
        result = await projectCommissionsApi.update(mode.commission.id, body);
      } else {
        const { projectCommissionsApi } = await import("../services/api");
        result = await projectCommissionsApi.create({ ...body, projectId: mode.projectId });
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
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? t.modal.projectCommissions.editTitle : t.modal.projectCommissions.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.projectCommissions.editSubtitle : t.modal.projectCommissions.addSubtitle}
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
            <Field label={t.common.issuedOffice} required>
              <select
                value={officeSel}
                onChange={(e) => { setOfficeSel(e.target.value); setOtherOption(""); }}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {offices.map((o) => (
                  <option key={o.id} value={String(o.id)}>{o.name}</option>
                ))}
                <option value={OTHER}>{t.common.other}</option>
              </select>
              {isOther && (
                <input
                  type="text"
                  value={otherOption}
                  onChange={(e) => setOtherOption(e.target.value)}
                  placeholder={t.modal.projectCommissions.otherPlaceholder}
                  required
                  className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}
            </Field>

            <Field label={t.common.amount} required>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </Field>

            <Field label={t.common.remarks}>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder={t.modal.projectCommissions.remarksPlaceholder}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </Field>
          </>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={handleClose} disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving || loadingOptions}
            className="px-4 py-2 text-sm rounded bg-purple-600 hover:bg-purple-700 text-white font-medium disabled:opacity-50">
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.projectCommissions.addTitle}
          </button>
        </div>
      </form>
    </div>
  );
}
