import { FormEvent, useEffect, useState } from "react";
import { dozerLogsApi, usersApi, projectsApi, partyNamesApi, vehiclesApi, getStoredUser } from "../services/api";
import NepaliCalendarPicker from "./NepaliCalendarPicker";
import { useT } from "../hooks/useT";
import type { DozerLogListItem } from "../types/dozerLog";
import type { UserListItem } from "../types/users";
import type { ProjectListItem } from "../types/projects";
import type { PartyNameListItem } from "../types/partyName";
import type { VehicleListItem } from "../types/vehicles";

export type DozerLogFormMode =
  | { kind: "add" }
  | { kind: "edit"; log: DozerLogListItem };

interface Props {
  open: boolean;
  mode: DozerLogFormMode;
  onClose: () => void;
  onSaved: (item: DozerLogListItem, mode: DozerLogFormMode["kind"]) => void;
}

const OTHER = "other";

function decimalHoursToHoursMinutes(decimalHours: number) {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return { hours, minutes };
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
  const [partyNames, setPartyNames] = useState<PartyNameListItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isCurrentUserDriver, setIsCurrentUserDriver] = useState(false);

  const [driverId, setDriverId] = useState<number>(0);
  const [operationDate, setOperationDate] = useState(todayIso());
  const [startMeter, setStartMeter] = useState<string>("0");
  const [endMeter, setEndMeter] = useState<string>("0");

  const [referenceType, setReferenceType] = useState<"project" | "partyName">("project");
  const [projectSel, setProjectSel] = useState<string>("");
  const [projectOther, setProjectOther] = useState("");
  const [partyNameId, setPartyNameId] = useState<number | null>(null);

  const [location, setLocation] = useState("");
  const [paymentType, setPaymentType] = useState<string>("Credit");
  const [cashAmount, setCashAmount] = useState("");
  const [workOrderBy, setWorkOrderBy] = useState("");
  const [wages, setWages] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedDriver = drivers.find((u) => u.id === driverId);
  const assignedVehicleId = selectedDriver?.vehicleId ?? (mode.kind === "edit" ? mode.log.vehicleId : null);
  const assignedVehicle = vehicles.find((v) => v.id === assignedVehicleId);
  const assignedVehicleName = selectedDriver?.assignedVehicleName ?? (assignedVehicle ? `${assignedVehicle.name} (${assignedVehicle.numberPlate})` : null);
  const vehicleOwnership = assignedVehicle ? String(assignedVehicle.ownership).toLowerCase() : "owned";
  const isPartnered = vehicleOwnership === "partnered";

  const totalMeterRun = Math.max(0, parseFloat(endMeter || "0") - parseFloat(startMeter || "0"));
  const { hours: displayHours, minutes: displayMinutes } = decimalHoursToHoursMinutes(totalMeterRun);

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    Promise.all([usersApi.dozerDrivers(), projectsApi.list(), partyNamesApi.list(), vehiclesApi.list()])
      .then(async ([d, p, pn, v]) => {
        setDrivers(d);
        setProjects(p);
        setPartyNames(pn ?? []);
        setVehicles(v ?? []);

        const stored = getStoredUser();
        const selfMatch = d.find((x) => x.id === stored?.id);
        setIsCurrentUserDriver(!!selfMatch);

        if (mode.kind === "edit") {
          const log = mode.log;
          setDriverId(log.driverId);
          setOperationDate(log.operationDate.slice(0, 10));
          setStartMeter(String(log.startMeter));
          setEndMeter(String(log.endMeter));

          if (log.partyNameId) {
            setReferenceType("partyName");
            setPartyNameId(log.partyNameId);
            setProjectSel(p[0] ? String(p[0].id) : OTHER);
            setProjectOther("");
          } else {
            setReferenceType("project");
            setPartyNameId(null);
            if (log.projectId) {
              setProjectSel(String(log.projectId));
              setProjectOther("");
            } else {
              setProjectSel(OTHER);
              setProjectOther(log.projectOther ?? "");
            }
          }

          setWages(log.wages != null ? String(log.wages) : "");
          setLocation(log.location ?? "");
          setPaymentType(log.paymentType ?? "Credit");
          setCashAmount(log.cashAmount != null ? String(log.cashAmount) : "");
          setWorkOrderBy(log.workOrderBy ?? "");
        } else {
          const targetDriverId = selfMatch?.id ?? d[0]?.id ?? 0;
          setDriverId(targetDriverId);
          setOperationDate(todayIso());

          // Fetch the last log for this driver to use its end meter as start meter
          try {
            const allLogs = await dozerLogsApi.list();
            const lastLog = allLogs
              .filter(log => log.driverId === targetDriverId)
              .sort((a, b) => new Date(b.operationDate).getTime() - new Date(a.operationDate).getTime())
              .at(0);

            setStartMeter(lastLog ? String(lastLog.endMeter) : "0");
          } catch {
            setStartMeter("0");
          }

          setEndMeter("0");
          setReferenceType("project");
          setProjectSel(p[0] ? String(p[0].id) : OTHER);
          setProjectOther("");
          setPartyNameId(null);
          setWages("1500");
          setLocation("");
          setPaymentType("Credit");
          setCashAmount("");
          setWorkOrderBy("");
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

    const startMeterVal = parseFloat(startMeter);
    const endMeterVal = parseFloat(endMeter);

    if (isNaN(startMeterVal) || startMeterVal < 0) {
      setError(tr.modal.dozerLog.errorInvalidStartMeter);
      return;
    }
    if (isNaN(endMeterVal) || endMeterVal < 0) {
      setError(tr.modal.dozerLog.errorInvalidEndMeter);
      return;
    }
    if (endMeterVal <= startMeterVal) {
      setError(tr.modal.dozerLog.errorEndMeterLessThanStart);
      return;
    }

    const selectedProjectId = referenceType === "project" ? (projectSel && projectSel !== OTHER ? Number(projectSel) : null) : null;
    const selectedProjectOther = referenceType === "project" ? (projectSel === OTHER ? projectOther.trim() : null) : null;
    const selectedPartyNameId = referenceType === "partyName" ? partyNameId ?? null : null;

    if (referenceType === "project") {
      if (projectSel === OTHER) {
        if (!projectOther.trim()) {
          setError(tr.modal.dozerLog.errorNoProject);
          return;
        }
      } else if (!selectedProjectId) {
        setError(tr.modal.dozerLog.errorNoProject);
        return;
      }
    } else {
      if (!selectedPartyNameId) {
        setError(tr.modal.dozerLog.errorNoPartyName);
        return;
      }
    }

    const parsedWages = wages.trim() !== "" ? parseFloat(wages) : null;
    const parsedCashAmount = paymentType === "Cash" && cashAmount.trim() !== "" ? parseFloat(cashAmount) : null;

    const body = {
      driverId,
      vehicleId: assignedVehicleId,
      operationDate,
      startMeter: startMeterVal,
      endMeter: endMeterVal,
      projectId: selectedProjectId,
      projectOther: selectedProjectOther,
      wages: parsedWages !== null && !isNaN(parsedWages) ? parsedWages : null,
      partyNameId: selectedPartyNameId,
      location: location.trim() || null,
      paymentType: isPartnered ? (paymentType || null) : null,
      cashAmount: isPartnered && paymentType === "Cash" && parsedCashAmount !== null && !isNaN(parsedCashAmount) ? parsedCashAmount : null,
      workOrderBy: isPartnered ? (workOrderBy.trim() || null) : null,
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
        className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
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

            {/* Hidden field storing vehicle ownership info */}
            <input type="hidden" name="vehicleOwnership" value={vehicleOwnership} />

            <Field label={tr.common.date} required>
              <NepaliCalendarPicker
                value={operationDate}
                onChange={setOperationDate}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={tr.common.startMeter} required>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={startMeter}
                  onChange={(e) => setStartMeter(e.target.value)}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label={tr.common.endMeter} required>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={endMeter}
                  onChange={(e) => setEndMeter(e.target.value)}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>

            <div className="rounded bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm font-medium text-slate-700 mb-2">{tr.common.totalMeterRun}</p>
              <p className="text-lg font-semibold text-blue-700">
                {totalMeterRun.toFixed(1)} hrs ({displayHours}h {displayMinutes}m)
              </p>
            </div>

            <div>
              <div className="flex items-center gap-6 mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="referenceType"
                    value="project"
                    checked={referenceType === "project"}
                    onChange={() => {
                      setReferenceType("project");
                      setPartyNameId(null);
                    }}
                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {tr.common.project}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="referenceType"
                    value="partyName"
                    checked={referenceType === "partyName"}
                    onChange={() => {
                      setReferenceType("partyName");
                      setProjectSel("");
                      setProjectOther("");
                    }}
                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {tr.common.partyName}
                </label>
              </div>
            </div>

            {referenceType === "project" ? (
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
            ) : (
              <Field label={tr.common.partyName} required>
                <select
                  value={partyNameId ?? ""}
                  onChange={(e) => setPartyNameId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{tr.common.selectPartyName}</option>
                  {partyNames.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label={tr.common.location}>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={tr.modal.dozerLog.enterLocation}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            {isPartnered && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {tr.common.paymentType}
                  </label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="dozerPaymentType"
                        value="Credit"
                        checked={paymentType === "Credit"}
                        onChange={() => {
                          setPaymentType("Credit");
                          setCashAmount("");
                        }}
                        className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {tr.common.credit}
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="dozerPaymentType"
                        value="Cash"
                        checked={paymentType === "Cash"}
                        onChange={() => setPaymentType("Cash")}
                        className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      {tr.common.cash}
                    </label>
                  </div>
                </div>

                {paymentType === "Cash" && (
                  <Field label={tr.common.cashAmount}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      placeholder={tr.modal.dozerLog.enterCashAmount}
                      className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </Field>
                )}

                <Field label={tr.common.workOrderBy}>
                  <input
                    type="text"
                    value={workOrderBy}
                    onChange={(e) => setWorkOrderBy(e.target.value)}
                    placeholder={tr.modal.dozerLog.enterWorkOrderBy}
                    className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </Field>
              </>
            )}

            <Field label={tr.common.wages}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={wages}
                onChange={(e) => setWages(e.target.value)}
                disabled
                placeholder="0"
                className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
              />
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
