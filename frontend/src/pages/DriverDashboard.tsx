import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getStoredUser,
  usersApi,
  fuelLogsApi,
  transportationsApi,
  salaryDetailApi,
} from "../services/api";
import type { UserListItem } from "../types/users";
import type { FuelLogListItem } from "../types/fuelLog";
import type { TransportationListItem } from "../types/transportation";
import type { SalaryBreakdownDto } from "../types/salaryDetail";
import { useCulture } from "../context/CultureContext";
import { formatBSDate } from "../utils/nepaliDate";

import FuelLogFormModal from "../components/FuelLogFormModal";
import TransportationFormModal from "../components/TransportationFormModal";

export default function DriverDashboard() {
  const { locale, t } = useCulture();
  const user = getStoredUser();

  const [userInfo, setUserInfo] = useState<UserListItem | null>(null);
  const [fuelLogs, setFuelLogs] = useState<FuelLogListItem[]>([]);
  const [transportations, setTransportations] = useState<TransportationListItem[]>([]);
  const [salaryBreakdown, setSalaryBreakdown] = useState<SalaryBreakdownDto | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [transportModalOpen, setTransportModalOpen] = useState(false);

  // Active Tab for recent logs
  const [activeTab, setActiveTab] = useState<"fuel" | "transport" | "earnings">("fuel");

  const loadDriverData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [uProfile, fuelRes, transportRes, salaryRes] = await Promise.all([
        usersApi.getProfile().catch(() => null),
        fuelLogsApi.list({ pageSize: 100 }).catch(() => ({ items: [] as FuelLogListItem[] })),
        transportationsApi.list({ pageSize: 100 }).catch(() => ({ items: [] as TransportationListItem[] })),
        salaryDetailApi.breakdown(user.id).catch(() => null),
      ]);

      setUserInfo(uProfile);

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").toLowerCase();
      const uname = user.username.toLowerCase();

      // Filter logs belonging to this vehicle driver
      const myFuel = (fuelRes.items || []).filter(
        (item: FuelLogListItem) =>
          item.driverId === user.id ||
          (item.driverName &&
            (item.driverName.toLowerCase() === fullName || item.driverName.toLowerCase() === uname))
      );

      const myTransport = (transportRes.items || []).filter(
        (item: TransportationListItem) =>
          item.transportedById === user.id ||
          (item.transportedByName &&
            (item.transportedByName.toLowerCase() === fullName ||
              item.transportedByName.toLowerCase() === uname))
      );

      setFuelLogs(myFuel);
      setTransportations(myTransport);
      setSalaryBreakdown(salaryRes);
    } catch {
      /* ignore fallback */
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.firstName, user?.lastName, user?.username]);

  useEffect(() => {
    loadDriverData();
  }, [loadDriverData]);

  // Aggregated summaries
  const totalFuelQty = fuelLogs.reduce((acc, f) => acc + (f.quantity || 0), 0);
  const totalTrips = transportations.reduce((acc, t) => acc + (t.noOfTip || 1), 0);
  const totalTransportQty = transportations.reduce((acc, t) => acc + (t.quantity || 0), 0);

  const driverNameDisplay =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Driver";
  const vehicleNameDisplay =
    userInfo?.assignedVehicleName ||
    user?.assignedVehicleName ||
    fuelLogs.find((f) => f.vehicleName)?.vehicleName ||
    transportations.find((t) => t.vehicleName)?.vehicleName ||
    t.pages.dashboard.notAssigned;

  return (
    <div className="space-y-6 pb-12">
      {/* Driver Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold uppercase tracking-wider">
                {userInfo?.roleName || user?.roleName || t.pages.dashboard.driverPortal}
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t.pages.dashboard.activeSession}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t.common.welcomeBack}, {driverNameDisplay}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Manage your assigned vehicle, log trip details, track fuel logs, and monitor your personal wages.
            </p>
          </div>

          {/* Assigned Vehicle Badge Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 min-w-[240px] flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold text-xl border border-blue-400/30">
              <TruckIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-300 uppercase font-medium tracking-wider block">
                {t.pages.dashboard.assignedVehicle}
              </span>
              <span className="text-base font-semibold text-white truncate block max-w-[180px]">
                {vehicleNameDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setFuelModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span>+ {t.pages.fuelLog.addButton}</span>
          </button>

          <button
            type="button"
            onClick={() => setTransportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold shadow-md transition-all active:scale-95"
          >
            <PlusIcon className="w-4 h-4" />
            <span>+ {t.pages.transportation.addButton}</span>
          </button>

          <Link
            to="/reports/transportation"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-medium transition-colors"
          >
            <span>{t.reports.printReport}</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Fuel Logs KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.myFuelLogs}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FuelPumpIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">{fuelLogs.length}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>{t.reports.totalQuantity}:</span>
            <span className="font-semibold text-slate-700">{totalFuelQty.toFixed(2)} L</span>
          </div>
        </div>

        {/* Transportation Trips KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.myTransportationTrips}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TruckIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">{totalTrips} Tips</p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>{t.pages.dashboard.qtyTransported}:</span>
            <span className="font-semibold text-slate-700">{totalTransportQty.toFixed(2)} units</span>
          </div>
        </div>

        {/* Net Salary & Earnings KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.myEarnings}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CurrencyIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {t.common.currencySymbol} {(salaryBreakdown?.grandTotal || 0).toLocaleString()}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>{t.pages.dashboard.tripWagesEarned}:</span>
            <span className="font-semibold text-emerald-600">
              {t.common.currencySymbol} {(salaryBreakdown?.totalFromWages || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-4 pt-4 flex flex-wrap gap-2 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab("fuel")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 ${
              activeTab === "fuel"
                ? "bg-white text-blue-600 border-blue-600 font-semibold shadow-sm"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/50"
            }`}
          >
            {t.pages.dashboard.myFuelLogs} ({fuelLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("transport")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 ${
              activeTab === "transport"
                ? "bg-white text-blue-600 border-blue-600 font-semibold shadow-sm"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/50"
            }`}
          >
            {t.pages.dashboard.myTransportationTrips} ({transportations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("earnings")}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors border-b-2 ${
              activeTab === "earnings"
                ? "bg-white text-blue-600 border-blue-600 font-semibold shadow-sm"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/50"
            }`}
          >
            {t.pages.dashboard.earningsSummary}
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-3" />
              <p className="text-sm font-medium">{t.common.loading}</p>
            </div>
          ) : (
            <>
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

              {/* Transportation Tab Content */}
              {activeTab === "transport" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-800">{t.pages.dashboard.myTransportationTrips}</h3>
                    <button
                      type="button"
                      onClick={() => setTransportModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors"
                    >
                      + {t.pages.transportation.addButton}
                    </button>
                  </div>

                  {transportations.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      {t.pages.dashboard.noTransportLogs}
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
                            <th className="py-3 px-3">Material</th>
                            <th className="py-3 px-3">Vendor / Project</th>
                            <th className="py-3 px-3">Party Name</th>
                            <th className="py-3 px-3 text-center">Tips</th>
                            <th className="py-3 px-3 text-right">Quantity</th>
                            <th className="py-3 px-3 text-right">Wages</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {transportations.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-medium">{idx + 1}</td>
                              <td className="py-2.5 px-3">{item.date}</td>
                              <td className="py-2.5 px-3">{formatBSDate(item.date, locale)}</td>
                              <td className="py-2.5 px-3 font-medium text-slate-800">{item.vehicleName || item.vehicleOther || "—"}</td>
                              <td className="py-2.5 px-3">{item.materialName || "—"}</td>
                              <td className="py-2.5 px-3">{item.vendorName || item.projectName || "—"}</td>
                              <td className="py-2.5 px-3">{item.partyNameName || "—"}</td>
                              <td className="py-2.5 px-3 text-center font-semibold">{item.noOfTip ?? 1}</td>
                              <td className="py-2.5 px-3 text-right font-medium">{item.quantity?.toFixed(2) ?? "—"}</td>
                              <td className="py-2.5 px-3 text-right font-semibold text-emerald-700">
                                {t.common.currencySymbol} {(item.totalWages ?? item.wages ?? 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Salary & Earnings Tab Content */}
              {activeTab === "earnings" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-slate-800">{t.pages.dashboard.earningsSummary}</h3>
                    <Link
                      to={`/salary-details/${user?.id}`}
                      className="text-xs text-blue-600 font-semibold hover:underline"
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
                        <h4 className="text-sm font-semibold text-slate-700">{t.pages.dashboard.tripWagesEarned}</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3">Project / Details</th>
                                <th className="py-2.5 px-3 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {(salaryBreakdown.wages || []).slice(0, 8).map((w, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80">
                                  <td className="py-2 px-3">{w.date}</td>
                                  <td className="py-2 px-3">{w.projectName || w.vendorName || "Log Wage"}</td>
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
                          <span>{t.pages.dashboard.tripsWages}:</span>
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
      <FuelLogFormModal
        open={fuelModalOpen}
        mode={{ kind: "add" }}
        onClose={() => setFuelModalOpen(false)}
        onSaved={() => {
          setFuelModalOpen(false);
          loadDriverData();
        }}
      />

      <TransportationFormModal
        open={transportModalOpen}
        mode={{ kind: "add" }}
        onClose={() => setTransportModalOpen(false)}
        onSaved={() => {
          setTransportModalOpen(false);
          loadDriverData();
        }}
      />
    </div>
  );
}

// Icon Components
function TruckIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 17a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM3 9l3-4h8l3 4v6H3V9zm15 0h3l2 3v3h-5V9z" />
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
