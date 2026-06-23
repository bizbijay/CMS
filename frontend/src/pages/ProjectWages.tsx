import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { projectWagesApi, projectsApi } from "../services/api";
import type { ProjectWageListItem } from "../types/projectWages";
import ProjectWageFormModal, { type ProjectWageFormMode } from "../components/ProjectWageFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useT } from "../hooks/useT";
import { formatBSDate } from "../utils/nepaliDate";

export default function ProjectWages() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdParam);
  const navigate = useNavigate();
  const { addToast } = useToast();
  const t = useT();

  const [projectName, setProjectName] = useState("");
  const [items, setItems] = useState<ProjectWageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<ProjectWageFormMode | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<ProjectWageListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "date", desc: true }]);

  const openModal = useCallback((mode: ProjectWageFormMode) => {
    setModalKey((k) => k + 1);
    setModalMode(mode);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wages, projects] = await Promise.all([
        projectWagesApi.listByProject(projectId),
        projectsApi.list(),
      ]);
      setItems(wages);
      const proj = projects.find((p) => p.id === projectId);
      if (proj) setProjectName(proj.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wages.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  function onSaved(wage: ProjectWageListItem, kind: ProjectWageFormMode["kind"]) {
    if (kind === "add") {
      setItems((prev) => [wage, ...prev]);
      addToast("Wage record added.", "success");
    } else {
      setItems((prev) => prev.map((w) => (w.id === wage.id ? wage : w)));
      addToast("Wage record updated.", "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await projectWagesApi.remove(pendingDelete.id);
      setItems((prev) => prev.filter((w) => w.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast("Wage record deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const totalAmount = useMemo(
    () => items.reduce((sum, w) => sum + (w.totalAmount ?? 0), 0),
    [items]
  );

  const columns = useMemo<ColumnDef<ProjectWageListItem>[]>(() => [
    {
      id: "sn",
      header: "S.N.",
      size: 60,
      enableSorting: false,
      cell: ({ row, table }) => {
        const { pageIndex, pageSize } = table.getState().pagination;
        return <span className="text-slate-500 text-sm">{pageIndex * pageSize + row.index + 1}</span>;
      },
    },
    {
      accessorKey: "numberOfWorkers",
      header: t.common.numberOfWorkers,
      cell: ({ row }) => <span>{row.original.numberOfWorkers}</span>,
    },
    {
      accessorKey: "rate",
      header: t.common.rate,
      cell: ({ row }) => (
        <span>{t.common.currencySymbol} {row.original.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: t.common.totalAmount,
      cell: ({ row }) => (
        <span className="font-medium text-slate-800">
          {t.common.currencySymbol} {row.original.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: "date",
      header: t.common.date,
      cell: ({ row }) => <span>{formatBSDate(row.original.date)}</span>,
    },
    {
      accessorKey: "remarks",
      header: t.common.remarks,
      enableSorting: false,
      cell: ({ row }) => <span className="text-slate-500 text-sm">{row.original.remarks ?? "—"}</span>,
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => (
        <div className="inline-flex gap-1.5">
          <Can do="project_wages.edit">
            <IconButton tooltip="Edit wage" icon={<PencilIcon />}
              onClick={() => openModal({ kind: "edit", wage: row.original })} />
          </Can>
          <Can do="project_wages.delete">
            <IconButton tooltip="Delete wage" tone="danger" icon={<TrashIcon />}
              onClick={() => setPendingDelete(row.original)} />
          </Can>
        </div>
      ),
    },
  ], [t, openModal]);

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/project-details")}
            className="text-slate-500 hover:text-slate-800 transition-colors"
            title={t.common.backToProjects}
          >
            <BackIcon />
          </button>
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">{t.pages.projectWages.title}</h2>
            {projectName && <p className="text-sm text-slate-500">{projectName}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {t.common.refresh}
          </button>
          <Can do="project_wages.add">
            <button
              onClick={() => openModal({ kind: "add", projectId })}
              className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {t.pages.projectWages.addButton}
            </button>
          </Can>
        </div>
      </div>

      {items.length > 0 && (
        <div className="flex items-center justify-end gap-1.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded px-4 py-2">
          <span>{t.common.totalAmount}:</span>
          <span className="font-semibold text-slate-800">
            {t.common.currencySymbol} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

      <DataTable table={table} loading={loading} emptyMessage={t.pages.projectWages.noData} />

      {modalMode && (
        <ProjectWageFormModal
          key={modalKey}
          open={modalMode !== null}
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onSaved={onSaved}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.modal.projectWages.deleteTitle}
        message={t.modal.projectWages.deleteMessage}
        confirmLabel={t.common.delete}
        tone="danger"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </div>
  );
}

function PencilIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>;
}
function TrashIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>;
}
function BackIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><polyline points="15 18 9 12 15 6" /></svg>;
}
