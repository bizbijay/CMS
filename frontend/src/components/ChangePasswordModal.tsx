import { FormEvent, useEffect, useState } from "react";
import { authApi } from "../services/api";
import { useT } from "../hooks/useT";
import { isPasswordValid } from "../services/passwordPolicy";
import PasswordRequirements from "./PasswordRequirements";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const t = useT();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setShowPasswords(false);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isPasswordValid(newPassword)) {
      setError(t.modal.changePassword.errorRequirements);
      return;
    }
    if (newPassword !== confirm) {
      setError(t.modal.changePassword.noMatch);
      return;
    }
    if (newPassword === currentPassword) {
      setError(t.modal.changePassword.errorSamePassword);
      return;
    }

    setSaving(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  const inputType = showPasswords ? "text" : "password";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {t.modal.changePassword.title}
            </h3>
            <p className="text-sm text-slate-500">
              {t.modal.changePassword.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded bg-green-50 text-green-700 text-sm p-3 border border-green-200">
            {t.modal.changePassword.success}
          </div>
        )}

        <Field label={t.modal.changePassword.currentPassword} required>
          <input
            type={inputType}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label={t.modal.changePassword.newPassword} required>
          <input
            type={inputType}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <PasswordRequirements value={newPassword} className="mt-2" />
        </Field>

        <Field label={t.modal.changePassword.confirmNewPassword} required>
          <input
            type={inputType}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {confirm.length > 0 && newPassword !== confirm && (
            <p className="text-xs text-red-600 mt-1">{t.modal.changePassword.noMatch}</p>
          )}
        </Field>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300"
          />
          {t.modal.changePassword.showPasswords}
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            {success ? t.modal.changePassword.close : t.common.cancel}
          </button>
          {!success && (
            <button
              type="submit"
              disabled={
                saving ||
                !isPasswordValid(newPassword) ||
                newPassword !== confirm ||
                currentPassword.length === 0
              }
              className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium"
            >
              {saving ? t.modal.changePassword.updating : t.auth.changePassword}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
