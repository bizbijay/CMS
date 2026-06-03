import { useCallback, useEffect, useState } from "react";
import { rolesApi, permissionsApi, rolePermissionsApi } from "../services/api";
import type { RoleListItem } from "../types/roles";
import type { PermissionListItem } from "../types/permissions";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { usePolicy } from "../hooks/usePolicy";

export default function RolePermissions() {
  const { addToast } = useToast();
  const canEdit = usePolicy("role_permissions.edit");
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionListItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingRole, setLoadingRole] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([rolesApi.list(), permissionsApi.list()])
      .then(([r, p]) => {
        setRoles(r);
        setPermissions(p);
        if (r.length > 0) setSelectedRoleId(r[0].id);
      })
      .catch(() => setError("Failed to load roles or permissions."))
      .finally(() => setLoadingOptions(false));
  }, []);

  const loadRolePermissions = useCallback(async (roleId: number) => {
    setLoadingRole(true);
    setError(null);
    try {
      const rp = await rolePermissionsApi.getByRole(roleId);
      setAssignedIds(new Set(rp.permissionIds));
    } catch {
      setAssignedIds(new Set());
    } finally {
      setLoadingRole(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRoleId !== null) loadRolePermissions(selectedRoleId);
  }, [selectedRoleId, loadRolePermissions]);

  function toggle(permId: number) {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) next.delete(permId);
      else next.add(permId);
      return next;
    });
  }

  async function save() {
    if (selectedRoleId === null) return;
    setSaving(true);
    setError(null);
    try {
      await rolePermissionsApi.set(selectedRoleId, { permissionIds: Array.from(assignedIds) });
      addToast("Permissions saved.", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Role Permissions</h2>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

      {loadingOptions ? (
        <p className="text-slate-500 text-sm">Loading...</p>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select role</label>
              <select
                value={selectedRoleId ?? ""}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {selectedRole && (
              <>
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">
                    Permissions for <span className="text-blue-600">{selectedRole.name}</span>
                  </p>

                  {loadingRole ? (
                    <p className="text-sm text-slate-500">Loading permissions...</p>
                  ) : permissions.length === 0 ? (
                    <p className="text-sm text-slate-500">No permissions defined yet. Go to the Permissions page to add some.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {permissions.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-start gap-3 rounded border border-slate-200 px-3 py-2.5 cursor-pointer hover:bg-slate-50 select-none"
                        >
                          <input
                            type="checkbox"
                            checked={assignedIds.has(p.id)}
                            onChange={() => toggle(p.id)}
                            disabled={!canEdit}
                            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <div>
                            <p className="text-sm font-mono font-medium text-slate-800">{p.name}</p>
                            {p.description && (
                              <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <Can do="role_permissions.edit">
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={save}
                      disabled={saving || loadingRole}
                      className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium"
                    >
                      {saving ? "Saving..." : "Save permissions"}
                    </button>
                  </div>
                </Can>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
