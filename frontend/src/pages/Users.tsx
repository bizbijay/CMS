import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { getStoredUser, usersApi } from "../services/api";
import type { UserListItem } from "../types/users";
import UserFormModal, { type UserFormMode } from "../components/UserFormModal";
import IconButton from "../components/IconButton";
import ConfirmDialog from "../components/ConfirmDialog";
import DataTable from "../components/DataTable";
import { useToast } from "../components/Toaster";
import Can from "../components/Can";
import { useT } from "../hooks/useT";

export default function Users() {
  const { addToast } = useToast();
  const t = useT();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<UserFormMode | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "username", desc: false }]);

  const currentUserId = getStoredUser()?.id;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await usersApi.list();
      setUsers(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onSaved(user: UserListItem, kind: UserFormMode["kind"]) {
    if (kind === "add") {
      setUsers((prev) => [user, ...prev]);
      addToast("User added successfully.", "success");
    } else {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
      addToast("User updated successfully.", "success");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await usersApi.remove(pendingDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id));
      setPendingDelete(null);
      addToast("User deleted.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  }

  const columns = useMemo<ColumnDef<UserListItem>[]>(() => [
    {
      accessorKey: "username",
      header: t.pages.users.username,
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.username}</span>,
    },
    {
      accessorKey: "email",
      header: t.pages.users.email,
    },
    {
      id: "name",
      accessorFn: (row) => [row.firstName, row.lastName].filter(Boolean).join(" "),
      header: t.common.name,
      cell: ({ row }) => {
        const name = [row.original.firstName, row.original.lastName].filter(Boolean).join(" ");
        return name || <span className="text-slate-400">—</span>;
      },
    },
    {
      accessorKey: "roleName",
      header: t.common.role,
      cell: ({ row }) =>
        row.original.roleName ? (
          <Badge color="blue">{row.original.roleName}</Badge>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      id: "assignedVehicle",
      header: t.common.assignedVehicle,
      enableSorting: false,
      cell: ({ row }) =>
        row.original.assignedVehicleName ?? <span className="text-slate-400">—</span>,
    },
    {
      id: "status",
      header: t.common.status,
      enableSorting: false,
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge color="green">{t.common.active}</Badge>
        ) : (
          <Badge color="slate">{t.common.inactive}</Badge>
        ),
    },
    {
      accessorKey: "createdAt",
      header: t.common.createdAt,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: "lastLoginAt",
      header: t.common.lastLogin,
      cell: ({ row }) =>
        row.original.lastLoginAt ? (
          formatDate(row.original.lastLoginAt)
        ) : (
          <span className="text-slate-400">{t.common.never}</span>
        ),
    },
    {
      id: "actions",
      header: t.common.actions,
      enableSorting: false,
      meta: { className: "text-right" },
      cell: ({ row }) => {
        const isSelf = row.original.id === currentUserId;
        return (
          <div className="inline-flex gap-1.5">
            <Can do="users.edit">
              <IconButton tooltip="Edit user" icon={<PencilIcon />} onClick={() => setModalMode({ kind: "edit", user: row.original })} />
            </Can>
            <Can do="users.delete">
              <IconButton
                tooltip={isSelf ? "Can't delete yourself" : "Delete user"}
                tone="danger"
                disabled={isSelf}
                icon={<TrashIcon />}
                onClick={() => setPendingDelete(row.original)}
              />
            </Can>
          </div>
        );
      },
    },
  ], [t, currentUserId, setModalMode, setPendingDelete]);

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-800">{t.pages.users.title}</h2>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {t.common.refresh}
          </button>
          <Can do="users.add">
            <button
              onClick={() => setModalMode({ kind: "add" })}
              className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-4 h-4">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {t.pages.users.addButton}
            </button>
          </Can>
        </div>
      </div>

      {error && <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error}</div>}

      <DataTable table={table} loading={loading} emptyMessage={t.pages.users.noData} />

      <UserFormModal
        open={modalMode !== null}
        mode={modalMode ?? { kind: "add" }}
        onClose={() => setModalMode(null)}
        onSaved={onSaved}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t.modal.users.deleteTitle}
        message={pendingDelete ? t.modal.users.deleteMessage.replace("{{name}}", pendingDelete.username) : ""}
        confirmLabel={t.common.delete}
        tone="danger"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => (deleting ? undefined : setPendingDelete(null))}
      />
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: "green" | "slate" | "blue" }) {
  const styles: Record<string, string> = {
    green: "bg-green-100 text-green-700",
    slate: "bg-slate-100 text-slate-600",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
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
