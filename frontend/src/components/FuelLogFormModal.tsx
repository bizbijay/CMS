import { FormEvent, useEffect, useMemo, useState } from "react";
import { fuelLogsApi, usersApi, fuelsApi, fuelPricesApi, getStoredUser, partyNamesApi } from "../services/api";
import NepaliCalendarPicker from "./NepaliCalendarPicker";
import { useT } from "../hooks/useT";
import type { FuelLogListItem } from "../types/fuelLog";
import type { UserListItem } from "../types/users";
import type { FuelListItem } from "../types/fuels";
import type { PartyNameListItem } from "../types/partyName";

export type FuelLogFormMode =
  | { kind: "add" }
  | { kind: "edit"; log: FuelLogListItem };

interface Props {
  open: boolean;
  mode: FuelLogFormMode;
  onClose: () => void;
  onSaved: (item: FuelLogListItem, mode: FuelLogFormMode["kind"]) => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function displayName(u: UserListItem) {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return full || u.username;
}

const OTHER_PARTY = "other";

function isPetrolPumpType(value: PartyNameListItem["type"]) {
  const normalized = String(value ?? "").toLowerCase().replace(/\s+/g, "_");
  return normalized === "petrol_pump" || normalized === "petrolpump";
}

async function fetchFuelLogPartyOptions() {
  const dropdownParties = await partyNamesApi.listForDropdown();
  if ((dropdownParties ?? []).some((item) => item.type != null)) {
    return dropdownParties;
  }

  try {
    const fullParties = await partyNamesApi.list();
    return fullParties ?? dropdownParties;
  } catch {
    return dropdownParties;
  }
}

export default function FuelLogFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";

  const [drivers, setDrivers] = useState<UserListItem[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelListItem[]>([]);
  const [partyNames, setPartyNames] = useState<PartyNameListItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isCurrentUserDriver, setIsCurrentUserDriver] = useState(false);
  const [selfUser, setSelfUser] = useState<UserListItem | null>(null);

  const [driverId, setDriverId] = useState<number>(0);
  const [partySelection, setPartySelection] = useState<string>("");
  const [otherPartyName, setOtherPartyName] = useState("");
  const [fuelTypeId, setFuelTypeId] = useState<number>(0);
  const [quantity, setQuantity] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [date, setDate] = useState(todayIso());

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  const petrolPumpParties = useMemo(
    () => partyNames.filter((item) => isPetrolPumpType(item.type)),
    [partyNames],
  );

