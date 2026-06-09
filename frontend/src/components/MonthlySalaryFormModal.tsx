import { FormEvent, useEffect, useState } from "react";
import { monthlySalaryApi } from "../services/api";
import { useT } from "../hooks/useT";
import type { MonthlySalaryRow } from "../types/monthlySalary";

interface Props {
  open: boolean;
  row: MonthlySalaryRow | null;
  onClose: () => void;
  onSaved: (row: MonthlySalaryRow) => void;
}

export default function MonthlySalaryFormModal({ open, row, onClose, onSaved }: Props) {
  const t = useT();

  const [amount, setAmount] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !row) return;
    setAmount(String(row.amount));
    setIsVerified(row.isVerified);
    setError(null);
  }, [open, row]);

  if (!open || !row) return null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!row) return;
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed < 0) {
      setError("Please enter a valid amount.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const saved = await monthlySalaryApi.save({
        userId: row.userId,
        month: row.month,
        year: row.year,
        amount: parsed,
        isVerified,
      });
      onSaved(saved);
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
            <h3 className="text-lg font-semibold text-slate-800">{t.modal.monthlySalary.editTitle}</h3>
            <p className="text-sm text-slate-500">{t.modal.monthlySalary.editSubtitle}</p>
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.modal.monthlySalary.employeeLabel}</label>
          <div className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {row.userName}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.modal.monthlySalary.defaultSalaryLabel}</label>
          <div className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {t.common.currencySymbol} {row.defaultSalary.toLocaleString()}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.modal.monthlySalary.amountLabel}<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isVerified}
            onChange={(e) => setIsVerified(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-slate-700">{t.modal.monthlySalary.verifiedLabel}</span>
        </label>

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
            {saving ? t.common.saving : t.common.saveChanges}
          </button>
        </div>
      </form>
    </div>
  );
}
