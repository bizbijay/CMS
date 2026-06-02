import { FormEvent, useEffect, useState } from "react";
import { usersApi, vehiclesApi } from "../services/api";
import type { UserListItem, UserType } from "../types/users";
import type { VehicleListItem } from "../types/vehicles";
import { isPasswordValid } from "../services/passwordPolicy";
import PasswordRequirements from "./PasswordRequirements";

const USER_TYPES: { value: UserType; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "driver", label: "Driver" },
];

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
  const isEdit = mode.kind === "edit";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [type, setType] = useState<UserType>("admin");
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    vehiclesApi.list().then(setVehicles).catch(() => {});
  }, []);

  // Sync form state when the modal opens or the target user changes.
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
      setType(u.type);
      setVehicleId(u.vehicleId ?? null);
    } else {
      setUsername("");
      setEmail("");
      setFirstName("");
      setLastName("");
      setPassword("");
      setIsActive(true);
      setType("admin");
      setVehicleId(null);
    }
    setError(null);
  }, [open, mode]);

  if (!open) return null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  // In add mode the password is required; in edit mode a non-empty value must
  // satisfy the policy, but an empty value keeps the existing password.
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
          type,
          vehicleId: type === "driver" ? vehicleId : null,
        });
        onSaved(created, "add");
      } else {
        const updated = await usersApi.update(mode.user.id, {
          username,
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          isActive,
          type,
          vehicleId: type === "driver" ? vehicleId : null,
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
              {isEdit ? "Edit user" : "Add user"}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit
                ? "Update this user's details. Leave password blank to keep it unchanged."
                : "Create a new account in the system."}
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
          <Field label="First name">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field label="Last name">
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        </div>

        <Field label="Username" required>
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

        <Field label="Email" required>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field
          label={isEdit ? "New password (optional)" : "Password"}
          required={!isEdit}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required={!isEdit}
            minLength={isEdit && password.length === 0 ? undefined : 8}
            placeholder={isEdit ? "Leave blank to keep current password" : ""}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {/* Show the checklist for new users always, and for edits only when
              the admin is actually entering a new password. */}
          <PasswordRequirements
            value={password}
            hideWhenEmpty={isEdit}
            className="mt-2"
          />
        </Field>

        <Field label="User type" required>
          <select
            value={type}
            onChange={(e) => {
              const t = e.target.value as UserType;
              setType(t);
              if (t !== "driver") setVehicleId(null);
            }}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {USER_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>

        {type === "driver" && (
          <Field label="Assigned vehicle">
            <select
              value={vehicleId ?? ""}
              onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— None / Unassigned —</option>
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
          Active
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !passwordOk}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium"
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save changes"
                : "Create user"}
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
