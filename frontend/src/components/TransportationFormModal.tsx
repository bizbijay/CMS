import { FormEvent, useEffect, useState } from "react";
import { transportationsApi, usersApi, vendorsApi, projectsApi, materialsApi, partyNamesApi, getStoredUser } from "../services/api";
import NepaliCalendarPicker from "./NepaliCalendarPicker";
import { useT } from "../hooks/useT";
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
  const tr = useT();
  const isEdit = mode.kind === "edit";
  const canViewCosts = getStoredUser()?.roleName?.toLowerCase() === 'admin';

  const [drivers, setDrivers] = useState<UserListItem[]>([]);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [materials, setMaterials] = useState<MaterialListItem[]>([]);
  const [partyNames, setPartyNames] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isCurrentUserDriver, setIsCurrentUserDriver] = useState(false);

  // "other" = manual entry; any string number = driver id
  const [transportedBySel, setTransportedBySel] = useState<string>("");
  const [transportedByOther, setTransportedByOther] = useState("");

  const [vendorSel, setVendorSel] = useState<string>("");
  const [vendorOther, setVendorOther] = useState("");

  const [projectSel, setProjectSel] = useState<string>("");
  const [projectOther, setProjectOther] = useState("");
  const [referenceType, setReferenceType] = useState<"project" | "partyName">("project");

  // vehicleOther is only used when transportedBySel === OTHER
  const [vehicleOther, setVehicleOther] = useState("");

  const [materialId, setMaterialId] = useState<number | null>(null);
  const [location, setLocation] = useState("");
  const [partyNameId, setPartyNameId] = useState<number | null>(null);
  const [noOfTip, setNoOfTip] = useState("1");
  const [quantity, setQuantity] = useState("1");
  const [perUnitCost, setPerUnitCost] = useState("");
  const [tax, setTax] = useState("");
  const [wages, setWages] = useState("");

  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const computedMaterialCost =
    quantity !== "" && perUnitCost !== ""
      ? Number(quantity) * Number(perUnitCost)
      : null;

  const parsedWagesRate = wages !== "" ? Number(wages) : null;
  const parsedTips = noOfTip !== "" ? Math.max(1, Number(noOfTip)) : 1;
  const computedTotalWages = parsedWagesRate !== null ? parsedWagesRate * parsedTips : null;

  // Derive vehicle from the selected driver when a registered driver is chosen.
  const isOtherTransporter = transportedBySel === OTHER;
  const selectedUser = isOtherTransporter ? undefined : drivers.find((u) => u.id === Number(transportedBySel));
  const assignedVehicleId = selectedUser?.vehicleId ?? null;
  const assignedVehicleName = selectedUser?.assignedVehicleName ?? null;

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    Promise.all([usersApi.drivers(), vendorsApi.list(), projectsApi.list(), materialsApi.list(), partyNamesApi.list()])
      .then(([d, v, p, m, pn]) => {
        const safeD = d ?? [];
        const safeV = v ?? [];
        const safeP = p ?? [];
        const safeM = m ?? [];
        const safePartyNames = pn ?? [];
        setDrivers(safeD);
        setVendors(safeV);
        setProjects(safeP);
        setMaterials(safeM);
        setPartyNames(safePartyNames);

        const stored = getStoredUser();
        const selfMatch = safeD.find((x) => x.id === stored?.id);
        setIsCurrentUserDriver(!!selfMatch);

        if (mode.kind === "edit") {
          const t = mode.transportation;

          if (t.transportedById) {
            setTransportedBySel(String(t.transportedById));
            setTransportedByOther("");
          } else {
            setTransportedBySel(OTHER);
            setTransportedByOther(t.transportedByOther ?? "");
          }

          setVehicleOther(t.vehicleOther ?? "");
          setDate(t.date.slice(0, 10));
          setMaterialId(t.materialId ?? null);
          setLocation(t.location ?? "");
          setPartyNameId(t.partyNameId ?? null);
          setReferenceType(t.partyNameId ? "partyName" : "project");
          setNoOfTip(t.noOfTip != null && t.noOfTip >= 1 ? String(t.noOfTip) : "1");
          setQuantity(t.quantity != null ? String(t.quantity) : "");
          setPerUnitCost(t.perUnitCost != null ? String(t.perUnitCost) : "");
          setTax(t.tax != null ? String(t.tax) : "");
          setWages(t.wages != null ? String(t.wages) : "");

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
          if (selfMatch) {
            setTransportedBySel(String(selfMatch.id));
          } else {
            setTransportedBySel(safeD[0] ? String(safeD[0].id) : OTHER);
          }
          setTransportedByOther("");
          setVehicleOther("");
          setMaterialId(null);
          setLocation("");
          setPartyNameId(null);
          setReferenceType("project");
          setNoOfTip("1");
          setQuantity("1");
          setPerUnitCost("");
          setTax("");
          setWages("");
          setVendorSel(safeV[0] ? String(safeV[0].id) : OTHER);
          setVendorOther("");
          setProjectSel(safeP[0] ? String(safeP[0].id) : OTHER);
          setProjectOther("");
          setDate(todayIso());
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

    if (isOtherTransporter && !transportedByOther.trim()) {
      setError(tr.modal.transportation.errorNoTransportedBy);
      return;
    }
    if (vendorSel === OTHER && !vendorOther.trim()) {
      setError(tr.modal.transportation.errorNoVendor);
      return;
    }

    const selectedProjectId = referenceType === "project" && projectSel !== OTHER ? Number(projectSel) : null;
    const selectedProjectOther = referenceType === "project" && projectSel === OTHER ? projectOther.trim() || null : null;
    const selectedPartyNameId = referenceType === "partyName" ? partyNameId ?? null : null;

    if (referenceType === "project" && !selectedProjectId && !selectedProjectOther) {
      setError(tr.modal.transportation.errorNoProject);
      return;
    }
    if (referenceType === "partyName" && !selectedPartyNameId) {
      setError("Please select a party name.");
      return;
    }

    const body = {
      transportedById: isOtherTransporter ? null : Number(transportedBySel),
      transportedByOther: isOtherTransporter ? transportedByOther.trim() : null,
      vehicleId: isOtherTransporter ? null : assignedVehicleId,
      vehicleOther: isOtherTransporter ? (vehicleOther.trim() || null) : null,
      materialId,
      vendorId: vendorSel !== OTHER ? Number(vendorSel) : null,
      vendorOther: vendorSel === OTHER ? vendorOther.trim() : null,
      projectId: selectedProjectId,
      projectOther: selectedProjectOther,
      location: location.trim() || null,
      partyNameId: selectedPartyNameId,
      noOfTip: parsedTips,
      quantity: quantity !== "" ? Number(quantity) : null,
      perUnitCost: perUnitCost !== "" ? Number(perUnitCost) : null,
      tax: tax !== "" ? Number(tax) : null,
      wages: parsedWagesRate,
      totalWages: computedTotalWages,
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
        className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 space-y-3 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? tr.modal.transportation.editTitle : tr.modal.transportation.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? tr.modal.transportation.editSubtitle : tr.modal.transportation.addSubtitle}
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
              <Field label={tr.common.transportedBy} required>
                <select
                  value={transportedBySel}
                  onChange={(e) => { setTransportedBySel(e.target.value); setTransportedByOther(""); setVehicleOther(""); }}
                  required={!isOtherTransporter}
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {drivers.map((u) => (
                    <option key={u.id} value={String(u.id)}>{displayName(u)}</option>
                  ))}
                  <option value={OTHER}>{tr.modal.transportation.otherOption}</option>
                </select>
                {isOtherTransporter && (
                  <input
                    type="text"
                    value={transportedByOther}
                    onChange={(e) => setTransportedByOther(e.target.value)}
                    placeholder={tr.modal.transportation.enterTransportedByName}
                    required
                    className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </Field>
            )}

            {!isCurrentUserDriver && (
              <Field label={tr.common.vehicle}>
                {isOtherTransporter ? (
                  <input
                    type="text"
                    value={vehicleOther}
                    onChange={(e) => setVehicleOther(e.target.value)}
                    placeholder={tr.modal.transportation.enterVehicleName}
                    className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={assignedVehicleName ?? tr.common.noVehicleAssigned}
                    disabled
                    className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
                  />
                )}
              </Field>
            )}

            <Field label={tr.common.material}>
              <select
                value={materialId ?? ""}
                onChange={(e) => setMaterialId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{tr.modal.transportation.noneOption}</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>

            {canViewCosts && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={tr.common.quantity}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </Field>
                  <Field label={tr.common.perUnitCost}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={perUnitCost}
                      onChange={(e) => setPerUnitCost(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </Field>
                </div>
                {computedMaterialCost !== null && (
                  <div className="flex items-center justify-between rounded bg-slate-50 border border-slate-200 px-3 py-2 text-sm">
                    <span className="text-slate-500">{tr.common.materialCost}</span>
                    <span className="font-semibold text-slate-800">
                      {tr.common.currencySymbol} {computedMaterialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <Field label={tr.common.tax}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </Field>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label={tr.common.wages}>
                <select
                  value={wages}
                  onChange={(e) => setWages(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">—</option>
                  <option value="1000">1000</option>
                  <option value="1500">1500</option>
                  <option value="3000">3000</option>
                </select>
              </Field>

              <Field label={tr.common.noOfTip}>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={noOfTip}
                  onChange={(e) => setNoOfTip(e.target.value)}
                  onBlur={() => {
                    if (noOfTip === "" || Number(noOfTip) < 1) {
                      setNoOfTip("1");
                    }
                  }}
                  placeholder="1"
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>

            {computedTotalWages !== null && (
              <div className="flex items-center justify-between rounded bg-blue-50 border border-blue-200 px-3 py-2 text-sm font-medium text-slate-700">
                <span>{tr.common.totalWages}</span>
                <span className="font-semibold text-blue-700">
                  {tr.common.currencySymbol} {computedTotalWages.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <Field label={tr.common.vendor} required>
              <select
                value={vendorSel}
                onChange={(e) => { setVendorSel(e.target.value); setVendorOther(""); }}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={String(v.id)}>{v.name}</option>
                ))}
                <option value={OTHER}>{tr.modal.transportation.otherOption}</option>
              </select>
              {vendorSel === OTHER && (
                <input
                  type="text"
                  value={vendorOther}
                  onChange={(e) => setVendorOther(e.target.value)}
                  placeholder={tr.modal.transportation.enterVendorName}
                  className="mt-2 w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </Field>

            <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="referenceType"
                    value="project"
                    checked={referenceType === "project"}
                    onChange={() => setReferenceType("project")}
                    className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  {tr.common.project}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="referenceType"
                    value="partyName"
                    checked={referenceType === "partyName"}
                    onChange={() => setReferenceType("partyName")}
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
                  <option value={OTHER}>{tr.modal.transportation.otherOption}</option>
                </select>
                {projectSel === OTHER && (
                  <input
                    type="text"
                    value={projectOther}
                    onChange={(e) => setProjectOther(e.target.value)}
                    placeholder={tr.modal.transportation.enterProjectName}
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
                  <option value="">{tr.modal.transportation.noneOption}</option>
                  {partyNames.map((party) => (
                    <option key={party.id} value={party.id}>{party.name}</option>
                  ))}
                </select>
              </Field>
            )}

            <Field label={tr.common.location}>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={tr.modal.transportation.enterLocation}
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>

            <Field label={tr.common.date} required>
              <NepaliCalendarPicker
                value={date}
                onChange={setDate}
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
            {saving ? tr.common.saving : isEdit ? tr.common.saveChanges : tr.modal.transportation.addButton}
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
