import { FormEvent, useEffect, useState } from "react";
import { projectsApi, governmentOfficesApi } from "../services/api";
import { useT } from "../hooks/useT";
import type { ProjectListItem } from "../types/projects";
import type { GovernmentOfficeListItem } from "../types/governmentOffice";
import NepaliCalendarPicker from "./NepaliCalendarPicker";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

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
  const t = useT();
  const isEdit = mode.kind === "edit";

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [issuedOfficeId, setIssuedOfficeId] = useState<string>("");
  const [startDate, setStartDate] = useState(todayIso());
  const [endDate, setEndDate] = useState("");
  const [projectCost, setProjectCost] = useState("");
  const [offices, setOffices] = useState<GovernmentOfficeListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    governmentOfficesApi.list().then(setOffices).catch(() => {});
    if (mode.kind === "edit") {
      const p = mode.project;
      setName(p.name);
      setAddress(p.address ?? "");
      setIssuedOfficeId(p.issuedOfficeId?.toString() ?? "");
      setStartDate(p.startDate ?? todayIso());
      setEndDate(p.endDate ?? "");
      setProjectCost(p.projectCost?.toString() ?? "");
    } else {
      setName("");
      setAddress("");
      setIssuedOfficeId("");
      setStartDate(todayIso());
      setEndDate("");
      setProjectCost("");
    }
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
    const body = {
      name: name.trim(),
      address: address.trim() || null,
      issuedOfficeId: issuedOfficeId ? Number(issuedOfficeId) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      projectCost: projectCost ? parseFloat(projectCost) : null,
    };
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
        className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? t.modal.projects.editTitle : t.modal.projects.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.projects.editSubtitle : t.modal.projects.addSubtitle}
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

        {/* Project Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.modal.projects.nameLabel}<span className="text-red-500 ml-0.5">*</span>
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

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.address}</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Kathmandu, Bagmati Province"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Issued Office */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.issuedOffice}</label>
          <select
            value={issuedOfficeId}
            onChange={(e) => setIssuedOfficeId(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— {t.common.select} —</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        {/* Start Date / End Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.startDate}</label>
            <NepaliCalendarPicker value={startDate} onChange={setStartDate} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.endDate}</label>
            <NepaliCalendarPicker value={endDate} onChange={setEndDate} />
          </div>
        </div>

        {/* Project Cost */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t.common.projectCost}</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={projectCost}
            onChange={(e) => setProjectCost(e.target.value)}
            placeholder="0.00"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium">
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.projects.addTitle}
          </button>
        </div>
      </form>
    </div>
  );
}
