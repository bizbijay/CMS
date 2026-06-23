import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  projectsApi,
  projectExpensesApi,
  projectWagesApi,
  transportationsApi,
} from "../services/api";
import type { ProjectExpenseSummary } from "../types/projects";
import type { ProjectExpenseListItem } from "../types/projectExpenses";
import type { ProjectWageListItem } from "../types/projectWages";
import type { TransportationListItem } from "../types/transportation";
import { useT } from "../hooks/useT";
import { formatBSDate } from "../utils/nepaliDate";

export default function ProjectBreakdown() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const t = useT();

  const pid = Number(projectIdParam);

  const [projectName, setProjectName] = useState<string>("");
  const [summary, setSummary] = useState<ProjectExpenseSummary | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpenseListItem[]>([]);
  const [wages, setWages] = useState<ProjectWageListItem[]>([]);
  const [transports, setTransports] = useState<TransportationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projects, summaries, exp, wag, trans] = await Promise.all([
        projectsApi.list(),
        projectsApi.expenseSummary(),
        projectExpensesApi.listByProject(pid),
        projectWagesApi.listByProject(pid),
        transportationsApi.listByProject(pid),
      ]);
      const project = projects.find((p) => p.id === pid);
      setProjectName(project?.name ?? `Project #${pid}`);
      setSummary(summaries.find((s) => s.projectId === pid) ?? null);
      setExpenses(exp);
      setWages(wag);
      setTransports(trans);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load breakdown.");
    } finally {
      setLoading(false);
    }
  }, [pid]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (n: number) =>
    `${t.common.currencySymbol} ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
        {t.common.loading}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">
        {error}
      </div>
    );
  }

  const expensesSubtotal = expenses.reduce((sum, e) => sum + (e.totalCost ?? 0), 0);
  const wagesSubtotal = wages.reduce((sum, w) => sum + w.totalAmount, 0);
  const transSubtotal = transports.reduce(
    (sum, t) => sum + (t.materialCost ?? 0) + (t.tax ?? 0) + (t.wages ?? 0),
    0
  );
  const grandTotal = summary?.grandTotal ?? expensesSubtotal + wagesSubtotal + transSubtotal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/project-details")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3 group"
        >
          <BackIcon />
          <span className="group-hover:underline">{t.common.backToProjects}</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">
              {t.pages.projectBreakdown.title}
            </h2>
            <p className="text-slate-500 mt-0.5">{projectName}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label={t.pages.projectExpenses.title}
          value={fmt(summary?.expensesTotal ?? expensesSubtotal)}
          color="blue"
        />
        <SummaryCard
          label={t.nav.transportation}
          value={fmt(summary?.transportationTotal ?? transSubtotal)}
          color="amber"
        />
        <SummaryCard
          label={t.pages.projectWages.title}
          value={fmt(summary?.wagesTotal ?? wagesSubtotal)}
          color="emerald"
        />
        <SummaryCard
          label={t.common.totalExpenses}
          value={fmt(grandTotal)}
          color="slate"
          grand
        />
      </div>

      {/* Expenses Section */}
      <Section
        title={t.pages.projectExpenses.title}
        subtotal={fmt(summary?.expensesTotal ?? expensesSubtotal)}
        color="blue"
        count={expenses.length}
      >
        {expenses.length === 0 ? (
          <EmptyRow message={t.pages.projectBreakdown.noExpenses} colSpan={7} />
        ) : (
          <>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <Th>S.N.</Th>
                <Th>{t.common.material}</Th>
                <Th right>{t.common.quantity}</Th>
                <Th right>{t.common.costPerUnit}</Th>
                <Th right>{t.common.totalCost}</Th>
                <Th>{t.common.vendor}</Th>
                <Th>{t.common.date}</Th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e, i) => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <Td>{i + 1}</Td>
                  <Td>{e.materialName ?? "—"}</Td>
                  <Td right>{e.quantity ?? "—"}</Td>
                  <Td right>{e.costPerUnit != null ? fmt(e.costPerUnit) : "—"}</Td>
                  <Td right bold>{e.totalCost != null ? fmt(e.totalCost) : "—"}</Td>
                  <Td>{e.vendorName ?? e.vendorOther ?? "—"}</Td>
                  <Td>{formatBSDate(e.date)}</Td>
                </tr>
              ))}
              <SubtotalRow colSpan={4} value={fmt(expensesSubtotal)} totalCols={7} color="blue" />
            </tbody>
          </>
        )}
      </Section>

      {/* Transportation Section */}
      <Section
        title={t.nav.transportation}
        subtotal={fmt(summary?.transportationTotal ?? transSubtotal)}
        color="amber"
        count={transports.length}
      >
        {transports.length === 0 ? (
          <EmptyRow message={t.pages.projectBreakdown.noTransportation} colSpan={7} />
        ) : (
          <>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <Th>S.N.</Th>
                <Th>{t.common.driver}</Th>
                <Th>{t.common.material}</Th>
                <Th right>Material Cost</Th>
                <Th right>{t.common.tax}</Th>
                <Th right>{t.common.wages}</Th>
                <Th>{t.common.date}</Th>
              </tr>
            </thead>
            <tbody>
              {transports.map((tr, i) => (
                  <tr key={tr.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <Td>{i + 1}</Td>
                    <Td>{tr.transportedByName}</Td>
                    <Td>{tr.materialName ?? "—"}</Td>
                    <Td right>{tr.materialCost != null ? fmt(tr.materialCost) : "—"}</Td>
                    <Td right>{tr.tax != null ? fmt(tr.tax) : "—"}</Td>
                    <Td right>{tr.wages != null ? fmt(tr.wages) : "—"}</Td>
                    <Td>{formatBSDate(tr.date)}</Td>
                  </tr>
              ))}
              <SubtotalRow colSpan={3} value={fmt(transSubtotal)} totalCols={7} color="amber" />
            </tbody>
          </>
        )}
      </Section>

      {/* Wages Section */}
      <Section
        title={t.pages.projectWages.title}
        subtotal={fmt(summary?.wagesTotal ?? wagesSubtotal)}
        color="emerald"
        count={wages.length}
      >
        {wages.length === 0 ? (
          <EmptyRow message={t.pages.projectBreakdown.noWages} colSpan={5} />
        ) : (
          <>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <Th>S.N.</Th>
                <Th right>{t.common.numberOfWorkers}</Th>
                <Th right>{t.common.rate}</Th>
                <Th right>{t.common.totalAmount}</Th>
                <Th>{t.common.date}</Th>
              </tr>
            </thead>
            <tbody>
              {wages.map((w, i) => (
                <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <Td>{i + 1}</Td>
                  <Td right>{w.numberOfWorkers}</Td>
                  <Td right>{fmt(w.rate)}</Td>
                  <Td right bold>{fmt(w.totalAmount)}</Td>
                  <Td>{formatBSDate(w.date)}</Td>
                </tr>
              ))}
              <SubtotalRow colSpan={3} value={fmt(wagesSubtotal)} totalCols={5} color="emerald" />
            </tbody>
          </>
        )}
      </Section>

      {/* Grand Total Row */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between">
        <span className="text-base font-bold text-slate-700">{t.common.totalExpenses}</span>
        <span className="text-xl font-bold text-slate-900">{fmt(grandTotal)}</span>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  color,
  grand,
}: {
  label: string;
  value: string;
  color: "blue" | "emerald" | "amber" | "slate";
  grand?: boolean;
}) {
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    slate: "bg-slate-100 border-slate-300 text-slate-700",
  };
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-75 mb-1">{label}</p>
      <p className={`font-bold ${grand ? "text-lg" : "text-base"}`}>{value}</p>
    </div>
  );
}

function Section({
  title,
  subtotal,
  color,
  count,
  children,
}: {
  title: string;
  subtotal: string;
  color: "blue" | "emerald" | "amber";
  count: number;
  children: ReactNode;
}) {
  const headerColor = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
  }[color];

  const badgeColor = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  }[color];

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-3 border-b ${headerColor}`}>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
            {count} records
          </span>
        </div>
        <span className="font-bold text-sm">{subtotal}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

