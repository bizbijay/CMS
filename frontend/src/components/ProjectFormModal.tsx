import { FormEvent, useEffect, useState } from "react";
import { projectsApi } from "../services/api";
import type { ProjectListItem } from "../types/projects";

export type ProjectFormMode =
  | { kind: "add" }
  | { kind: "edit"; project: ProjectListItem };

interface Props {
  open: boolean;
  mode: ProjectFormMode;
  onClose: () => void;
  onSaved: (project: ProjectListItem, mode: ProjectFormMode["kind"]) => void;
}

export default function ProjectFormModal({ open, mode, onClose, onSaved }: Props) {
  const isEdit = mode.kind === "edit";
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(mode.kind === "edit" ? mode.project.name : "");
    setError(null);
  }, [open, mode]);

  if (!open) return null;

  function handleClose() {
    if (saving) return;
    onClose();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body = { name: name.trim() };
    setSaving(true);
    try {
      if (mode.kind === "add") {
        const created = await projectsApi.create(body);
        onSaved(created, "add");
      } else {
        const updated = await projectsApi.update(mode.project.id, body);
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
              {isEdit ? "Edit project" : "Add project"}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? "Update the project name." : "Register a new project."}
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Project name<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Site A Development"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium">
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add project"}
          </button>
        </div>
      </form>
    </div>
  );
}