  async function fetchFuelPrice(typeName: string) {
    setFetchingPrice(true);
    setError(null);
    try {
      const { price: p } = await fuelPricesApi.getCurrentPrice(typeName);
      setPrice(String(p));
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not fetch ${typeName} price.`);
    } finally {
      setFetchingPrice(false);
    }
  }

  function handleFuelTypeChange(id: number) {
    setFuelTypeId(id);
    const typeName = fuelTypes.find(ft => ft.id === id)?.name?.toLowerCase() ?? "";
    if (typeName === "diesel" || typeName === "petrol") {
      fetchFuelPrice(typeName);
    }
  }

  useEffect(() => {
    if (!open) return;
    setLoadingOptions(true);
    Promise.all([usersApi.drivers(), usersApi.dozerDrivers(), fuelsApi.list(), fetchFuelLogPartyOptions()])
      .then(([driverList, operatorList, f, parties]) => {
        setDrivers(driverList);
        setFuelTypes(f);
        setPartyNames(parties ?? []);

        const petrolOptions = (parties ?? []).filter((item) => isPetrolPumpType(item.type));

        const stored = getStoredUser();
        const selfInDrivers = driverList.find((u) => u.id === stored?.id);
        const selfInOperators = operatorList.find((u) => u.id === stored?.id);
        const selfMatch = selfInDrivers ?? selfInOperators ?? null;
        setIsCurrentUserDriver(!!selfMatch);
        setSelfUser(selfMatch);

        if (mode.kind === "edit") {
          setDriverId(mode.log.driverId);
          if (mode.log.partyNameId) {
            const canSelectParty = petrolOptions.some((item) => item.id === mode.log.partyNameId);
            if (canSelectParty) {
              setPartySelection(String(mode.log.partyNameId));
              setOtherPartyName("");
            } else {
              setPartySelection(OTHER_PARTY);
              setOtherPartyName(mode.log.partyNameName ?? "");
            }
          } else if (mode.log.partyNameOther || mode.log.partyNameName) {
            setPartySelection(OTHER_PARTY);
            setOtherPartyName(mode.log.partyNameOther ?? mode.log.partyNameName ?? "");
          } else {
            setPartySelection(petrolOptions[0] ? String(petrolOptions[0].id) : OTHER_PARTY);
            setOtherPartyName("");
          }
          setFuelTypeId(mode.log.fuelTypeId);
          setQuantity(String(mode.log.quantity));
          setPrice(String(mode.log.price));
          setDate(mode.log.date.slice(0, 10));
        } else {
          setDriverId(selfMatch?.id ?? driverList[0]?.id ?? 0);
          setPartySelection(petrolOptions[0] ? String(petrolOptions[0].id) : OTHER_PARTY);
          setOtherPartyName("");
          const defaultFuel = f.find(ft => ft.name.toLowerCase() === 'diesel') ?? f[0];
          setFuelTypeId(defaultFuel?.id ?? 0);
          setQuantity("");
          setPrice("");
          setDate(todayIso());
          const defaultTypeName = defaultFuel?.name?.toLowerCase() ?? "";
          if (defaultTypeName === "diesel" || defaultTypeName === "petrol") {
            setFetchingPrice(true);
            fuelPricesApi.getCurrentPrice(defaultTypeName)
              .then(({ price: p }) => setPrice(String(p)))
              .catch(() => {})
              .finally(() => setFetchingPrice(false));
          }
        }
      })
      .catch(() => setError(t.modal.loadError))
      .finally(() => setLoadingOptions(false));
    setError(null);
  }, [open, mode]);

  if (!open) return null;

  const selectedFuelTypeName = fuelTypes.find(ft => ft.id === fuelTypeId)?.name?.toLowerCase() ?? "";
  const isSupportedFuelType = selectedFuelTypeName === "diesel" || selectedFuelTypeName === "petrol";

  function handleClose() {
    if (saving) return;
    onClose();
  }

  const selectedDriver = drivers.find((u) => u.id === driverId) ?? (selfUser?.id === driverId ? selfUser : null);
  const assignedVehicleId = selectedDriver?.vehicleId ?? null;
  const assignedVehicleName = selectedDriver?.assignedVehicleName ?? null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!driverId) { setError(t.modal.fuelLog.errorNoDriver); return; }
    if (!assignedVehicleId) { setError(t.modal.fuelLog.errorNoVehicle); return; }
    if (!partySelection) { setError(t.modal.fuelLog.errorNoPartyName); return; }
    if (partySelection === OTHER_PARTY && !otherPartyName.trim()) { setError(t.modal.fuelLog.errorNoOtherPartyName); return; }
    if (!fuelTypeId) { setError(t.modal.fuelLog.errorNoFuelType); return; }
    if (!quantity || Number(quantity) <= 0) { setError(t.modal.fuelLog.errorInvalidQuantity); return; }
    if (!price || Number(price) <= 0) { setError(t.modal.fuelLog.errorInvalidPrice); return; }

    const selectedPartyId = partySelection !== OTHER_PARTY ? Number(partySelection) : null;
    const body = {
      driverId,
      vehicleId: assignedVehicleId,
      partyNameId: Number.isFinite(selectedPartyId) && selectedPartyId ? selectedPartyId : null,
      partyNameOther: partySelection === OTHER_PARTY ? otherPartyName.trim() : null,
      fuelTypeId,
      quantity: Number(quantity),
      price: Number(price),
      date,
    };
    setSaving(true);
    try {
      if (mode.kind === "add") {
        const created = await fuelLogsApi.create(body);
        onSaved(created, "add");
      } else {
        const updated = await fuelLogsApi.update(mode.log.id, body);
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
              {isEdit ? t.modal.fuelLog.editTitle : t.modal.fuelLog.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.fuelLog.editSubtitle : t.modal.fuelLog.addSubtitle}
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
          <p className="text-sm text-slate-500 py-4 text-center">{t.modal.loadingOptions}</p>
        ) : (
          <>
            {!isCurrentUserDriver && (
              <Field label={t.common.driver} required>
                {drivers.length === 0 ? (
                  <p className="text-sm text-amber-600 py-1">{t.modal.noDriversFound}</p>
                ) : (
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
                )}
              </Field>
            )}

            {!isCurrentUserDriver && (
              <Field label={t.common.vehicle}>
                <input
                  type="text"
                  value={assignedVehicleName ?? t.common.noVehicleAssigned}
                  disabled
                  className="w-full rounded border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500 cursor-not-allowed"
                />
              </Field>
            )}

            <Field label={t.common.fuelType} required>
              {fuelTypes.length === 0 ? (
                <p className="text-sm text-amber-600 py-1">{t.modal.noFuelTypesFound}</p>
              ) : (
                <select
                  value={fuelTypeId}
                  onChange={(e) => handleFuelTypeChange(Number(e.target.value))}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {fuelTypes.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              )}
            </Field>

            <Field label={t.modal.fuelLog.partyNameLabel} required>
              <select
                value={partySelection}
                onChange={(e) => {
                  setPartySelection(e.target.value);
                  if (e.target.value !== OTHER_PARTY) {
                    setOtherPartyName("");
                  }
                }}
                required
                className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {petrolPumpParties.map((party) => (
                  <option key={party.id} value={String(party.id)}>{party.name}</option>
                ))}
                <option value={OTHER_PARTY}>{t.common.other}</option>
              </select>
            </Field>

            {partySelection === OTHER_PARTY && (
              <Field label={t.modal.fuelLog.otherPartyNameLabel} required>
                <input
                  type="text"
                  value={otherPartyName}
                  onChange={(e) => setOtherPartyName(e.target.value)}
                  placeholder={t.modal.fuelLog.otherPartyNamePlaceholder}
                  required
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.modal.fuelLog.quantityLabel} required>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>

              <Field label={t.common.price} required>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    className="flex-1 min-w-0 rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {isSupportedFuelType && (
                    <button
                      type="button"
                      onClick={() => fetchFuelPrice(selectedFuelTypeName)}
                      disabled={fetchingPrice}
                      title={`Fetch current NOC ${selectedFuelTypeName} price`}
                      className="shrink-0 px-2 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {fetchingPrice ? <SpinIcon /> : <FetchPriceIcon />}
                    </button>
                  )}
                </div>
              </Field>
            </div>

            {quantity && price && Number(quantity) > 0 && Number(price) > 0 && (
              <div className="rounded bg-slate-50 border border-slate-200 px-4 py-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">{t.modal.fuelLog.totalPriceLabel}</span>
                <span className="font-semibold text-slate-800">
                  {t.common.currencySymbol} {(Number(quantity) * Number(price)).toFixed(2)}
                </span>
              </div>
            )}

            <Field label={t.common.date} required>
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
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving || loadingOptions}
            className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium">
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.fuelLog.addButton}
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

function FetchPriceIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className="w-4 h-4 animate-spin">
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}
