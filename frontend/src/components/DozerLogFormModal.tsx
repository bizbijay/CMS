import { FormEvent, useEffect, useState } from "react";
import { dozerLogsApi, usersApi, projectsApi, getStoredUser } from "../services/api";
import { useT } from "../hooks/useT";
import type { DozerLogListItem } from "../types/dozerLog";
import type { UserListItem } from "../types/users";
import type { ProjectListItem } from "../types/projects";

export type DozerLogFormMode =
  | { kind: "add" }
  | { kind: "edit"; log: DozerLogListItem };

interface Props {
  open: boolean;
  mode: DozerLogFormMode;
  onClose: () => void;
  onSaved: (item: DozerLogListItem, mode: DozerLogFormMode["kind"]) => void;
}

const MS_PER_HOUR = 3_600_000;
const MS_PER_MINUTE = 60_000;
const OTHER = "other";

function msToHoursMinutes(ms: number) {
  const hours = Math.floor(ms / MS_PER_HOUR);
  const minutes = Math.floor((ms % MS_PER_HOUR) / MS_PER_MINUTE);
  return { hours, minutes };
}

function hoursMinutesToMs(hours: number, minutes: number) {
  return hours * MS_PER_HOUR + minutes * MS_PER_MINUTE;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function displayName(u: UserListItem) {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return full || u.username;
}

export default function DozerLogFormModal({ open, mode, onClose, onSaved }: Props) {
  const tr = useT();
  const isEdit = mode.kind === "edit";

  const [drivers, setDrivers] = useState<UserListItem[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isCurrentUserDriver, setIsCurrentUserDriver] = useState(false);

  const [driverId, setDriverId] = useState<number>(0);
  const [operationDate, setOperationDate] = useState(todayIso());
  const [operatedHours, setOperatedHours] = useState<string>("0");
  const [operatedMinutes, setOperatedMinutes] = useState<string>("0");
  const [projectSel, setProjectSel] = useState<string>("");
  const [projectOther, setProjectOther] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedDriver = drivers.find((u) => u.id === driverId);
  const assignedVehicleId = selectedDriver?.vehicleId ?? null;
  const assignedVehicleName = selectedDriver?.assignedVehicleName ?? null;

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    Promise.all([usersApi.dozerDrivers(), projectsApi.list()])
      .then(([d, p]) => {
        setDrivers(d);
        setProjects(p);

        const stored = getStoredUser();
        const selfMatch = d.find((x) => x.id === stored?.id);
        setIsCurrentUserDriver(!!selfMatch);

        if (mode.kind === "edit") {
          const log = mode.log;
          setDriverId(log.driverId);
          setOperationDate(log.operationDate.slice(0, 10));
          const { hours, minutes } = msToHoursMinutes(log.operatedTimeMs);
          setOperatedHours(String(hours));
          setOperatedMinutes(String(minutes));

          if (log.projectId) {
            setProjectSel(String(log.projectId));
            setProjectOther("");
          } else {
            setProjectSel(OTHER);
            setProjectOther(log.projectOther ?? "");
          }
        } else {
          setDriverId(selfMatch?.id ?? d[0]?.id ?? 0);
          setOperationDate(todayIso());
          setOperatedHours("0");
          setOperatedMinutes("0");
          setProjectSel(p[0] ? String(p[0].id) : OTHER);
          setProjectOther("");
        }
      })
      .catch(() => setError(tr.modal.loadError))
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

    const hours = parseInt(operatedHours, 10);
    const minutes = parseInt(operatedMinutes, 10);

    if (isNaN(hours) || hours < 0 || hours > 23) {
      setError(tr.modal.dozerLog.errorInvalidHours);
      return;
    }
    if (isNaN(minutes) || minutes < 0 || minutes > 59) {
      setError(tr.modal.dozerLog.errorInvalidMinutes);
      return;
    }
    if (projectSel === OTHER && !projectOther.trim()) {
      setError(tr.modal.dozerLog.errorNoProject);
      return;
    }

    const body = {
      driverId,
      vehicleId: assignedVehicleId,
      operationDate,
      operatedTimeMs: hoursMinutesToMs(hours, minutes),
      projectId: projectSel !== OTHER ? Number(projectSel) : null,
      projectOther: projectSel === OTHER ? projectOther.trim() : null,
    };

    setSaving(true);
    try {
      if (mode.kind === "add") {
        const created = await dozerLogsApi.create(body);
        onSaved(created, "add");
      } else {
        const updated = await dozerLogsApi.update(mode.log.id, body);
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
              {isEdit ? tr.modal.dozerLog.editTitle : tr.modal.dozerLog.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? tr.modal.dozerLog.editSubtitle : tr.modal.dozerLog.addSubtitle}
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
            {!isCurrentUserDriver && (
              <Field label={tr.common.operator} required>
                <select
                  value={driverId}
                  onChange={(e) => setDriverId(Number(e.target.value))}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {drivers.map((u) => (
                    <option key={u.id} value={u.id}>{displayName(u)}</option>
                  ))}
                </select>
              </Field>
            )}

            {!isCurrentUserDriver && (
              <Field label={tr.common.vehicle}>
                <input
                  type="text"
                  value={assignedVehicleName ?? tr.common.noVehicleAssigned}
                  disabled
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
                />
              </Field>
            )}

            <Field label={tr.common.date} required>
              <input
                type="date"
                value={operationDate}
                onChange={(e) => setOperationDate(e.target.value)}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={tr.common.hours} required>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={operatedHours}
                  onChange={(e) => setOperatedHours(e.target.value)}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label={tr.common.minutes} required>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={operatedMinutes}
                  onChange={(e) => setOperatedMinutes(e.target.value)}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>

            <Field label={tr.common.project} required>
              <select
                value={projectSel}
                onChange={(e) => { setProjectSel(e.target.value); setProjectOther(""); }}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
                <option value={OTHER}>{tr.modal.dozerLog.otherOption}</option>
              </select>
              {projectSel === OTHER && (
                <input
                  type="text"
                  value={projectOther}
                  onChange={(e) => setProjectOther(e.target.value)}
                  placeholder={tr.modal.dozerLog.enterProjectName}
                  className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
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
            {saving ? tr.common.saving : isEdit ? tr.common.saveChanges : tr.modal.dozerLog.addButton}
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
