import { FormEvent, useEffect, useState } from "react";
import { salarySetupApi, usersApi } from "../services/api";
import { useT } from "../hooks/useT";
import type { SalarySetupListItem } from "../types/salarySetup";
import type { UserListItem } from "../types/users";

export type SalarySetupFormMode =
  | { kind: "add" }
  | { kind: "edit"; entry: SalarySetupListItem };

interface Props {
  open: boolean;
  mode: SalarySetupFormMode;
  onClose: () => void;
  onSaved: (entry: SalarySetupListItem, mode: SalarySetupFormMode["kind"]) => void;
}

export default function SalarySetupFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";

  const [userId, setUserId] = useState<number | "">("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode.kind === "edit") {
      setUserId(mode.entry.userId);
      setMonthlySalary(String(mode.entry.monthlySalary));
    } else {
      setUserId("");
      setMonthlySalary("");
    }
    setLoadingUsers(true);
    usersApi.list().then((rows) => {
      setUsers(rows);
    }).catch(() => {
      setError(t.modal.loadError);
    }).finally(() => {
      setLoadingUsers(false);
    });
  }, [open, mode, t.modal.loadError]);

  if (!open) return null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (userId === "") return;
    const salary = parseFloat(monthlySalary);
    if (isNaN(salary) || salary < 0) {
      setError("Please enter a valid monthly salary.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body = { userId: Number(userId), monthlySalary: salary };
      if (mode.kind === "add") {
        const created = await salarySetupApi.create(body);
        onSaved(created, "add");
      } else {
        const updated = await salarySetupApi.update(mode.entry.id, body);
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
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? t.modal.salarySetup.editTitle : t.modal.salarySetup.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.salarySetup.editSubtitle : t.modal.salarySetup.addSubtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.modal.salarySetup.employeeLabel}<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value === "" ? "" : Number(e.target.value))}
            required
            disabled={loadingUsers}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          >
            <option value="">{loadingUsers ? t.modal.loadingOptions : "— Select employee —"}</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName || u.lastName
                  ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                  : u.username}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.modal.salarySetup.monthlySalaryLabel}<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(e.target.value)}
            required
            placeholder="e.g. 25000"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
            disabled={saving || loadingUsers}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium"
          >
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.salarySetup.addTitle}
          </button>
        </div>
      </form>
    </div>
  );
}
