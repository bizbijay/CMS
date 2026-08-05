import { FormEvent, useEffect, useState } from "react";
import { bankAccountsApi } from "../services/api";
import { useT } from "../hooks/useT";
import type { BankAccountListItem } from "../types/bankAccount";

export type BankAccountFormMode =
  | { kind: "add" }
  | { kind: "edit"; account: BankAccountListItem };

interface Props {
  open: boolean;
  mode: BankAccountFormMode;
  onClose: () => void;
  onSaved: (account: BankAccountListItem, mode: BankAccountFormMode["kind"]) => void;
}

export default function BankAccountFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";
  const [form, setForm] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    branch: "",
    isPrimary: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (mode.kind === "edit") {
      setForm({
        bankName: mode.account.bankName,
        accountHolder: mode.account.accountHolder,
        accountNumber: mode.account.accountNumber,
        branch: mode.account.branch ?? "",
        isPrimary: mode.account.isPrimary,
      });
    } else {
      setForm({
        bankName: "",
        accountHolder: "",
        accountNumber: "",
        branch: "",
        isPrimary: false,
      });
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

    if (!form.bankName.trim() || !form.accountHolder.trim() || !form.accountNumber.trim()) {
      setError("Please fill in the required fields.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        bankName: form.bankName.trim(),
        accountHolder: form.accountHolder.trim(),
        accountNumber: form.accountNumber.trim(),
        branch: form.branch.trim() || null,
        isPrimary: form.isPrimary,
      };

      if (mode.kind === "add") {
        const created = await bankAccountsApi.create(body);
        onSaved(created, "add");
      } else {
        const updated = await bankAccountsApi.update(mode.account.id, body);
        onSaved(updated, "edit");
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save bank account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? t.common.edit : t.pages.bankAccounts.addButton}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.pages.bankAccounts.subtitle : t.pages.bankAccounts.subtitle}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
            <span>{t.pages.bankAccounts.bankNameLabel}</span>
            <input
              value={form.bankName}
              onChange={(e) => setForm((prev) => ({ ...prev, bankName: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.pages.bankAccounts.bankNamePlaceholder}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>{t.pages.bankAccounts.accountHolderLabel}</span>
            <input
              value={form.accountHolder}
              onChange={(e) => setForm((prev) => ({ ...prev, accountHolder: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.pages.bankAccounts.accountHolderPlaceholder}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>{t.pages.bankAccounts.accountNumberLabel}</span>
            <input
              value={form.accountNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.pages.bankAccounts.accountNumberPlaceholder}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
            <span>{t.pages.bankAccounts.branchLabel}</span>
            <input
              value={form.branch}
              onChange={(e) => setForm((prev) => ({ ...prev, branch: e.target.value }))}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.pages.bankAccounts.branchPlaceholder}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
            <input
              type="checkbox"
              checked={form.isPrimary}
              onChange={(e) => setForm((prev) => ({ ...prev, isPrimary: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>{t.pages.bankAccounts.primaryLabel}</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={saving} className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.pages.bankAccounts.addButton}
          </button>
        </div>
      </form>
    </div>
  );
}