function EmptyRow({ message, colSpan }: { message: string; colSpan: number }) {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="px-4 py-6 text-center text-slate-400 text-sm">
          {message}
        </td>
      </tr>
    </tbody>
  );
}

function SubtotalRow({
  colSpan,
  value,
  totalCols,
  color,
}: {
  colSpan: number;
  value: string;
  totalCols: number;
  color: "blue" | "emerald" | "amber";
}) {
  const bgColor = {
    blue: "bg-blue-50 text-blue-800",
    emerald: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
  }[color];

  const remainingCols = totalCols - colSpan - 1;

  return (
    <tr className={bgColor}>
      <td colSpan={colSpan} className="px-3 py-2 text-right font-semibold text-xs uppercase tracking-wide">
        Subtotal
      </td>
      <td className="px-3 py-2 text-right font-bold">{value}</td>
      {remainingCols > 0 && <td colSpan={remainingCols} />}
    </tr>
  );
}

function Th({ children, right }: { children?: ReactNode; right?: boolean }) {
  return (
    <th
      className={`px-3 py-2.5 text-xs font-semibold text-slate-600 whitespace-nowrap ${
        right ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  right,
  bold,
}: {
  children?: ReactNode;
  right?: boolean;
  bold?: boolean;
}) {
  return (
    <td
      className={`px-3 py-2.5 text-slate-700 whitespace-nowrap ${right ? "text-right" : ""} ${
        bold ? "font-semibold" : ""
      }`}
    >
      {children}
    </td>
  );
}

function BackIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}
