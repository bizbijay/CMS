import { useEffect, useState } from "react";
import { salaryPaymentApi, usersApi } from "../services/api";
import type { SalaryPaymentListItem, CreateSalaryPaymentRequest, UpdateSalaryPaymentRequest } from "../types/salaryPayment";
import type { UserListItem } from "../types/users";
import { useT } from "../hooks/useT";

interface Props {
  open: boolean;
  item: SalaryPaymentListItem | null;
  onClose: () => void;
  onSaved: (item: SalaryPaymentListItem) => void;
  prefillUserId?: number;
}

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SalaryPaymentFormModal({ open, item, onClose, onSaved, prefillUserId }: Props) {
  const t = useT();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [userId, setUserId] = useState(0);
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(todayISO());
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (item) {
      setUserId(item.userId);
      setAmount(String(item.amount));
      setPaidOn(item.paidOn);
      setRemarks(item.remarks ?? "");
    } else {
      setUserId(prefillUserId ?? 0);
      setAmount("");
      setPaidOn(todayISO());
      setRemarks("");
    }
  }, [open, item]);

  useEffect(() => {
    if (!open) return;
    setLoadingUsers(true);
    setLoadError(null);
    usersApi.list()
      .then(setUsers)
      .catch(() => setLoadError(t.modal.loadError))
      .finally(() => setLoadingUsers(false));
  }, [open, t.modal.loadError]);

  if (!open) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (userId === 0) { setError("Please select an employee."); return; }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) { setError("Please enter a valid amount."); return; }
    if (!paidOn) { setError("Please select a payment date."); return; }

    setSaving(true);
    setError(null);
    try {
      let saved: SalaryPaymentListItem;
      if (item) {
        const body: UpdateSalaryPaymentRequest = { userId, amount: parsedAmount, paidOn, remarks: remarks || null };
        saved = await salaryPaymentApi.update(item.id, body);
      } else {
        const body: CreateSalaryPaymentRequest = { userId, amount: parsedAmount, paidOn, remarks: remarks || null };
        saved = await salaryPaymentApi.create(body);
      }
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const isAdd = item === null;
  const title = isAdd ? t.modal.salaryPayment.addTitle : t.modal.salaryPayment.editTitle;
  const subtitle = isAdd ? t.modal.salaryPayment.addSubtitle : t.modal.salaryPayment.editSubtitle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.modal.salaryPayment.employeeLabel}</label>
            <select
              value={userId}
              onChange={(e) => setUserId(Number(e.target.value))}
              disabled={loadingUsers}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>— {loadingUsers ? t.modal.loadingOptions : t.modal.salaryPayment.employeeLabel} —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.modal.salaryPayment.amountLabel}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.modal.salaryPayment.paidOnLabel}</label>
            <input
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.modal.salaryPayment.remarksLabel}</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={t.modal.salaryPayment.remarksPlaceholder}
              rows={2}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
              {t.common.cancel}
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium">
              {saving ? t.modal.working : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
