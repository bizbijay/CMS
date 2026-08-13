import { FormEvent, useEffect, useState } from "react";
import { partyNamesApi } from "../services/api";
import { useT } from "../hooks/useT";
import type { PartyNameListItem, PartyNameType } from "../types/partyName";

export type PartyNameFormMode =
  | { kind: "add" }
  | { kind: "edit"; partyName: PartyNameListItem };

interface Props {
  open: boolean;
  mode: PartyNameFormMode;
  onClose: () => void;
  onSaved: (partyName: PartyNameListItem, mode: PartyNameFormMode["kind"]) => void;
}

export default function PartyNameFormModal({ open, mode, onClose, onSaved }: Props) {
  const t = useT();
  const isEdit = mode.kind === "edit";
  const [name, setName] = useState("");
  const [partyType, setPartyType] = useState<PartyNameType>("other");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(mode.kind === "edit" ? mode.partyName.name : "");
    setPartyType(mode.kind === "edit" ? normalizePartyType(mode.partyName.type) : "other");
    setAddress(mode.kind === "edit" ? mode.partyName.address ?? "" : "");
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
      type: partyType,
      address: address.trim() || null,
    };
    setSaving(true);
    try {
      if (mode.kind === "add") {
        const created = await partyNamesApi.create(body);
        onSaved(created, "add");
      } else {
        const updated = await partyNamesApi.update(mode.partyName.id, body);
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
      <form onSubmit={onSubmit} className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isEdit ? t.modal.partyNames.editTitle : t.modal.partyNames.addTitle}
            </h3>
            <p className="text-sm text-slate-500">
              {isEdit ? t.modal.partyNames.editSubtitle : t.modal.partyNames.addSubtitle}
            </p>
          </div>
          <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.modal.partyNames.nameLabel}<span className="text-red-500 ml-0.5">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. ABC Construction"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.modal.partyNames.typeLabel}<span className="text-red-500 ml-0.5">*</span>
          </label>
          <select
            value={partyType}
            onChange={(e) => setPartyType(e.target.value as PartyNameType)}
            required
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="petrol_pump">{t.modal.partyNames.typePetrolPump}</option>
            <option value="other">{t.modal.partyNames.typeOther}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {t.modal.partyNames.addressLabel}
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="e.g. Biratnagar"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={handleClose} disabled={saving} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {t.common.cancel}
          </button>
          <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium">
            {saving ? t.common.saving : isEdit ? t.common.saveChanges : t.modal.partyNames.addTitle}
          </button>
        </div>
      </form>
    </div>
  );
}

function normalizePartyType(value: PartyNameListItem["type"]): PartyNameType {
  const normalized = String(value ?? "").toLowerCase().replace(/\s+/g, "_");
  if (normalized === "petrol_pump" || normalized === "petrolpump") {
    return "petrol_pump";
  }
  return "other";
}
