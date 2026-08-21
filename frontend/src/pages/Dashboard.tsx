import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getStoredUser,
  usersApi,
  vehiclesApi,
  transportationsApi,
  fuelLogsApi,
  dozerLogsApi,
  projectsApi,
  vendorsApi,
} from "../services/api";
import type { UserListItem } from "../types/users";
import type { VehicleListItem } from "../types/vehicles";
import type { TransportationListItem } from "../types/transportation";
import type { FuelLogListItem } from "../types/fuelLog";
import type { DozerLogListItem } from "../types/dozerLog";
import type { ProjectListItem } from "../types/projects";
import type { VendorListItem } from "../types/vendors";
import { useCulture } from "../context/CultureContext";

import DriverDashboard from "./DriverDashboard";
import OperatorDashboard from "./OperatorDashboard";

export default function Dashboard() {
  const { t } = useCulture();
  const user = getStoredUser();
  const roleLower = (user?.roleName || "").toLowerCase();

  const isOperatorRole = Boolean(roleLower.includes("operator") || roleLower.includes("dozer"));
  const isDriverRole = Boolean(roleLower.includes("driver") && !isOperatorRole);

  const [viewMode, setViewMode] = useState<"admin" | "driver" | "operator">(
    isOperatorRole ? "operator" : isDriverRole ? "driver" : "admin"
  );

  // Admin Dashboard State
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [transportations, setTransportations] = useState<TransportationListItem[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLogListItem[]>([]);
  const [dozerLogs, setDozerLogs] = useState<DozerLogListItem[]>([]);
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [vendors, setVendors] = useState<VendorListItem[]>([]);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [uList, vList, tRes, fRes, dRes, pList, vendList] = await Promise.all([
        usersApi.list().catch(() => [] as UserListItem[]),
        vehiclesApi.list().catch(() => [] as VehicleListItem[]),
        transportationsApi.list({ pageSize: 50 }).catch(() => ({ items: [] as TransportationListItem[] })),
        fuelLogsApi.list({ pageSize: 50 }).catch(() => ({ items: [] as FuelLogListItem[] })),
        dozerLogsApi.list({ pageSize: 50 }).catch(() => ({ items: [] as DozerLogListItem[] })),
        projectsApi.list().catch(() => [] as ProjectListItem[]),
        vendorsApi.list().catch(() => [] as VendorListItem[]),
      ]);

      setUsers(uList);
      setVehicles(vList);
      setTransportations(tRes.items || []);
      setFuelLogs(fRes.items || []);
      setDozerLogs(dRes.items || []);
      setProjects(pList);
      setVendors(vendList);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "admin") {
      loadAdminData();
    }
  }, [viewMode, loadAdminData]);

  if (viewMode === "driver") {
    return (
      <div className="space-y-4">
        {!isDriverRole && (
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md font-medium">
              {t.pages.dashboard.adminPreviewDriver}
            </span>
            <button
              type="button"
              onClick={() => setViewMode("admin")}
              className="text-xs px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              ← {t.pages.dashboard.adminView}
            </button>
          </div>
        )}
        <DriverDashboard />
      </div>
    );
  }

  if (viewMode === "operator") {
    return (
      <div className="space-y-4">
        {!isOperatorRole && (
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md font-medium">
              {t.pages.dashboard.adminPreviewOperator}
            </span>
            <button
              type="button"
              onClick={() => setViewMode("admin")}
              className="text-xs px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
            >
              ← {t.pages.dashboard.adminView}
            </button>
          </div>
        )}
        <OperatorDashboard />
      </div>
    );
  }

  // Aggregated System Summaries
  const driverCount = users.filter((u) => u.roleName?.toLowerCase().includes("driver")).length;
  const operatorCount = users.filter(
    (u) => u.roleName?.toLowerCase().includes("operator") || u.roleName?.toLowerCase().includes("dozer")
  ).length;

  const totalFuelQty = fuelLogs.reduce((acc, f) => acc + (f.quantity || 0), 0);
  const totalFuelCost = fuelLogs.reduce((acc, f) => acc + (f.quantity || 0) * (f.price || 0), 0);
  const totalTrips = transportations.reduce((acc, t) => acc + (t.noOfTip || 1), 0);
  const totalTransportQty = transportations.reduce((acc, t) => acc + (t.quantity || 0), 0);
  const totalMeterRun = dozerLogs.reduce((acc, d) => acc + (d.totalMeterRun || 0), 0);

  const adminNameDisplay =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.username || "Admin";

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Executive Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-xs font-semibold uppercase tracking-wider">
                {t.pages.dashboard.adminPortal}
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t.pages.dashboard.systemOnline}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {t.common.welcomeBack}, {adminNameDisplay}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Real-time executive overview of accounts, fleet vehicles, trip transportations, fuel consumption, and dozer operations across CMS.
            </p>
          </div>

          {/* Quick Portal Switchers */}
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setViewMode("driver")}
              className="px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-400/30 rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2"
            >
              <TruckIcon className="w-4 h-4 text-blue-400" />
              <span>{t.pages.dashboard.driverView} →</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("operator")}
              className="px-4 py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-400/30 rounded-xl text-xs font-semibold backdrop-blur-md transition-all flex items-center gap-2"
            >
              <SpeedometerIcon className="w-4 h-4 text-amber-400" />
              <span>{t.pages.dashboard.operatorView} →</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* User Accounts KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.totalAccounts}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UsersIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {loading ? "—" : users.length}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>{t.pages.dashboard.driversAndOperators}:</span>
            <span className="font-semibold text-slate-700">{driverCount} Drivers • {operatorCount} Operators</span>
          </div>
        </div>

        {/* Registered Vehicles KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.registeredFleet}
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TruckIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {loading ? "—" : vehicles.length}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>{t.pages.dashboard.activeVehicles}:</span>
            <span className="font-semibold text-indigo-700">{vehicles.length} Vehicles</span>
          </div>
        </div>

        {/* Transportation Trips KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.transportationTrips}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BoxesIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {loading ? "—" : `${totalTrips} Tips`}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>{t.pages.dashboard.qtyTransported}:</span>
            <span className="font-semibold text-emerald-700">{totalTransportQty.toFixed(2)} units</span>
          </div>
        </div>

        {/* Fuel Consumption KPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.pages.dashboard.fuelConsumption}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FuelPumpIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-800 mt-2">
            {loading ? "—" : `${totalFuelQty.toFixed(2)} L`}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>{t.pages.dashboard.fuelExpense}:</span>
            <span className="font-semibold text-slate-700">{t.common.currencySymbol} {totalFuelCost.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Secondary KPI Bar: JCB Hours, Projects & Vendors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
              {t.pages.dashboard.jcbRunHours}
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalMeterRun.toFixed(2)} hrs</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <SpeedometerIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
              {t.pages.dashboard.activeProjects}
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{projects.length} Projects</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ProjectIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider">
              {t.pages.dashboard.activeVendors}
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{vendors.length} Vendors</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <VendorIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Live System Activity Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Transportation Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <h3 className="text-base font-semibold text-slate-800">{t.pages.dashboard.recentTransportation}</h3>
            </div>
            <Link to="/reports/transportation" className="text-xs text-blue-600 font-semibold hover:underline">
              {t.pages.dashboard.viewAll} →
            </Link>
          </div>

          {transportations.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No recent transportation logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 pb-2">
                    <th className="py-2">Date</th>
                    <th className="py-2">Driver</th>
                    <th className="py-2">Vehicle</th>
                    <th className="py-2">Material</th>
                    <th className="py-2 text-right">Tips</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {transportations.slice(0, 5).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="py-2 font-medium text-slate-600">{t.date}</td>
                      <td className="py-2 font-semibold text-slate-800">{t.transportedByName || "—"}</td>
                      <td className="py-2">{t.vehicleName || t.vehicleOther || "—"}</td>
                      <td className="py-2">{t.materialName || "—"}</td>
                      <td className="py-2 text-right font-bold text-blue-700">{t.noOfTip ?? 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Latest Fuel Logs Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="text-base font-semibold text-slate-800">{t.pages.dashboard.recentFuelLogs}</h3>
            </div>
            <Link to="/reports/fuel-log" className="text-xs text-amber-600 font-semibold hover:underline">
              {t.pages.dashboard.viewAll} →
            </Link>
          </div>

          {fuelLogs.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No recent fuel logs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 pb-2">
                    <th className="py-2">Date</th>
                    <th className="py-2">Vehicle</th>
                    <th className="py-2">Driver</th>
                    <th className="py-2 text-right">Quantity</th>
                    <th className="py-2 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {fuelLogs.slice(0, 5).map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50/60">
                      <td className="py-2 font-medium text-slate-600">{f.date}</td>
                      <td className="py-2 font-semibold text-slate-800">{f.vehicleName || "—"}</td>
                      <td className="py-2">{f.driverName || "—"}</td>
                      <td className="py-2 text-right font-semibold">{f.quantity?.toFixed(2)} L</td>
                      <td className="py-2 text-right font-bold text-emerald-700">
                        {t.common.currencySymbol} {((f.quantity || 0) * (f.price || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Admin Quick Management Hub */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800">{t.pages.dashboard.managementHub}</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/users"
            className="p-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group text-center space-y-1.5"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <UsersIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">{t.pages.users.title}</p>
          </Link>

          <Link
            to="/vehicles"
            className="p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all group text-center space-y-1.5"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <TruckIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600">{t.pages.vehicles.title}</p>
          </Link>

          <Link
            to="/reports/transportation"
            className="p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all group text-center space-y-1.5"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <BoxesIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800 group-hover:text-emerald-600">{t.pages.transportation.title}</p>
          </Link>

          <Link
            to="/reports/fuel-log"
            className="p-4 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all group text-center space-y-1.5"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <FuelPumpIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800 group-hover:text-amber-600">{t.pages.fuelLog.title}</p>
          </Link>

          <Link
            to="/reports/dozer-log"
            className="p-4 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl transition-all group text-center space-y-1.5"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <SpeedometerIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800 group-hover:text-purple-600">{t.pages.dozerLog.title}</p>
          </Link>

          <Link
            to="/projects"
            className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition-all group text-center space-y-1.5"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <ProjectIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">{t.pages.projects.title}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Icon Components
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

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

function SpeedometerIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function BoxesIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function ProjectIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
    </svg>
  );
}

function VendorIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}
