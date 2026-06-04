import { FormEvent, useEffect, useState } from "react";
import { usersApi, vehiclesApi, rolesApi } from "../services/api";
import { useT } from "../hooks/useT";
import type { UserListItem } from "../types/users";
import type { VehicleListItem } from "../types/vehicles";
import type { RoleListItem } from "../types/roles";
import { isPasswordValid } from "../services/passwordPolicy";
import PasswordRequirements from "./PasswordRequirements";

export type UserFormMode =
  | { kind: "add" }
  | { kind: "edit"; user: UserListItem };

interface Props {
  open: boolean;
  mode: UserFormMode;
  onClose: () => void;
  onSaved: (user: UserListItem, mode: UserFormMode["kind"]) => void;
}

export default function UserFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    vehiclesApi.list().then(setVehicles).catch(() => {});
    rolesApi.list().then(setRoles).catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    if (mode.kind === "edit") {
      const u = mode.user;
      setUsername(u.username);
      setEmail(u.email);
      setFirstName(u.firstName ?? "");
      setLastName(u.lastName ?? "");
      setPassword("");
      setIsActive(u.isActive);
      setRoleId(u.roleId ?? null);
      setVehicleId(u.vehicleId ?? null);
    } else {
      setUsername("");
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setIsActive(true);
      setRoleId(null);
      setVehicleId(null);
    }
    setError(null);
  }, [open, mode]);

  if (!open) return null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  const passwordOk =
    mode.kind === "add"
      ? isPasswordValid(password)
      : password.length === 0 || isPasswordValid(password);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordOk) {
      setError("Password does not meet all requirements.");
      return;
    }

    setSaving(true);
    try {
      if (mode.kind === "add") {
        const created = await usersApi.create({
          username,
          email,
          password,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          isActive,
          roleId,
          vehicleId,
        });
        onSaved(created, "add");
      } else {
        const updated = await usersApi.update(mode.user.id, {
          username,
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          isActive,
          roleId,
          vehicleId,
          password: password ? password : undefined,
        });
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
        className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? t.modal.users.editTitle : t.modal.users.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.users.editSubtitle : t.modal.users.addSubtitle}
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

        <div className="grid grid-cols-2 gap-3">
          <Field label={t.modal.users.firstName}>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field label={t.modal.users.lastName}>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        </div>

        <Field label={t.pages.users.username} required>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={50}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label={t.pages.users.email} required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label={isEdit ? t.modal.users.newPasswordLabel : t.modal.users.passwordLabel}
          required={!isEdit}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!isEdit}
            minLength={isEdit && password.length === 0 ? undefined : 8}
            placeholder={isEdit ? t.modal.users.passwordPlaceholder : ""}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <PasswordRequirements
            value={password}
            hideWhenEmpty={isEdit}
            className="mt-2"
          />
        </Field>

        <Field label={t.common.role}>
          <select
            value={roleId ?? ""}
            onChange={(e) => {
              const newId = e.target.value ? Number(e.target.value) : null;
              setRoleId(newId);
              const roleName = roles.find((r) => r.id === newId)?.name ?? "";
              if (roleName.toLowerCase() === "admin") setVehicleId(null);
            }}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.modal.users.noRoleOption}</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>

        {roles.find((r) => r.id === roleId)?.name?.toLowerCase() !== "admin" && (
          <Field label={t.common.assignedVehicle}>
            <select
              value={vehicleId ?? ""}
              onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t.modal.users.noVehicleOption}</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.numberPlate})
                </option>
              ))}
            </select>
          </Field>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300"
          />
          {t.modal.users.activeLabel}
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
            disabled={saving || !passwordOk}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium"
          >
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.users.createButton}
          </button>
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
