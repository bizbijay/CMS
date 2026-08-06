import { FormEvent, useEffect, useState } from "react";
import NepaliCalendarPicker from "./NepaliCalendarPicker";
import { useT } from "../hooks/useT";
import { vendorsApi } from "../services/api";
import type { BankAccountListItem } from "../types/bankAccount";
import type { VendorListItem } from "../types/vendors";

type VendorRow = VendorListItem;

export function AddVendorBalanceModal({
  open,
  vendor,
  onClose,
  onSaved,
}: {
  open: boolean;
  vendor: VendorRow | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const t = useT();
  const [amount, setAmount] = useState("");
  const [loggedOn, setLoggedOn] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setLoggedOn(new Date().toISOString().slice(0, 10));
    setRemarks("");
    setError(null);
  }, [open]);

  if (!open || !vendor) return null;
  const selectedVendor = vendor;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t.pages.vendorManagement.invalidAmountError);
      return;
    }

    setSaving(true);
    try {
      await vendorsApi.addBalance(selectedVendor.id, {
        amount: parsedAmount,
        loggedOn: loggedOn || null,
        remarks: remarks.trim() || null,
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.pages.vendorManagement.addBalanceFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{t.pages.vendorManagement.addBalanceButton}</h3>
            <p className="text-sm text-slate-500">{selectedVendor.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <CloseIcon />
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
            <span>{t.common.remarks}</span>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
            {saving ? t.common.saving : t.pages.vendorManagement.addBalanceButton}
          </button>
        </div>
      </form>
    </div>
  );
}

export function PayVendorAmountModal({
  open,
  vendor,
  bankAccounts,
  formatMoney,
  onClose,
  onSaved,
}: {
  open: boolean;
  vendor: VendorRow | null;
  bankAccounts: BankAccountListItem[];
  formatMoney: Intl.NumberFormat;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const t = useT();
  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [paidOn, setPaidOn] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setBankAccountId("");
    setPaidOn(new Date().toISOString().slice(0, 10));
    setRemarks("");
    setError(null);
  }, [open]);

  if (!open || !vendor) return null;
  const selectedVendor = vendor;

  const selectedAccount = bankAccounts.find((item) => item.id === Number(bankAccountId));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError(t.pages.vendorManagement.invalidAmountError);
      return;
    }

    const parsedBankId = Number(bankAccountId);
    if (!Number.isFinite(parsedBankId) || parsedBankId <= 0) {
      setError(t.pages.vendorManagement.selectBankAccountError);
      return;
    }

    const vendorBalance = Number(selectedVendor.totalBalance || 0);
    if (parsedAmount > vendorBalance) {
      setError(t.pages.vendorManagement.exceedsVendorBalanceError);
      return;
    }

    const accountBalance = Number(selectedAccount?.totalBalance || 0);
    if (parsedAmount > accountBalance) {
      setError(t.pages.vendorManagement.exceedsBankBalanceError);
      return;
    }

    setSaving(true);
    try {
      await vendorsApi.payAmount(selectedVendor.id, {
        amount: parsedAmount,
        bankAccountId: parsedBankId,
        paidOn: paidOn || null,
        remarks: remarks.trim() || null,
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.pages.vendorManagement.payAmountFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{t.pages.vendorManagement.payAmountButton}</h3>
            <p className="text-sm text-slate-500">{selectedVendor.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <CloseIcon />
          </button>
        </div>

        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {t.pages.vendorManagement.vendorBalanceLabel}: {t.common.currencySymbol} {formatMoney.format(Number(selectedVendor.totalBalance || 0))}
        </div>

        {error ? <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
            <span>{t.nav.bankAccounts}</span>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.common.select}</option>
              {bankAccounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.bankName} - {item.accountNumber} ({t.pages.bankAccounts.totalBalanceLabel}: {formatMoney.format(Number(item.totalBalance || 0))})
                </option>
              ))}
            </select>
          </label>

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
              value={paidOn}
              onChange={setPaidOn}
            />
          </label>

          <label className="space-y-1 text-sm text-slate-700 md:col-span-2">
            <span>{t.common.remarks}</span>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} disabled={saving} className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300">
            {saving ? t.common.saving : t.pages.vendorManagement.payAmountButton}
          </button>
        </div>
      </form>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}
