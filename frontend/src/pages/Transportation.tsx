import { useCallback, useEffect, useState } from "react";
import { transportationsApi, usersApi, getStoredUser } from "../services/api";
import type { TransportationListItem } from "../types/transportation";
import TransportationFormModal, { type TransportationFormMode } from "../components/TransportationFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useT } from "../hooks/useT";

export default function Transportation() {
  const { addToast } = useToast();
  const t = useT();
  const [items, setItems] = useState<TransportationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<TransportationFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TransportationListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currentUserId = getStoredUser()?.id ?? 0;
  const [isDriver, setIsDriver] = useState(false);

  useEffect(() => {
    usersApi.drivers()
      .then(list => setIsDriver(list.some(d => d.id === currentUserId)))
      .catch(() => {});
  }, [currentUserId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await transportationsApi.list();
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transportation records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onSaved(item: TransportationListItem, kind: TransportationFormMode["kind"]) {
    if (kind === "add") {
      setItems((prev) => [item, ...prev]);
      addToast("Transportation added successfully.", "success");
    } else {
      setItems((prev) => prev.map((t) => (t.id === item.id ? item : t)));
      addToast("Transportation updated successfully.", "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await transportationsApi.remove(pendingDelete.id);
      setItems((prev) => prev.filter((t) => t.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast("Transportation deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const visibleItems = isDriver
    ? items.filter(t => t.transportedById === currentUserId)
    : items;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.transportation.title}</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {t.common.refresh}
          </button>
          <Can do="transportation.add">
            <button
              onClick={() => setModalMode({ kind: "add" })}
              className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {t.pages.transportation.addButton}
            </button>
          </Can>
        </div>
      </div>

      {error && (
        <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-auto">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {!isDriver && <Th>{t.common.transportedBy}</Th>}
                {!isDriver && <Th>{t.common.vehicle}</Th>}
                <Th>{t.common.material}</Th>
                <Th>{t.common.vendor}</Th>
                <Th>{t.common.project}</Th>
                <Th>{t.common.date}</Th>
                <Th className="text-right whitespace-nowrap">{t.common.actions}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={isDriver ? 5 : 7} className="px-4 py-6 text-center text-slate-500">{t.common.loading}</td></tr>
              ) : visibleItems.length === 0 ? (
                <tr><td colSpan={isDriver ? 5 : 7} className="px-4 py-6 text-center text-slate-500">{t.pages.transportation.noData}</td></tr>
              ) : (
                visibleItems.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    {!isDriver && <Td><span className="font-medium text-slate-800">{t.transportedByName}</span></Td>}
                    {!isDriver && <Td>{t.vehicleName ?? <span className="text-slate-400">—</span>}</Td>}
                    <Td>{t.materialName ?? <span className="text-slate-400">—</span>}</Td>
                    <Td>{t.vendorName}</Td>
                    <Td>{t.projectName}</Td>
                    <Td>{formatDate(t.date)}</Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Can do="transportation.edit">
                          <IconButton tooltip="Edit" icon={<PencilIcon />} onClick={() => setModalMode({ kind: "edit", transportation: t })} />
                        </Can>
                        <Can do="transportation.delete">
                          <IconButton tooltip="Delete" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDelete(t)} />
                        </Can>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransportationFormModal
        open={modalMode !== null}
        mode={modalMode ?? { kind: "add" }}
        onClose={() => setModalMode(null)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.modal.transportation.deleteTitle}
        message={pendingDelete ? t.modal.transportation.deleteMessage : ""}
        confirmLabel={t.common.delete}
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

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
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
