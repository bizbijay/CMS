import { useCallback, useEffect, useState } from "react";
import { rolesApi } from "../services/api";
import type { RoleListItem } from "../types/roles";
import RoleFormModal, { type RoleFormMode } from "../components/RoleFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toaster";

export default function Roles() {
  const { addToast } = useToast();
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<RoleFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RoleListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await rolesApi.list();
      setRoles(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onSaved(role: RoleListItem, kind: RoleFormMode["kind"]) {
    if (kind === "add") {
      setRoles((prev) => [role, ...prev]);
      addToast("Role added successfully.", "success");
    } else {
      setRoles((prev) => prev.map((r) => (r.id === role.id ? role : r)));
      addToast("Role updated successfully.", "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await rolesApi.remove(pendingDelete.id);
      setRoles((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast("Role deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">Roles</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            Refresh
          </button>
          <button
            onClick={() => setModalMode({ kind: "add" })}
            className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add role
          </button>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Role name</Th>
                <Th className="text-right whitespace-nowrap">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
              ) : roles.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No roles yet. Click "Add role" to create one.</td></tr>
              ) : (
                roles.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <Td><span className="font-medium text-slate-800">{r.name}</span></Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-1.5">
                        <IconButton tooltip="Edit role" icon={<PencilIcon />} onClick={() => setModalMode({ kind: "edit", role: r })} />
                        <IconButton tooltip="Delete role" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDelete(r)} />
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RoleFormModal
        open={modalMode !== null}
        mode={modalMode ?? { kind: "add" }}
        onClose={() => setModalMode(null)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete role"
        message={pendingDelete ? `Are you sure you want to delete "${pendingDelete.name}"? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        tone="danger"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left font-medium uppercase text-xs tracking-wide px-4 py-3 ${className ?? ""}`}>{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-slate-700 ${className ?? ""}`}>{children}</td>;
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
