import { useCallback, useEffect, useState } from "react";
import { projectsApi } from "../services/api";
import type { ProjectListItem } from "../types/projects";
import ProjectFormModal, { type ProjectFormMode } from "../components/ProjectFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useT } from "../hooks/useT";

export default function Projects() {
  const { addToast } = useToast();
  const t = useT();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ProjectFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProjectListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await projectsApi.list();
      setProjects(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onSaved(project: ProjectListItem, kind: ProjectFormMode["kind"]) {
    if (kind === "add") {
      setProjects((prev) => [project, ...prev]);
      addToast("Project added successfully.", "success");
    } else {
      setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
      addToast("Project updated successfully.", "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await projectsApi.remove(pendingDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast("Project deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.projects.title}</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {t.common.refresh}
          </button>
          <Can do="projects.add">
            <button
              onClick={() => setModalMode({ kind: "add" })}
              className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {t.pages.projects.addButton}
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
                <Th>{t.common.name}</Th>
                <Th className="text-right whitespace-nowrap">{t.common.actions}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">{t.common.loading}</td></tr>
              ) : projects.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">{t.pages.projects.noData}</td></tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <Td><span className="font-medium text-slate-800">{p.name}</span></Td>
                    <Td className="text-right">
                      <div className="inline-flex gap-1.5">
                        <Can do="projects.edit">
                          <IconButton tooltip="Edit project" icon={<PencilIcon />} onClick={() => setModalMode({ kind: "edit", project: p })} />
                        </Can>
                        <Can do="projects.delete">
                          <IconButton tooltip="Delete project" tone="danger" icon={<TrashIcon />} onClick={() => setPendingDelete(p)} />
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

      <ProjectFormModal
        open={modalMode !== null}
        mode={modalMode ?? { kind: "add" }}
        onClose={() => setModalMode(null)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.modal.projects.deleteTitle}
        message={pendingDelete ? t.modal.projects.deleteMessage.replace("{{name}}", pendingDelete.name) : ""}
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
