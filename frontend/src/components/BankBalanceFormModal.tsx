import { FormEvent, useEffect, useState } from "react";
import { bankAccountsApi } from "../services/api";
import { useT } from "../hooks/useT";
import type { BankAccountListItem } from "../types/bankAccount";
import NepaliCalendarPicker from "./NepaliCalendarPicker";

interface Props {
  open: boolean;
  account: BankAccountListItem | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export default function BankBalanceFormModal({ open, account, onClose, onSaved }: Props) {
  const t = useT();
  const [amount, setAmount] = useState("");
  const [loggedOn, setLoggedOn] = useState("");
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setRemarks("");
    setLoggedOn(new Date().toISOString().slice(0, 10));
    setError(null);
  }, [open]);

  if (!open || !account) return null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    setSaving(true);
    try {
      const selectedAccount = account;
      if (!selectedAccount) {
        setError("No account selected.");
        setSaving(false);
        return;
      }

      await bankAccountsApi.addBalance(selectedAccount.id, {
        amount: parsedAmount,
        loggedOn: loggedOn || null,
        remarks: remarks.trim() || null,
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add balance.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{t.pages.bankAccounts.addBalanceButton}</h3>
            <p className="text-sm text-slate-500">{account.bankName} • {account.accountNumber}</p>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700">
            <span>{t.pages.bankAccounts.creditAmountLabel}</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700">
            <span>{t.pages.bankAccounts.creditDateLabel}</span>
            <NepaliCalendarPicker
              value={loggedOn}
              onChange={setLoggedOn}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
            <span>{t.pages.bankAccounts.creditRemarksLabel}</span>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder={t.common.remarks}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={saving} className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
            {saving ? t.common.saving : t.pages.bankAccounts.addBalanceButton}
          </button>
        </div>
      </form>
    </div>
  );
}
