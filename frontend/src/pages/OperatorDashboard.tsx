import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getStoredUser,
  usersApi,
  fuelLogsApi,
  dozerLogsApi,
  salaryDetailApi,
} from "../services/api";
import type { UserListItem } from "../types/users";
import type { FuelLogListItem } from "../types/fuelLog";
import type { DozerLogListItem } from "../types/dozerLog";
import type { SalaryBreakdownDto } from "../types/salaryDetail";
import { useCulture } from "../context/CultureContext";
import { formatBSDate } from "../utils/nepaliDate";

import FuelLogFormModal from "../components/FuelLogFormModal";
import DozerLogFormModal from "../components/DozerLogFormModal";

export default function OperatorDashboard() {
  const { locale, t } = useCulture();
  const user = getStoredUser();

  const [userInfo, setUserInfo] = useState<UserListItem | null>(null);
  const [dozerLogs, setDozerLogs] = useState<DozerLogListItem[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLogListItem[]>([]);
  const [salaryBreakdown, setSalaryBreakdown] = useState<SalaryBreakdownDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [dozerModalOpen, setDozerModalOpen] = useState(false);
  const [fuelModalOpen, setFuelModalOpen] = useState(false);

  // Active Tab for recent logs
  const [activeTab, setActiveTab] = useState<"dozer" | "fuel" | "earnings">("dozer");

  const loadOperatorData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [uProfile, dozerRes, fuelRes, salaryRes] = await Promise.all([
        usersApi.getProfile().catch(() => null),
        dozerLogsApi.list({ pageSize: 100 }).catch(() => ({ items: [] as DozerLogListItem[] })),
        fuelLogsApi.list({ pageSize: 100 }).catch(() => ({ items: [] as FuelLogListItem[] })),
        salaryDetailApi.breakdown(user.id).catch(() => null),
      ]);

      setUserInfo(uProfile);

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").toLowerCase();
      const uname = user.username.toLowerCase();

      // Filter logs belonging to this operator
      const myDozer = (dozerRes.items || []).filter(
        (item: DozerLogListItem) =>
          item.driverId === user.id ||
          (item.driverName &&
            (item.driverName.toLowerCase() === fullName || item.driverName.toLowerCase() === uname))
      );

      const myFuel = (fuelRes.items || []).filter(
        (item: FuelLogListItem) =>
          item.driverId === user.id ||
          (item.driverName &&
            (item.driverName.toLowerCase() === fullName || item.driverName.toLowerCase() === uname))
      );

      setDozerLogs(myDozer);
      setFuelLogs(myFuel);
      setSalaryBreakdown(salaryRes);
    } catch {
      /* ignore fallback */
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.firstName, user?.lastName, user?.username]);

  useEffect(() => {
    loadOperatorData();
  }, [loadOperatorData]);

  // Aggregated summaries
  const totalMeterRun = dozerLogs.reduce((acc, d) => acc + (d.totalMeterRun || 0), 0);
  const totalWagesEarned = dozerLogs.reduce((acc, d) => acc + (d.wages || 0), 0);
  const totalFuelQty = fuelLogs.reduce((acc, f) => acc + (f.quantity || 0), 0);

  const operatorNameDisplay =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Operator";
  const machineNameDisplay =
    userInfo?.assignedVehicleName ||
    user?.assignedVehicleName ||
    dozerLogs.find((d) => d.vehicleName)?.vehicleName ||
    fuelLogs.find((f) => f.vehicleName)?.vehicleName ||
    t.pages.dashboard.notAssigned;

  return (
    <div className="space-y-6 pb-12">
      {/* Operator Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-semibold uppercase tracking-wider">
                {userInfo?.roleName || user?.roleName || t.pages.dashboard.operatorPortal}
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t.pages.dashboard.activeSession}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t.common.welcomeBack}, {operatorNameDisplay}!
            </h1>
            <p className="text-sm text-amber-100/80 max-w-xl">
              Track your JCB meter runs, daily operation hours, fuel consumption, and operator wages statement.
            </p>
          </div>

          {/* Assigned Machine Badge Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 min-w-[240px] flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-amber-600/30 text-amber-300 flex items-center justify-center font-bold text-xl border border-amber-400/30">
              <SpeedometerIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-amber-200 uppercase font-medium tracking-wider block">
                {t.pages.dashboard.assignedMachine}
              </span>
              <span className="text-base font-semibold text-white truncate block max-w-[180px]">
                {machineNameDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDozerModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span>+ {t.pages.dozerLog.addButton}</span>
          </button>

          <button
            type="button"
            onClick={() => setFuelModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span>+ {t.pages.fuelLog.addButton}</span>
          </button>

          <Link
            to="/reports/dozer-log"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-medium transition-colors"
          >
            <span>{t.reports.printReport}</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* JCB Meter Run KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.jcbRunHours}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <SpeedometerIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">{totalMeterRun.toFixed(2)} hrs</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Total Logs:</span>
            <span className="font-semibold text-amber-700">{dozerLogs.length} logs</span>
          </div>
        </div>

        {/* Operator Wages KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.jcbWagesEarned}
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CurrencyIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {t.common.currencySymbol} {totalWagesEarned.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Operated Log Count:</span>
            <span className="font-semibold text-slate-700">{dozerLogs.length} records</span>
          </div>
        </div>

        {/* Fuel Logs KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.fuelConsumption}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FuelPumpIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">{totalFuelQty.toFixed(2)} L</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Fuel Entries Count:</span>
            <span className="font-semibold text-slate-700">{fuelLogs.length} logs</span>
          </div>
        </div>

        {/* Total Grand Earnings KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.grandTotalEarnings}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CurrencyIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {t.common.currencySymbol} {(salaryBreakdown?.grandTotal || 0).toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>Total Earnings:</span>
            <span className="font-semibold text-emerald-600">
              {t.common.currencySymbol} {(salaryBreakdown?.grandTotal || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-4 pt-4 flex flex-wrap gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab("dozer")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 ${
              activeTab === "dozer"
                ? "bg-white text-amber-600 border-amber-600 font-semibold shadow-sm"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/50"
            }`}
          >
            {t.pages.dashboard.myJcbLogs} ({dozerLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fuel")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 ${
              activeTab === "fuel"
                ? "bg-white text-amber-600 border-amber-600 font-semibold shadow-sm"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/50"
            }`}
          >
            {t.pages.dashboard.myFuelLogs} ({fuelLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("earnings")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 ${
              activeTab === "earnings"
                ? "bg-white text-amber-600 border-amber-600 font-semibold shadow-sm"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/50"
            }`}
          >
            {t.pages.dashboard.earningsSummary}
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-amber-600 mb-3" />
              <p className="text-sm font-medium">{t.common.loading}</p>
            </div>
          ) : (
            <>
              {/* Dozer Logs Tab Content */}
              {activeTab === "dozer" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-800">{t.pages.dashboard.myJcbLogs}</h3>
                    <button
                      type="button"
                      onClick={() => setDozerModalOpen(true)}
                      className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition-colors"
                    >
                      + {t.pages.dozerLog.addButton}
                    </button>
                  </div>

                  {dozerLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      {t.pages.dashboard.noDozerLogs}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <th className="py-3 px-3">S.N.</th>
                            <th className="py-3 px-3">{t.reports.dateAd}</th>
                            <th className="py-3 px-3">Date (BS)</th>
                            <th className="py-3 px-3">Vehicle</th>
                            <th className="py-3 px-3">Project / Location</th>
                            <th className="py-3 px-3 text-right">Start Meter</th>
                            <th className="py-3 px-3 text-right">End Meter</th>
                            <th className="py-3 px-3 text-right">Total Meter Run</th>
                            <th className="py-3 px-3 text-right">Cash Amount</th>
                            <th className="py-3 px-3 text-right">Wages</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {dozerLogs.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-medium">{idx + 1}</td>
                              <td className="py-2.5 px-3">{item.operationDate}</td>
                              <td className="py-2.5 px-3">{formatBSDate(item.operationDate, locale)}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-800">{item.vehicleName || "—"}</td>
                              <td className="py-2.5 px-3">{item.projectName || item.location || "—"}</td>
                              <td className="py-2.5 px-3 text-right">{item.startMeter?.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right">{item.endMeter?.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right font-semibold text-amber-700">{item.totalMeterRun?.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right">
                                {t.common.currencySymbol} {(item.cashAmount || 0).toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                                {t.common.currencySymbol} {(item.wages || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Fuel Logs Tab Content */}
              {activeTab === "fuel" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-800">{t.pages.dashboard.myFuelLogs}</h3>
                    <button
                      type="button"
                      onClick={() => setFuelModalOpen(true)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
                    >
                      + {t.pages.fuelLog.addButton}
                    </button>
                  </div>

                  {fuelLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      {t.pages.dashboard.noFuelLogs}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <th className="py-3 px-3">S.N.</th>
                            <th className="py-3 px-3">{t.reports.dateAd}</th>
                            <th className="py-3 px-3">Date (BS)</th>
                            <th className="py-3 px-3">Vehicle</th>
                            <th className="py-3 px-3">Party Name</th>
                            <th className="py-3 px-3">Fuel Type</th>
                            <th className="py-3 px-3 text-right">Quantity (L)</th>
                            <th className="py-3 px-3 text-right">Rate</th>
                            <th className="py-3 px-3 text-right">Total Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {fuelLogs.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-medium">{idx + 1}</td>
                              <td className="py-2.5 px-3">{item.date}</td>
                              <td className="py-2.5 px-3">{formatBSDate(item.date, locale)}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-800">{item.vehicleName || "—"}</td>
                              <td className="py-2.5 px-3">{item.partyNameName || item.partyNameOther || "—"}</td>
                              <td className="py-2.5 px-3">{item.fuelTypeName || "—"}</td>
                              <td className="py-2.5 px-3 text-right font-semibold">{item.quantity?.toFixed(2)} L</td>
                              <td className="py-2.5 px-3 text-right">{t.common.currencySymbol} {item.price?.toFixed(2)}</td>
                              <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                                {t.common.currencySymbol} {((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Earnings Tab Content */}
              {activeTab === "earnings" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-800">{t.pages.dashboard.earningsSummary}</h3>
                    <Link
                      to={`/salary-details/${user?.id}`}
                      className="text-xs text-amber-600 font-semibold hover:underline"
                    >
                      {t.pages.dashboard.viewFullStatement} →
                    </Link>
                  </div>

                  {!salaryBreakdown ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      No salary breakdown data available.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-sm font-semibold text-slate-700">{t.pages.dashboard.jcbWagesEarned}</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Project / Location</th>
                                <th className="py-2.5 px-3 text-right">Meter Run</th>
                                <th className="py-2.5 px-3 text-right">Wages Earned</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(salaryBreakdown.wages || []).slice(0, 10).map((w, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80">
                                  <td className="py-2 px-3">{w.date}</td>
                                  <td className="py-2 px-3">{w.projectName || w.vendorName || "JCB Operation"}</td>
                                  <td className="py-2 px-3 text-right font-medium">{w.totalMeterRun?.toFixed(2) || "—"}</td>
                                  <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                                    {t.common.currencySymbol} {w.wages.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Summary Box */}
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-800 border-b border-slate-200 pb-2">
                          {t.pages.dashboard.earningsSummary}
                        </h4>

                        <div className="flex justify-between text-xs text-slate-600">
                          <span>{t.pages.dashboard.monthlySalaries}:</span>
                          <span className="font-semibold text-slate-800">
                            {t.common.currencySymbol} {(salaryBreakdown.totalFromMonthlySalaries || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between text-xs text-slate-600">
                          <span>{t.pages.dashboard.dozerWages}:</span>
                          <span className="font-semibold text-slate-800">
                            {t.common.currencySymbol} {(salaryBreakdown.totalFromWages || 0).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex justify-between text-xs text-slate-600 border-t border-slate-200 pt-2 font-bold text-sm">
                          <span className="text-slate-700">{t.pages.dashboard.grandTotalEarned}:</span>
                          <span className="text-slate-900">
                            {t.common.currencySymbol} {(salaryBreakdown.grandTotal || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Form Modals */}
      <DozerLogFormModal
        open={dozerModalOpen}
        mode={{ kind: "add" }}
        onClose={() => setDozerModalOpen(false)}
        onSaved={() => {
          setDozerModalOpen(false);
          loadOperatorData();
        }}
      />

      <FuelLogFormModal
        open={fuelModalOpen}
        mode={{ kind: "add" }}
        onClose={() => setFuelModalOpen(false)}
        onSaved={() => {
          setFuelModalOpen(false);
          loadOperatorData();
        }}
      />
    </div>
  );
}

// Icon Components
function SpeedometerIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FuelPumpIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h12a2 2 0 012 2v4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 13v6a1 1 0 001 1h10a1 1 0 001-1v-6" />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
