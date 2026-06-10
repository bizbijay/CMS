import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { salaryDetailApi } from "../services/api";
import type { SalaryBreakdownDto } from "../types/salaryDetail";
import { NEPALI_MONTHS_EN, NEPALI_MONTHS_NP, formatBSDate } from "../utils/nepaliDate";
import { useCulture } from "../context/CultureContext";
import { useT } from "../hooks/useT";

export default function SalaryBreakdown() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const t = useT();
  const { locale } = useCulture();
  const monthNames = locale === "np" ? NEPALI_MONTHS_NP : NEPALI_MONTHS_EN;

  const [data, setData] = useState<SalaryBreakdownDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOperator = data?.wages.some((w) => w.operatedTimeMs != null) ?? false;

  useEffect(() => {
    const id = Number(userId);
    if (!id) { setError("Invalid user."); setLoading(false); return; }
    salaryDetailApi.breakdown(id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load breakdown."))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return <div className="py-12 text-center text-slate-500 text-sm">{t.common.loading}</div>;
  }

  if (error || !data) {
    return <div className="rounded bg-red-50 text-red-700 text-sm p-3 border border-red-200">{error ?? "Not found."}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => navigate("/salary-details")}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeftIcon />
          {t.pages.salaryBreakdown.backToDetails}
        </button>
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-2xl font-semibold text-slate-800">
          {t.pages.salaryBreakdown.title} — {data.userName}
        </h2>
        <span className="text-sm text-slate-500">
          {t.pages.salaryBreakdown.grandTotal}: {t.common.currencySymbol} {data.grandTotal.toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Salaries */}
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              {t.pages.salaryBreakdown.monthlySalaries}
            </h3>
          </div>
          {data.monthlySalaries.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">{t.pages.salaryBreakdown.noMonthlySalaries}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">{t.pages.salaryBreakdown.year}</th>
                  <th className="px-4 py-2 text-left">{t.pages.salaryBreakdown.month}</th>
                  <th className="px-4 py-2 text-left">{t.pages.salaryBreakdown.status}</th>
                  <th className="px-4 py-2 text-right">{t.pages.salaryBreakdown.amount}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.monthlySalaries.map((m) => (
                  <tr key={`${m.year}-${m.month}`} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-600">{m.year}</td>
                    <td className="px-4 py-2.5 text-slate-700 font-medium">{monthNames[m.month - 1]}</td>
                    <td className="px-4 py-2.5">
                      {m.isVerified
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{t.pages.salaryBreakdown.verified}</span>
                        : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{t.pages.salaryBreakdown.pending}</span>
                      }
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                      {t.common.currencySymbol} {m.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-slate-700">{t.pages.salaryBreakdown.subtotal}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold text-slate-800">
                    {t.common.currencySymbol} {data.totalFromMonthlySalaries.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>

        {/* Transportation / JCB Wages */}
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
              {isOperator
                ? t.pages.salaryBreakdown.jcbOperatedWages
                : t.pages.salaryBreakdown.transportationWages}
            </h3>
          </div>
          {data.wages.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 text-center">{t.pages.salaryBreakdown.noWages}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-2 text-left">{t.pages.salaryBreakdown.date}</th>
                  <th className="px-4 py-2 text-left">{t.pages.salaryBreakdown.project}</th>
                  {isOperator
                    ? <th className="px-4 py-2 text-left">{t.pages.salaryBreakdown.operatedTime}</th>
                    : <th className="px-4 py-2 text-left">{t.pages.salaryBreakdown.vendor}</th>}
                  <th className="px-4 py-2 text-right">{t.pages.salaryBreakdown.wages}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.wages.map((w) => (
                    <tr key={w.transportationId} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{formatBSDate(w.date)}</td>
                      <td className="px-4 py-2.5 text-slate-600">{w.projectName ?? "—"}</td>
                      {isOperator
                        ? <td className="px-4 py-2.5 text-slate-600">{w.operatedTimeMs != null ? formatMs(w.operatedTimeMs) : "—"}</td>
                        : <td className="px-4 py-2.5 text-slate-600">{w.vendorName ?? "—"}</td>}
                      <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                        {t.common.currencySymbol} {w.wages.toLocaleString()}
                      </td>
                    </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-4 py-2.5 text-sm font-semibold text-slate-700">{t.pages.salaryBreakdown.subtotal}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold text-slate-800">
                    {t.common.currencySymbol} {data.totalFromWages.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>
      </div>

      {/* Grand Total bar */}
      <div className="bg-slate-800 text-white rounded-lg px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <span>
            <span className="text-slate-400">{t.pages.salaryBreakdown.monthlySalaries}: </span>
            <span className="font-semibold">{t.common.currencySymbol} {data.totalFromMonthlySalaries.toLocaleString()}</span>
          </span>
          <span className="text-slate-500">+</span>
          <span>
            <span className="text-slate-400">
              {isOperator
                ? t.pages.salaryBreakdown.jcbOperatedWages
                : t.pages.salaryBreakdown.transportationWages}:{" "}
            </span>
            <span className="font-semibold">{t.common.currencySymbol} {data.totalFromWages.toLocaleString()}</span>
          </span>
        </div>
        <span className="text-lg font-bold">
          {t.pages.salaryBreakdown.grandTotal}: {t.common.currencySymbol} {data.grandTotal.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function formatMs(ms: number) {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}
