import type { ProjectExpenseSummary } from "../types/projects";
import { useT } from "../hooks/useT";

interface Props {
  open: boolean;
  projectName: string;
  summary: ProjectExpenseSummary;
  onClose: () => void;
}

export default function ProjectExpenseBreakdownModal({ open, projectName, summary, onClose }: Props) {
  const t = useT();
  if (!open) return null;

  const fmt = (n: number) =>
    `${t.common.currencySymbol} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const rows = [
    { label: t.pages.projectExpenses.title, value: summary.expensesTotal, color: "text-blue-700" },
    { label: t.pages.projectWages.title,    value: summary.wagesTotal,    color: "text-emerald-700" },
    { label: t.nav.transportation,          value: summary.transportationTotal, color: "text-amber-700" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{t.common.expensesBreakdown}</h3>
            <p className="text-sm text-slate-500">{projectName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3 bg-white">
              <span className={`text-sm font-medium ${row.color}`}>{row.label}</span>
              <span className="text-sm font-semibold text-slate-800">{fmt(row.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
            <span className="text-sm font-bold text-slate-700">{t.common.totalExpenses}</span>
            <span className="text-base font-bold text-slate-900">{fmt(summary.grandTotal)}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
