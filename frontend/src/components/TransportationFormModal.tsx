import { FormEvent, useEffect, useMemo, useState } from "react";
import { transportationsApi, usersApi, vendorsApi, projectsApi, materialsApi, partyNamesApi, getStoredUser } from "../services/api";
import NepaliCalendarPicker from "./NepaliCalendarPicker";
import SearchableCombobox from "./SearchableCombobox";
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
const WAGE_OPTIONS = ["1000", "1500", "3000"];

function filterNamedItems<T extends { name: string }>(items: T[], query: string) {
  const q = query.trim().toLowerCase();
  return q ? items.filter((item) => item.name.toLowerCase().includes(q)) : items;
}

function hasExactNameMatch<T extends { name: string }>(items: T[], query: string) {
  const q = query.trim().toLowerCase();
  return q.length > 0 && items.some((item) => item.name.toLowerCase() === q);
}

function toComboboxOptions(items: Array<{ id: number; name: string }>) {
  return items.map((item) => ({ key: String(item.id), label: item.name }));
}

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

  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorInput, setVendorInput] = useState("");
  const [addingVendor, setAddingVendor] = useState(false);

  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectInput, setProjectInput] = useState("");
  const [addingProject, setAddingProject] = useState(false);
  const [referenceType, setReferenceType] = useState<"project" | "partyName">("project");

  // vehicleOther is only used when transportedBySel === OTHER
  const [vehicleOther, setVehicleOther] = useState("");

  const [materialId, setMaterialId] = useState<number | null>(null);
  const [materialInput, setMaterialInput] = useState("");
  const [addingMaterial, setAddingMaterial] = useState(false);
  const [location, setLocation] = useState("");
  const [partyNameId, setPartyNameId] = useState<number | null>(null);
  const [partyNameInput, setPartyNameInput] = useState("");
  const [addingPartyName, setAddingPartyName] = useState(false);
  const [noOfTip, setNoOfTip] = useState("1");
  const [quantity, setQuantity] = useState("1");
  const [perUnitCost, setPerUnitCost] = useState("");
  const [tax, setTax] = useState("");
  const [wages, setWages] = useState("");
  const [wagesInput, setWagesInput] = useState("");

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

  const filteredPartyNames = filterNamedItems(partyNames, partyNameInput);
  const showAddPartyOption = partyNameInput.trim().length > 0 && !hasExactNameMatch(partyNames, partyNameInput);

  const filteredVendors = filterNamedItems(vendors, vendorInput);
  const showAddVendorOption = vendorInput.trim().length > 0 && !hasExactNameMatch(vendors, vendorInput);

  const filteredProjects = filterNamedItems(projects, projectInput);
  const showAddProjectOption = projectInput.trim().length > 0 && !hasExactNameMatch(projects, projectInput);

  const filteredMaterials = filterNamedItems(materials, materialInput);
  const showAddMaterialOption = materialInput.trim().length > 0 && !hasExactNameMatch(materials, materialInput);

  const wageOptions = useMemo(() => {
    const values = [...WAGE_OPTIONS];
    if (wages && !values.includes(wages)) values.push(wages);
    const q = wagesInput.trim();
    const filtered = q ? values.filter((value) => value.includes(q)) : values;
    return filtered.map((value) => ({ key: value, label: value }));
  }, [wagesInput, wages]);

  const showUseWageOption =
    wagesInput.trim() !== "" &&
    !Number.isNaN(Number(wagesInput.trim())) &&
    !wageOptions.some((option) => option.key === wagesInput.trim());

  // Derive vehicle from the selected driver when a registered driver is chosen.
  const isOtherTransporter = transportedBySel === OTHER;
  const selectedUser = isOtherTransporter ? undefined : drivers.find((u) => u.id === Number(transportedBySel));
  const assignedVehicleId = selectedUser?.vehicleId ?? null;
  const assignedVehicleName = selectedUser?.assignedVehicleName ?? null;

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    Promise.all([usersApi.drivers(), vendorsApi.list(), projectsApi.list(), materialsApi.list(), partyNamesApi.listForDropdown()])
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
          if (t.materialId) {
            const material = safeM.find((item) => item.id === t.materialId);
            setMaterialInput(material?.name ?? t.materialName ?? "");
          } else {
            setMaterialInput("");
          }
          setLocation(t.location ?? "");
          setPartyNameId(t.partyNameId ?? null);
          setReferenceType(t.partyNameId ? "partyName" : "project");
          if (t.partyNameId) {
            const party = safePartyNames.find((item) => item.id === t.partyNameId);
            setPartyNameInput(party?.name ?? t.partyNameName ?? "");
          } else {
            setPartyNameInput("");
          }
          setNoOfTip(t.noOfTip != null && t.noOfTip >= 1 ? String(t.noOfTip) : "1");
          setQuantity(t.quantity != null ? String(t.quantity) : "");
          setPerUnitCost(t.perUnitCost != null ? String(t.perUnitCost) : "");
          setTax(t.tax != null ? String(t.tax) : "");
          setWages(t.wages != null ? String(t.wages) : "");
          setWagesInput(t.wages != null ? String(t.wages) : "");

          if (t.vendorId) {
            const vendor = safeV.find((item) => item.id === t.vendorId);
            setVendorId(t.vendorId);
            setVendorInput(vendor?.name ?? t.vendorName ?? "");
          } else {
            setVendorId(null);
            setVendorInput(t.vendorOther ?? t.vendorName ?? "");
          }

          if (t.projectId) {
            const project = safeP.find((item) => item.id === t.projectId);
            setProjectId(t.projectId);
            setProjectInput(project?.name ?? t.projectName ?? "");
          } else {
            setProjectId(null);
            setProjectInput(t.projectOther ?? t.projectName ?? "");
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
          setMaterialInput("");
          setLocation("");
          setPartyNameId(null);
          setPartyNameInput("");
          setReferenceType("project");
          setNoOfTip("1");
          setQuantity("1");
          setPerUnitCost("");
          setTax("");
          setWages("");
          setWagesInput("");
          setVendorId(null);
          setVendorInput("");
          setProjectId(null);
          setProjectInput("");
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

  async function handleAddPartyName() {
    const name = partyNameInput.trim();
    if (!name) return;
    setAddingPartyName(true);
    setError(null);
    try {
      const created = await partyNamesApi.create({ name, type: "other", address: null });
      setPartyNames((prev) => [...prev, created]);
      setPartyNameId(created.id);
      setPartyNameInput(created.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add party name.");
    } finally {
      setAddingPartyName(false);
    }
  }

  async function handleAddVendor() {
    const name = vendorInput.trim();
    if (!name) return;
    setAddingVendor(true);
    setError(null);
    try {
      const created = await vendorsApi.create({ name });
      setVendors((prev) => [...prev, created]);
      setVendorId(created.id);
      setVendorInput(created.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vendor.");
    } finally {
      setAddingVendor(false);
    }
  }

  async function handleAddProject() {
    const name = projectInput.trim();
    if (!name) return;
    setAddingProject(true);
    setError(null);
    try {
      const created = await projectsApi.create({ name });
      setProjects((prev) => [...prev, created]);
      setProjectId(created.id);
      setProjectInput(created.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add project.");
    } finally {
      setAddingProject(false);
    }
  }

  async function handleAddMaterial() {
    const name = materialInput.trim();
    if (!name) return;
    setAddingMaterial(true);
    setError(null);
    try {
      const created = await materialsApi.create({ name });
      setMaterials((prev) => [...prev, created]);
      setMaterialId(created.id);
      setMaterialInput(created.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add material.");
    } finally {
      setAddingMaterial(false);
    }
  }

  function handleUseCustomWage() {
    const value = wagesInput.trim();
    if (!value || Number.isNaN(Number(value))) return;
    setWages(value);
    setWagesInput(value);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (isOtherTransporter && !transportedByOther.trim()) {
      setError(tr.modal.transportation.errorNoTransportedBy);
      return;
    }
    if (!vendorId && !vendorInput.trim()) {
      setError(tr.modal.transportation.errorNoVendor);
      return;
    }

    const selectedProjectId = referenceType === "project" ? projectId : null;
    const selectedProjectOther =
      referenceType === "project" && !projectId ? projectInput.trim() || null : null;
    const selectedPartyNameId = referenceType === "partyName" ? partyNameId ?? null : null;

    if (referenceType === "project" && !selectedProjectId && !selectedProjectOther) {
      setError(tr.modal.transportation.errorNoProject);
      return;
    }
    if (referenceType === "partyName" && !selectedPartyNameId) {
      setError(tr.modal.transportation.errorNoPartyName);
      return;
    }

    const body = {
      transportedById: isOtherTransporter ? null : Number(transportedBySel),
      transportedByOther: isOtherTransporter ? transportedByOther.trim() : null,
      vehicleId: isOtherTransporter ? null : assignedVehicleId,
      vehicleOther: isOtherTransporter ? (vehicleOther.trim() || null) : null,
      materialId,
      vendorId,
      vendorOther: vendorId ? null : vendorInput.trim() || null,
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
              <SearchableCombobox
                value={materialInput}
                selectedKey={materialId !== null ? String(materialId) : null}
                options={toComboboxOptions(filteredMaterials)}
                onChange={setMaterialInput}
                onClearSelection={() => setMaterialId(null)}
                onSelect={(option) => {
                  setMaterialId(Number(option.key));
                  setMaterialInput(option.label);
                }}
                placeholder={tr.modal.transportation.searchMaterial}
                emptyMessage={tr.modal.transportation.noMaterialsFound}
                showAddOption={showAddMaterialOption}
                addLabel={tr.modal.transportation.addMaterial.replace("{{name}}", materialInput.trim())}
                onAdd={handleAddMaterial}
                adding={addingMaterial}
                addingLabel={tr.common.saving}
                toggleAriaLabel={tr.modal.transportation.toggleMaterialDropdown}
              />
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
                <SearchableCombobox
                  value={wagesInput}
                  selectedKey={wages || null}
                  options={wageOptions}
                  onChange={setWagesInput}
                  onClearSelection={() => setWages("")}
                  onSelect={(option) => {
                    setWages(option.key);
                    setWagesInput(option.label);
                  }}
                  placeholder={tr.modal.transportation.searchWages}
                  emptyMessage={tr.modal.transportation.noWagesFound}
                  showAddOption={showUseWageOption}
                  addLabel={tr.modal.transportation.useWage.replace("{{name}}", wagesInput.trim())}
                  onAdd={handleUseCustomWage}
                  toggleAriaLabel={tr.modal.transportation.toggleWagesDropdown}
                  clearOnBlur={false}
                />
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
              <SearchableCombobox
                value={vendorInput}
                selectedKey={vendorId !== null ? String(vendorId) : null}
                options={toComboboxOptions(filteredVendors)}
                onChange={setVendorInput}
                onClearSelection={() => setVendorId(null)}
                onSelect={(option) => {
                  setVendorId(Number(option.key));
                  setVendorInput(option.label);
                }}
                placeholder={tr.modal.transportation.searchVendorName}
                required
                emptyMessage={tr.modal.transportation.noVendorsFound}
                showAddOption={showAddVendorOption}
                addLabel={tr.modal.transportation.addVendorName.replace("{{name}}", vendorInput.trim())}
                onAdd={handleAddVendor}
                adding={addingVendor}
                addingLabel={tr.common.saving}
                toggleAriaLabel={tr.modal.transportation.toggleVendorDropdown}
                clearOnBlur={false}
              />
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
                <SearchableCombobox
                  value={projectInput}
                  selectedKey={projectId !== null ? String(projectId) : null}
                  options={toComboboxOptions(filteredProjects)}
                  onChange={setProjectInput}
                  onClearSelection={() => setProjectId(null)}
                  onSelect={(option) => {
                    setProjectId(Number(option.key));
                    setProjectInput(option.label);
                  }}
                  placeholder={tr.modal.transportation.searchProjectName}
                  required
                  emptyMessage={tr.modal.transportation.noProjectsFound}
                  showAddOption={showAddProjectOption}
                  addLabel={tr.modal.transportation.addProjectName.replace("{{name}}", projectInput.trim())}
                  onAdd={handleAddProject}
                  adding={addingProject}
                  addingLabel={tr.common.saving}
                  toggleAriaLabel={tr.modal.transportation.toggleProjectDropdown}
                  clearOnBlur={false}
                />
              </Field>
            ) : (
              <Field label={tr.common.partyName} required>
                <SearchableCombobox
                  value={partyNameInput}
                  selectedKey={partyNameId !== null ? String(partyNameId) : null}
                  options={toComboboxOptions(filteredPartyNames)}
                  onChange={setPartyNameInput}
                  onClearSelection={() => setPartyNameId(null)}
                  onSelect={(option) => {
                    setPartyNameId(Number(option.key));
                    setPartyNameInput(option.label);
                  }}
                  placeholder={tr.modal.transportation.searchPartyName}
                  required
                  emptyMessage={tr.modal.transportation.noPartyNamesFound}
                  showAddOption={showAddPartyOption}
                  addLabel={tr.modal.transportation.addPartyName.replace("{{name}}", partyNameInput.trim())}
                  onAdd={handleAddPartyName}
                  adding={addingPartyName}
                  addingLabel={tr.common.saving}
                  toggleAriaLabel={tr.modal.transportation.togglePartyDropdown}
                />
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
