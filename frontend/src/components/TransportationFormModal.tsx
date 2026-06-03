import { FormEvent, useEffect, useState } from "react";
import { transportationsApi, usersApi, vendorsApi, projectsApi, materialsApi, getStoredUser } from "../services/api";
import type { TransportationListItem } from "../types/transportation";
import type { UserListItem } from "../types/users";
import type { VendorListItem } from "../types/vendors";
import type { ProjectListItem } from "../types/projects";
import type { MaterialListItem } from "../types/materials";

export type TransportationFormMode =
  | { kind: "add" }
  | { kind: "edit"; transportation: TransportationListItem };

interface Props {
  open: boolean;
  mode: TransportationFormMode;
  onClose: () => void;
  onSaved: (item: TransportationListItem, mode: TransportationFormMode["kind"]) => void;
}

const OTHER = "other";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function displayName(u: UserListItem) {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return full || u.username;
}

export default function TransportationFormModal({ open, mode, onClose, onSaved }: Props) {
  const isEdit = mode.kind === "edit";

  const [drivers, setDrivers] = useState<UserListItem[]>([]);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [transportedById, setTransportedById] = useState<number>(0);

  const [vendorSel, setVendorSel] = useState<string>("");
  const [vendorOther, setVendorOther] = useState("");

  const [projectSel, setProjectSel] = useState<string>("");
  const [projectOther, setProjectOther] = useState("");
  const [materialId, setMaterialId] = useState<number | null>(null);

  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Derive vehicle from the selected driver — no separate state needed.
  const selectedUser = drivers.find((u) => u.id === transportedById);
  const assignedVehicleId = selectedUser?.vehicleId ?? null;
  const assignedVehicleName = selectedUser?.assignedVehicleName ?? null;

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    Promise.all([usersApi.drivers(), vendorsApi.list(), projectsApi.list(), materialsApi.list()])
      .then(([d, v, p, m]) => {
        setDrivers(d);
        setVendors(v);
        setProjects(p);
        setMaterials(m);

        if (mode.kind === "edit") {
          const t = mode.transportation;
          setTransportedById(t.transportedById);
          setDate(t.date.slice(0, 10));
          setMaterialId(t.materialId ?? null);

          if (t.vendorId) {
            setVendorSel(String(t.vendorId));
            setVendorOther("");
          } else {
            setVendorSel(OTHER);
            setVendorOther(t.vendorOther ?? "");
          }

          if (t.projectId) {
            setProjectSel(String(t.projectId));
            setProjectOther("");
          } else {
            setProjectSel(OTHER);
            setProjectOther(t.projectOther ?? "");
          }
        } else {
          const stored = getStoredUser();
          const match = d.find((x) => x.id === stored?.id);
          setTransportedById(match?.id ?? d[0]?.id ?? 0);
          setMaterialId(null);
          setVendorSel(v[0] ? String(v[0].id) : OTHER);
          setVendorOther("");
          setProjectSel(p[0] ? String(p[0].id) : OTHER);
          setProjectOther("");
          setDate(todayIso());
        }
      })
      .catch(() => setError("Failed to load dropdown options."))
      .finally(() => setLoadingOptions(false));
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

    if (vendorSel === OTHER && !vendorOther.trim()) {
      setError("Please enter the vendor name.");
      return;
    }
    if (projectSel === OTHER && !projectOther.trim()) {
      setError("Please enter the project name.");
      return;
    }

    const body = {
      transportedById,
      vehicleId: assignedVehicleId,
      materialId,
      vendorId: vendorSel !== OTHER ? Number(vendorSel) : null,
      vendorOther: vendorSel === OTHER ? vendorOther.trim() : null,
      projectId: projectSel !== OTHER ? Number(projectSel) : null,
      projectOther: projectSel === OTHER ? projectOther.trim() : null,
      date,
    };

    setSaving(true);
    try {
      if (mode.kind === "add") {
        const created = await transportationsApi.create(body);
        onSaved(created, "add");
      } else {
        const updated = await transportationsApi.update(mode.transportation.id, body);
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
              {isEdit ? "Edit transportation" : "Add transportation"}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? "Update transportation details." : "Log a new transportation entry."}
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
          <p className="text-sm text-slate-500 py-4 text-center">Loading options...</p>
        ) : (
          <>
            <Field label="Transportation by" required>
              <select
                value={transportedById}
                onChange={(e) => setTransportedById(Number(e.target.value))}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {drivers.map((u) => (
                  <option key={u.id} value={u.id}>{displayName(u)}</option>
                ))}
              </select>
            </Field>

            <Field label="Vehicle">
              <input
                type="text"
                value={assignedVehicleName ?? "— No vehicle assigned —"}
                disabled
                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
              />
            </Field>

            <Field label="Material">
              <select
                value={materialId ?? ""}
                onChange={(e) => setMaterialId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— None —</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Vendor" required>
              <select
                value={vendorSel}
                onChange={(e) => { setVendorSel(e.target.value); setVendorOther(""); }}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={String(v.id)}>{v.name}</option>
                ))}
                <option value={OTHER}>Other</option>
              </select>
              {vendorSel === OTHER && (
                <input
                  type="text"
                  value={vendorOther}
                  onChange={(e) => setVendorOther(e.target.value)}
                  placeholder="Enter vendor name"
                  className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </Field>

            <Field label="Project" required>
              <select
                value={projectSel}
                onChange={(e) => { setProjectSel(e.target.value); setProjectOther(""); }}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
                <option value={OTHER}>Other</option>
              </select>
              {projectSel === OTHER && (
                <input
                  type="text"
                  value={projectOther}
                  onChange={(e) => setProjectOther(e.target.value)}
                  placeholder="Enter project name"
                  className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </Field>

            <Field label="Date" required>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={saving}
            className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving || loadingOptions}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium">
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add transportation"}
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
