import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { transportationsApi, usersApi, vehiclesApi, materialsApi, vendorsApi, projectsApi, partyNamesApi } from "../services/api";
import { getCurrentBSDate, bsToAdIso, formatBSDate } from "../utils/nepaliDate";
import type { TransportationListItem } from "../types/transportation";
import NepaliCalendarPicker from "../components/NepaliCalendarPicker";
import { useCulture } from "../context/CultureContext";

interface AppliedFiltersSnapshot {
  fromDate: string;
  toDate: string;
  transportedFilter: string;
  vehicleFilter: string;
  materialFilter: string;
  vendorFilter: string;
  projectFilter: string;
  partyFilter: string;
}

export default function TransportationReport() {
  const { locale, t } = useCulture();

  // Default Dates: toDate is today, fromDate is 1st day of current BS month
  const defaultDates = useMemo(() => {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    try {
      const { year, month } = getCurrentBSDate();
      const firstDayBsIso = bsToAdIso(year, month, 1);
      return { fromDate: firstDayBsIso, toDate: todayIso };
    } catch {
      const firstDayAd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      return { fromDate: firstDayAd, toDate: todayIso };
    }
  }, []);

  // Search & Results States
  const [hasSearched, setHasSearched] = useState(false);
  const [reportItems, setReportItems] = useState<TransportationListItem[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFiltersSnapshot>({
    fromDate: defaultDates.fromDate,
    toDate: defaultDates.toDate,
    transportedFilter: "",
    vehicleFilter: "",
    materialFilter: "",
    vendorFilter: "",
    projectFilter: "",
    partyFilter: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropdown Lookup Options
  const [transportedOptions, setTransportedOptions] = useState<string[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);
  const [materialOptions, setMaterialOptions] = useState<string[]>([]);
  const [vendorOptions, setVendorOptions] = useState<string[]>([]);
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [partyOptions, setPartyOptions] = useState<string[]>([]);

  // Filter Input Controls State
  const [fromDate, setFromDate] = useState<string>(defaultDates.fromDate);
  const [toDate, setToDate] = useState<string>(defaultDates.toDate);
  const [transportedFilter, setTransportedFilter] = useState<string>("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("");
  const [materialFilter, setMaterialFilter] = useState<string>("");
  const [vendorFilter, setVendorFilter] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState<string>("");
  const [partyFilter, setPartyFilter] = useState<string>("");

  // Load dropdown options on initial mount
  useEffect(() => {
    Promise.all([
      usersApi.drivers().catch(() => []),
      vehiclesApi.list().catch(() => []),
      materialsApi.list().catch(() => []),
      vendorsApi.list().catch(() => []),
      projectsApi.list().catch(() => []),
      partyNamesApi.listForDropdown().catch(() => []),
    ]).then(([drivers, vehicles, materials, vendors, projects, parties]) => {
      const dNames = drivers
        .map((d) => [d.firstName, d.lastName].filter(Boolean).join(" ") || d.username)
        .filter(Boolean);
      setTransportedOptions(Array.from(new Set(dNames)).sort());
      setVehicleOptions(vehicles.map((v) => v.name).filter(Boolean).sort());
      setMaterialOptions(materials.map((m) => m.name).filter(Boolean).sort());
      setVendorOptions(vendors.map((v) => v.name).filter(Boolean).sort());
      setProjectOptions(projects.map((p) => p.name).filter(Boolean).sort());
      setPartyOptions(parties.map((p) => p.name).filter(Boolean).sort());
    });
  }, []);

  // Search Handler
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transportationsApi.report({
        fromDate,
        toDate,
        transportedByName: transportedFilter,
        vehicleName: vehicleFilter,
        materialName: materialFilter,
        vendorName: vendorFilter,
        projectName: projectFilter,
        partyName: partyFilter,
      });

      setReportItems(data);
      setAppliedFilters({
        fromDate,
        toDate,
        transportedFilter,
        vehicleFilter,
        materialFilter,
        vendorFilter,
        projectFilter,
        partyFilter,
      });
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transportation report.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, transportedFilter, vehicleFilter, materialFilter, vendorFilter, projectFilter, partyFilter]);

  // Aggregated Summary Statistics
  const summary = useMemo(() => {
    const count = reportItems.length;
    const totalTips = reportItems.reduce((acc, curr) => acc + (curr.noOfTip || 0), 0);
    const totalQty = reportItems.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const totalWages = reportItems.reduce((acc, curr) => acc + (curr.totalWages || curr.wages || 0), 0);

    return {
      count,
      totalTips,
      totalQty,
      totalWages,
    };
  }, [reportItems]);

  // Reset all filters to default
  const handleClearFilters = () => {
    setFromDate(defaultDates.fromDate);
    setToDate(defaultDates.toDate);
    setTransportedFilter("");
    setVehicleFilter("");
    setMaterialFilter("");
    setVendorFilter("");
    setProjectFilter("");
    setPartyFilter("");
    setHasSearched(false);
    setReportItems([]);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    const reportDate = new Date().toISOString().split("T")[0];
    const fileName = `Transportation_Report_${reportDate}.xlsx`;

    // Metadata Rows
    const metadata = [
      ["CMS - Material Transportation Report"],
      [`Generated On: ${new Date().toLocaleString()}`],
      [
        `Filters Applied: ${
          appliedFilters.fromDate ? `From Date: ${appliedFilters.fromDate}` : "From: Beginning"
        } | ${
          appliedFilters.toDate ? `To Date: ${appliedFilters.toDate}` : "To: Present"
        } | ${
          appliedFilters.transportedFilter ? `Transported By: ${appliedFilters.transportedFilter}` : "All Drivers"
        } | ${
          appliedFilters.vehicleFilter ? `Vehicle: ${appliedFilters.vehicleFilter}` : "All Vehicles"
        } | ${
          appliedFilters.materialFilter ? `Material: ${appliedFilters.materialFilter}` : "All Materials"
        } | ${
          appliedFilters.vendorFilter ? `Vendor: ${appliedFilters.vendorFilter}` : "All Vendors"
        } | ${
          appliedFilters.projectFilter ? `Project: ${appliedFilters.projectFilter}` : "All Projects"
        } | ${
          appliedFilters.partyFilter ? `Party: ${appliedFilters.partyFilter}` : "All Parties"
        }`,
      ],
      [], // Blank row
    ];

    // Table Header
    const headers = [
      "S.N.",
      "Date (AD)",
      "Date (BS)",
      "Transported By",
      "Vehicle",
      "Material",
      "Vendor",
      "Project / Location",
      "Party Name",
      "No. of Tips",
      "Quantity",
      "Per Unit Cost (NRS)",
      "Total Wages (NRS)",
    ];

    // Data Rows
    const rows = reportItems.map((log, index) => {
      const driver = log.transportedByName || log.transportedByOther || "-";
      const vehicle = log.vehicleName || log.vehicleOther || "-";
      const vendor = log.vendorName || log.vendorOther || "-";
      const proj = log.projectName || log.projectOther || log.location || "-";
      const bsDate = formatBSDate(log.date, "en");

      return [
        index + 1,
        log.date,
        bsDate,
        driver,
        vehicle,
        log.materialName || "-",
        vendor,
        proj,
        log.partyNameName || "-",
        log.noOfTip ?? "-",
        Number((log.quantity || 0).toFixed(2)),
        Number((log.perUnitCost || 0).toFixed(2)),
        Number((log.totalWages || log.wages || 0).toFixed(2)),
      ];
    });

    // Summary Row
    const summaryRow = [
      "Summary / Grand Total",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      summary.totalTips,
      Number(summary.totalQty.toFixed(2)),
      "",
      Number(summary.totalWages.toFixed(2)),
    ];

    const worksheetData = [...metadata, headers, ...rows, [], summaryRow];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!cols"] = [
      { wch: 6 },  // S.N.
      { wch: 14 }, // Date AD
      { wch: 20 }, // Date BS
      { wch: 20 }, // Transported By
      { wch: 18 }, // Vehicle
      { wch: 18 }, // Material
      { wch: 20 }, // Vendor
      { wch: 22 }, // Project
      { wch: 20 }, // Party Name
      { wch: 12 }, // Tips
      { wch: 14 }, // Quantity
      { wch: 18 }, // Per Unit Cost
      { wch: 20 }, // Total Wages
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transportation Report");
    XLSX.writeFile(workbook, fileName);
  };

  const formatDateDisplay = (isoStr: string) => {
    if (!isoStr) return "-";
    try {
      const bs = formatBSDate(isoStr, locale);
      return `${isoStr} (${bs})`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* CSS For Printing */}
      <style>{`
        @media print {
          @page {
            margin: 10mm;
          }

          html, body, #root, div, main, .overflow-y-auto, .overflow-x-auto, .overflow-hidden {
            overflow: visible !important;
            height: auto !important;
            min-height: auto !important;
            max-height: none !important;
            position: static !important;
          }

          body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
          }

          aside, header, nav, .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          .print\\:border {
            border: 1px solid #cbd5e1 !important;
          }

          .grid {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 8px !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            margin-top: 10px !important;
          }

          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          tfoot {
            display: table-footer-group !important;
          }

          th, td {
            border: 1px solid #475569 !important;
            padding: 5px 8px !important;
            font-size: 10px !important;
            color: #000000 !important;
            background: transparent !important;
          }

          th {
            background-color: #f1f5f9 !important;
            font-weight: 700 !important;
          }
        }
      `}</style>

      {/* Printable Header */}
      <div className="hidden print:block mb-6 border-b border-slate-300 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">CMS - Material Transportation Report</h1>
            <p className="text-sm text-slate-600 mt-1">
              Generated On: {new Date().toLocaleString()}
            </p>
          </div>
          <div className="text-right text-xs text-slate-600 space-y-1">
            <p><strong>From:</strong> {appliedFilters.fromDate || "Beginning"}</p>
            <p><strong>To:</strong> {appliedFilters.toDate || "Present"}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
          <span><strong>Transported By:</strong> {appliedFilters.transportedFilter || "All Drivers"}</span>
          <span><strong>Vehicle:</strong> {appliedFilters.vehicleFilter || "All Vehicles"}</span>
          <span><strong>Material:</strong> {appliedFilters.materialFilter || "All Materials"}</span>
          <span><strong>Vendor:</strong> {appliedFilters.vendorFilter || "All Vendors"}</span>
          <span><strong>Project:</strong> {appliedFilters.projectFilter || "All Projects"}</span>
          <span><strong>Party:</strong> {appliedFilters.partyFilter || "All Parties"}</span>
        </div>
      </div>

      {/* Screen Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
            {t.reports.transportationTitle}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t.reports.transportationSubtitle}</p>
        </div>

        {hasSearched && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <PrinterIcon className="w-4 h-4" />
              <span>{t.reports.printReport}</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <ExcelIcon className="w-4 h-4" />
              <span>{t.reports.exportExcel}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4 print:hidden">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <FilterIcon className="w-4 h-4 text-slate-400" />
            <span>Filter Criteria</span>
          </h2>

          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {t.common.clearFilters}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {/* From Date */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.reports.fromDate}
            </label>
            <NepaliCalendarPicker
              value={fromDate}
              onChange={(val) => setFromDate(val)}
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.reports.toDate}
            </label>
            <NepaliCalendarPicker
              value={toDate}
              onChange={(val) => setToDate(val)}
            />
          </div>

          {/* Transported By Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.common.transportedBy}
            </label>
            <select
              value={transportedFilter}
              onChange={(e) => setTransportedFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">{t.reports.allDrivers}</option>
              {transportedOptions.map((driver) => (
                <option key={driver} value={driver}>
                  {driver}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.common.vehicle}
            </label>
            <select
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">{t.reports.allVehicles}</option>
              {vehicleOptions.map((veh) => (
                <option key={veh} value={veh}>
                  {veh}
                </option>
              ))}
            </select>
          </div>

          {/* Material Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.common.material}
            </label>
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">{t.reports.allMaterials}</option>
              {materialOptions.map((mat) => (
                <option key={mat} value={mat}>
                  {mat}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.common.vendor}
            </label>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">{t.reports.allVendors}</option>
              {vendorOptions.map((ven) => (
                <option key={ven} value={ven}>
                  {ven}
                </option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.common.project}
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">{t.reports.allProjects}</option>
              {projectOptions.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </select>
          </div>

          {/* Party Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.common.partyName}
            </label>
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">{t.reports.allParties}</option>
              {partyOptions.map((party) => (
                <option key={party} value={party}>
                  {party}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Row with Search Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <SearchIcon className="w-4 h-4" />
            )}
            <span>{t.reports.search}</span>
          </button>
        </div>
      </div>

      {/* Initial State Prompt */}
      {!hasSearched && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center text-slate-500 space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <SearchIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">
            {t.reports.transportationTitle}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {t.reports.searchPrompt}
          </p>
        </div>
      )}

      {/* KPI Cards Summary */}
      {hasSearched && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t.reports.totalEntries}
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <DocumentListIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">{summary.count}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t.reports.totalTrips}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <TruckIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">{summary.totalTips}</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t.reports.totalQuantity}
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <BoxesIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">
              {summary.totalQty.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t.reports.totalWages}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CurrencyIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">
              {t.common.currencySymbol}{" "}
              {summary.totalWages.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Report Data Table */}
      {hasSearched && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-3"></div>
              <p className="text-sm font-medium">{t.common.loading}</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={handleSearch}
                className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm font-medium transition-colors"
              >
                {t.common.refresh}
              </button>
            </div>
          ) : reportItems.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm">{t.reports.transportationNoData}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">#</th>
                    <th className="px-4 py-3.5">{t.common.date}</th>
                    <th className="px-4 py-3.5">{t.common.transportedBy}</th>
                    <th className="px-4 py-3.5">{t.common.vehicle}</th>
                    <th className="px-4 py-3.5">{t.common.material}</th>
                    <th className="px-4 py-3.5">{t.common.vendor}</th>
                    <th className="px-4 py-3.5">{t.common.project}</th>
                    <th className="px-4 py-3.5">{t.common.partyName}</th>
                    <th className="px-4 py-3.5 text-center">Tips</th>
                    <th className="px-4 py-3.5 text-right">{t.common.quantity}</th>
                    <th className="px-4 py-3.5 text-right">{t.common.perUnitCost}</th>
                    <th className="px-4 py-3.5 text-right">{t.common.totalWages}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportItems.map((log, index) => {
                    const driver = log.transportedByName || log.transportedByOther || "—";
                    const vehicle = log.vehicleName || log.vehicleOther || "—";
                    const vendor = log.vendorName || log.vendorOther || "—";
                    const proj = log.projectName || log.projectOther || log.location || "—";
                    const party = log.partyNameName || "—";

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400 font-mono text-xs">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {formatDateDisplay(log.date)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {driver}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {vehicle}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {log.materialName || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {vendor}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {proj}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {party}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-800">
                          {log.noOfTip ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-900">
                          {(log.quantity || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600">
                          {t.common.currencySymbol} {(log.perUnitCost || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                          {t.common.currencySymbol} {(log.totalWages || log.wages || 0).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-semibold text-slate-900">
                  <tr>
                    <td colSpan={8} className="px-4 py-3.5 text-right uppercase text-xs tracking-wider">
                      Total Summary
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono">
                      {summary.totalTips}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono">
                      {summary.totalQty.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5"></td>
                    <td className="px-4 py-3.5 text-right font-mono text-base text-emerald-700">
                      {t.common.currencySymbol} {summary.totalWages.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Icon Components
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function ExcelIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M8 13l4 4" />
      <path d="M12 13l-4 4" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function DocumentListIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function BoxesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function CurrencyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
