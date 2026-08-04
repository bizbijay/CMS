import { FormEvent, useEffect, useState } from "react";
import { extraExpensesApi, usersApi, getStoredUser } from "../services/api";
import NepaliCalendarPicker from "./NepaliCalendarPicker";
import { useT } from "../hooks/useT";
import type { ExtraExpenseListItem } from "../types/extraExpense";
import type { UserListItem } from "../types/users";

export type ExtraExpenseFormMode =
  | { kind: "add" }
  | { kind: "edit"; expense: ExtraExpenseListItem };

interface Props {
  open: boolean;
  mode: ExtraExpenseFormMode;
  onClose: () => void;
  onSaved: (item: ExtraExpenseListItem, mode: ExtraExpenseFormMode["kind"]) => void;
}

const OTHER = "other";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function displayName(u: UserListItem) {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return full || u.username;
}

export default function ExtraExpenseFormModal({ open, mode, onClose, onSaved }: Props) {
  const tr = useT();
  const isEdit = mode.kind === "edit";
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.roleName?.toLowerCase() === "admin";

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [expensedBySel, setExpensedBySel] = useState<string>("");
  const [expensedByOther, setExpensedByOther] = useState("");
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [remarks, setRemarks] = useState("");
  const [date, setDate] = useState(todayIso());

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isOtherUser = expensedBySel === OTHER;

  // Auto-calculate Total Cost when quantity or cost change if totalCost is not manually locked, or dynamically update
  useEffect(() => {
    if (quantity !== "" && cost !== "") {
      const q = Number(quantity);
      const c = Number(cost);
      if (!isNaN(q) && !isNaN(c)) {
        setTotalCost(String(q * c));
      }
    }
  }, [quantity, cost]);

  useEffect(() => {
    if (!open) return;
    setError(null);

    const initFormState = (safeUsers: UserListItem[] = []) => {
      if (mode.kind === "edit") {
        const e = mode.expense;
        if (e.expensedById) {
          setExpensedBySel(String(e.expensedById));
          setExpensedByOther("");
        } else {
          setExpensedBySel(OTHER);
          setExpensedByOther(e.expensedByOther ?? "");
        }
        setItem(e.item ?? "");
        setQuantity(e.quantity != null ? String(e.quantity) : "");
        setCost(e.cost != null ? String(e.cost) : "");
        setTotalCost(e.totalCost != null ? String(e.totalCost) : "");
        setRemarks(e.remarks ?? "");
        setDate(e.date ? e.date.slice(0, 10) : todayIso());
      } else {
        const match = safeUsers.find((u) => u.id === currentUser?.id);
        if (!isAdmin) {
          setExpensedBySel(currentUser?.id ? String(currentUser.id) : "");
          setExpensedByOther("");
        } else if (match) {
          setExpensedBySel(String(match.id));
          setExpensedByOther("");
        } else {
          setExpensedBySel(safeUsers[0] ? String(safeUsers[0].id) : OTHER);
          setExpensedByOther("");
        }
        setItem("");
        setQuantity("");
        setCost("");
        setTotalCost("");
        setRemarks("");
        setDate(todayIso());
      }
    };

    if (isAdmin) {
      setLoadingOptions(true);
      usersApi.list()
        .then((d) => {
          const safeU = d ?? [];
          setUsers(safeU);
          initFormState(safeU);
        })
        .catch(() => setError(tr.modal.loadError))
        .finally(() => setLoadingOptions(false));
    } else {
      setLoadingOptions(false);
      initFormState([]);
    }
  }, [open, mode]);

  if (!open) return null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!item.trim()) {
      setError("Please enter item name or description.");
      return;
    }

    if (isOtherUser && !expensedByOther.trim()) {
      setError("Please enter expensed by name.");
      return;
    }

    const numericTotalCost = Number(totalCost);
    if (isNaN(numericTotalCost) || numericTotalCost <= 0) {
      setError("Please enter a valid positive total cost.");
      return;
    }

    const finalExpensedById = isAdmin
      ? (isOtherUser ? null : (expensedBySel ? Number(expensedBySel) : null))
      : (currentUser?.id ?? (expensedBySel ? Number(expensedBySel) : null));

    const finalExpensedByOther = isAdmin && isOtherUser ? expensedByOther.trim() : null;

    const body = {
      expensedById: finalExpensedById,
      expensedByOther: finalExpensedByOther,
      item: item.trim(),
      quantity: quantity !== "" ? Number(quantity) : null,
      cost: cost !== "" ? Number(cost) : null,
      totalCost: numericTotalCost,
      remarks: remarks.trim() || null,
      date,
    };

    setSaving(true);
    try {
      if (mode.kind === "add") {
        const created = await extraExpensesApi.create(body);
        onSaved(created, "add");
      } else {
        const updated = await extraExpensesApi.update(mode.expense.id, body);
        onSaved(updated, "edit");
      }
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
        className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-3 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? tr.modal.extraExpenses.editTitle : tr.modal.extraExpenses.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? tr.modal.extraExpenses.editSubtitle : tr.modal.extraExpenses.addSubtitle}
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
          <p className="text-sm text-slate-500 py-4 text-center">{tr.modal.loadingOptions}</p>
        ) : (
          <>
            {isAdmin && (
              <Field label={tr.modal.extraExpenses.expensesByLabel} required>
                <select
                  value={expensedBySel}
                  onChange={(e) => { setExpensedBySel(e.target.value); setExpensedByOther(""); }}
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={String(u.id)}>{displayName(u)}</option>
                  ))}
                  <option value={OTHER}>{tr.modal.transportation.otherOption}</option>
                </select>
                {isOtherUser && (
                  <input
                    type="text"
                    value={expensedByOther}
                    onChange={(e) => setExpensedByOther(e.target.value)}
                    placeholder="Enter name"
                    required
                    className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </Field>
            )}

            <Field label={tr.modal.extraExpenses.itemLabel} required>
              <input
                type="text"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder={tr.modal.extraExpenses.itemPlaceholder}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={tr.common.quantity}>
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
              <Field label={tr.common.perUnitCost}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>

            <Field label={tr.common.totalCost} required>
              <input
                type="number"
                min="0"
                step="0.01"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                placeholder="0.00"
                required
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </Field>

            <Field label={tr.common.date} required>
              <NepaliCalendarPicker
                value={date}
                onChange={setDate}
              />
            </Field>

            <Field label={tr.common.remarks}>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                placeholder="Optional remarks"
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {tr.common.cancel}
          </button>
          <button type="submit" disabled={saving || loadingOptions}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium">
            {saving ? tr.common.saving : isEdit ? tr.common.saveChanges : tr.common.add}
          </button>
        </div>
      </form>
    </div>
  );
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
