import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { fuelLogsApi, usersApi, vehiclesApi, fuelsApi, partyNamesApi } from "../services/api";
import { getCurrentBSDate, bsToAdIso, formatBSDate } from "../utils/nepaliDate";
import type { FuelLogListItem } from "../types/fuelLog";
import NepaliCalendarPicker from "../components/NepaliCalendarPicker";
import { useCulture } from "../context/CultureContext";
import type { Locale } from "../i18n/translations";
import { useUserColumnPreferences } from "../hooks/useUserColumnPreferences";

const DEFAULT_VISIBLE_COLUMNS: Record<string, boolean> = {
  sn: true,
  dateAd: true,
  dateBs: true,
  driver: true,
  vehicle: true,
  partyName: true,
  fuelType: true,
  quantity: true,
  price: true,
  total: true,
  createdBy: false,
  createdAt: false,
};

interface AppliedFiltersSnapshot {
  fromDate: string;
  toDate: string;
  driverFilter: string;
  vehicleFilter: string;
  fuelTypeFilter: string;
  partyFilter: string;
}

interface ColumnConfig {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  excelWidth?: number;
  getValue: (item: FuelLogListItem, index: number, locale: Locale) => string | number;
  getExcelValue: (item: FuelLogListItem, index: number) => string | number;
  getSummaryValue?: (summary: ReportSummary) => string | number | null;
}

interface ReportSummary {
  count: number;
  totalQty: number;
  totalCost: number;
  avgRate: number;
}

export default function FuelLogReport() {
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
  const [reportItems, setReportItems] = useState<FuelLogListItem[]>([]);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFiltersSnapshot>({
    fromDate: defaultDates.fromDate,
    toDate: defaultDates.toDate,
    driverFilter: "",
    vehicleFilter: "",
    fuelTypeFilter: "",
    partyFilter: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropdown Lookup Options
  const [driverOptions, setDriverOptions] = useState<string[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<string[]>([]);
  const [fuelTypeOptions, setFuelTypeOptions] = useState<string[]>([]);
  const [partyOptions, setPartyOptions] = useState<string[]>([]);

  // Filter Input Controls State
  const [fromDate, setFromDate] = useState<string>(defaultDates.fromDate);
  const [toDate, setToDate] = useState<string>(defaultDates.toDate);
  const [driverFilter, setDriverFilter] = useState<string>("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("");
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>("");
  const [partyFilter, setPartyFilter] = useState<string>("");

  // Column Visibility State saved per user
  const {
    visibleColumns,
    toggleColumn: toggleColumnVisibility,
    selectAll,
    deselectAll,
    resetToDefault,
    isCustomized,
  } = useUserColumnPreferences("fuel_log_report", DEFAULT_VISIBLE_COLUMNS);

  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // Close column menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setColumnMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Column Definitions
  const allColumns: ColumnConfig[] = useMemo(
    () => [
      {
        key: "sn",
        label: "S.N.",
        align: "center",
        excelWidth: 6,
        getValue: (_, index) => index + 1,
        getExcelValue: (_, index) => index + 1,
      },
      {
        key: "dateAd",
        label: t.reports.dateAd || "Date (AD)",
        align: "left",
        excelWidth: 14,
        getValue: (item) => item.date || "—",
        getExcelValue: (item) => item.date || "",
      },
      {
        key: "dateBs",
        label: t.reports.dateBs || "Date (BS)",
        align: "left",
        excelWidth: 16,
        getValue: (item, _, loc) => {
          try {
            return formatBSDate(item.date, loc);
          } catch {
            return "—";
          }
        },
        getExcelValue: (item) => {
          try {
            return formatBSDate(item.date, "en");
          } catch {
            return "";
          }
        },
      },
      {
        key: "driver",
        label: t.common.driver,
        align: "left",
        excelWidth: 20,
        getValue: (item) => item.driverName || "—",
        getExcelValue: (item) => item.driverName || "-",
      },
      {
        key: "vehicle",
        label: t.common.vehicle,
        align: "left",
        excelWidth: 18,
        getValue: (item) => item.vehicleName || "—",
        getExcelValue: (item) => item.vehicleName || "-",
      },
      {
        key: "partyName",
        label: t.common.partyName,
        align: "left",
        excelWidth: 22,
        getValue: (item) => item.partyNameName || item.partyNameOther || "—",
        getExcelValue: (item) => item.partyNameName || item.partyNameOther || "-",
      },
      {
        key: "fuelType",
        label: t.common.fuelType,
        align: "left",
        excelWidth: 14,
        getValue: (item) => item.fuelTypeName || "—",
        getExcelValue: (item) => item.fuelTypeName || "-",
      },
      {
        key: "quantity",
        label: t.common.quantityL,
        align: "right",
        excelWidth: 14,
        getValue: (item) => (item.quantity != null ? item.quantity.toFixed(2) : "—"),
        getExcelValue: (item) => (item.quantity != null ? Number(item.quantity.toFixed(2)) : 0),
        getSummaryValue: (s) => Number(s.totalQty.toFixed(2)),
      },
      {
        key: "price",
        label: t.common.price,
        align: "right",
        excelWidth: 18,
        getValue: (item) => (item.price != null ? `${t.common.currencySymbol} ${item.price.toFixed(2)}` : "—"),
        getExcelValue: (item) => (item.price != null ? Number(item.price.toFixed(2)) : 0),
        getSummaryValue: (s) => `Avg: ${t.common.currencySymbol} ${s.avgRate.toFixed(2)}`,
      },
      {
        key: "total",
        label: t.common.total,
        align: "right",
        excelWidth: 20,
        getValue: (item) => {
          const total = (item.quantity || 0) * (item.price || 0);
          return `${t.common.currencySymbol} ${total.toFixed(2)}`;
        },
        getExcelValue: (item) => {
          const total = (item.quantity || 0) * (item.price || 0);
          return Number(total.toFixed(2));
        },
        getSummaryValue: (s) => `${t.common.currencySymbol} ${s.totalCost.toFixed(2)}`,
      },
      {
        key: "createdBy",
        label: t.reports.createdBy || "Created By",
        align: "left",
        excelWidth: 16,
        getValue: (item) => item.createdBy || "—",
        getExcelValue: (item) => item.createdBy || "-",
      },
      {
        key: "createdAt",
        label: t.reports.createdAt || "Created At",
        align: "left",
        excelWidth: 18,
        getValue: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"),
        getExcelValue: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"),
      },
    ],
    [t]
  );

  const activeColumns = useMemo(
    () => allColumns.filter((col) => visibleColumns[col.key] !== false),
    [allColumns, visibleColumns]
  );

  const handleSelectAllColumns = () => {
    selectAll(allColumns.map((col) => col.key));
  };

  const handleDeselectAllColumns = () => {
    deselectAll(allColumns.map((col) => col.key), "sn");
  };

  // Load dropdown options on mount
  useEffect(() => {
    Promise.all([
      usersApi.drivers().catch(() => []),
      vehiclesApi.list().catch(() => []),
      fuelsApi.list().catch(() => []),
      partyNamesApi.listForDropdown().catch(() => []),
    ]).then(([drivers, vehicles, fuels, parties]) => {
      const dNames = drivers
        .map((d) => [d.firstName, d.lastName].filter(Boolean).join(" ") || d.username)
        .filter(Boolean);
      setDriverOptions(Array.from(new Set(dNames)).sort());
      setVehicleOptions(vehicles.map((v) => v.name).filter(Boolean).sort());
      setFuelTypeOptions(fuels.map((f) => f.name).filter(Boolean).sort());
      setPartyOptions(parties.map((p) => p.name).filter(Boolean).sort());
    });
  }, []);

  // Search Handler
  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fuelLogsApi.report({
        fromDate,
        toDate,
        driverName: driverFilter,
        vehicleName: vehicleFilter,
        fuelTypeName: fuelTypeFilter,
        partyName: partyFilter,
      });

      setReportItems(data);
      setAppliedFilters({
        fromDate,
        toDate,
        driverFilter,
        vehicleFilter,
        fuelTypeFilter,
        partyFilter,
      });
      setHasSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fuel log report.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, driverFilter, vehicleFilter, fuelTypeFilter, partyFilter]);

  // Aggregated Summary Statistics
  const summary = useMemo<ReportSummary>(() => {
    const count = reportItems.length;
    const totalQty = reportItems.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
    const totalCost = reportItems.reduce(
      (acc, curr) => acc + (curr.quantity || 0) * (curr.price || 0),
      0
    );
    const avgRate = totalQty > 0 ? totalCost / totalQty : 0;

    return {
      count,
      totalQty,
      totalCost,
      avgRate,
    };
  }, [reportItems]);

  // Clear Filters
  const handleClearFilters = () => {
    setFromDate(defaultDates.fromDate);
    setToDate(defaultDates.toDate);
    setDriverFilter("");
    setVehicleFilter("");
    setFuelTypeFilter("");
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
    const fileName = `Fuel_Log_Report_${reportDate}.xlsx`;

    const metadata = [
      ["CMS - Fuel Log Report"],
      [`Generated On: ${new Date().toLocaleString()}`],
      [
        `Filters Applied: ${
          appliedFilters.fromDate ? `From Date: ${appliedFilters.fromDate}` : "From: Beginning"
        } | ${
          appliedFilters.toDate ? `To Date: ${appliedFilters.toDate}` : "To: Present"
        } | ${
          appliedFilters.driverFilter ? `Driver: ${appliedFilters.driverFilter}` : "All Drivers"
        } | ${
          appliedFilters.vehicleFilter ? `Vehicle: ${appliedFilters.vehicleFilter}` : "All Vehicles"
        } | ${
          appliedFilters.fuelTypeFilter ? `Fuel Type: ${appliedFilters.fuelTypeFilter}` : "All Fuel Types"
        } | ${
          appliedFilters.partyFilter ? `Party: ${appliedFilters.partyFilter}` : "All Parties"
        }`,
      ],
      [],
    ];

    const headers = activeColumns.map((col) => col.label);

    const rows = reportItems.map((log, index) =>
      activeColumns.map((col) => col.getExcelValue(log, index))
    );

    let summaryTitleAdded = false;
    const summaryRow = activeColumns.map((col) => {
      if (col.getSummaryValue) {
        const val = col.getSummaryValue(summary);
        return typeof val === "string" ? val.replace(`${t.common.currencySymbol} `, "") : val;
      }
      if (!summaryTitleAdded) {
        summaryTitleAdded = true;
        return "Summary / Grand Total";
      }
      return "";
    });

    const worksheetData = [...metadata, headers, ...rows, [], summaryRow];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    worksheet["!cols"] = activeColumns.map((col) => ({ wch: col.excelWidth || 15 }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fuel Log Report");
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6">
      {/* CSS For Printing */}
      <style>{`
        @media print {
          @page {
            margin: 8mm;
            size: landscape;
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
            font-size: 10px !important;
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
            padding: 4px 6px !important;
            font-size: 9px !important;
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
            <h1 className="text-2xl font-bold text-slate-900">CMS - Fuel Log Report</h1>
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
          <span><strong>Driver:</strong> {appliedFilters.driverFilter || "All Drivers"}</span>
          <span><strong>Vehicle:</strong> {appliedFilters.vehicleFilter || "All Vehicles"}</span>
          <span><strong>Fuel Type:</strong> {appliedFilters.fuelTypeFilter || "All Fuel Types"}</span>
          <span><strong>Party:</strong> {appliedFilters.partyFilter || "All Parties"}</span>
        </div>
      </div>

      {/* Screen Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
            {t.reports.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t.reports.subtitle}</p>
        </div>

        {hasSearched && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Columns Dropdown Selector */}
            <div className="relative" ref={columnMenuRef}>
              <button
                type="button"
                onClick={() => setColumnMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-sm font-medium shadow-sm transition-colors"
              >
                <ColumnsIcon className="w-4 h-4 text-slate-500" />
                <span>
                  {t.reports.columns} ({activeColumns.length}/{allColumns.length})
                </span>
                <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {columnMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      {t.reports.showHideColumns}
                    </span>
                    <div className="flex gap-1.5 items-center">
                      <button
                        type="button"
                        onClick={handleSelectAllColumns}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {t.reports.selectAll}
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAllColumns}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                      >
                        {t.reports.deselectAll}
                      </button>
                      {isCustomized && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={resetToDefault}
                            className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                          >
                            {t.reports.resetColumns}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                    {allColumns.map((col) => {
                      const checked = visibleColumns[col.key] !== false;
                      return (
                        <label
                          key={col.key}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleColumnVisibility(col.key)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span>{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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

          {/* Driver Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.common.driver}
            </label>
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">{t.reports.allDrivers}</option>
              {driverOptions.map((driver) => (
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
              {vehicleOptions.map((vehicle) => (
                <option key={vehicle} value={vehicle}>
                  {vehicle}
                </option>
              ))}
            </select>
          </div>

          {/* Fuel Type Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t.common.fuelType}
            </label>
            <select
              value={fuelTypeFilter}
              onChange={(e) => setFuelTypeFilter(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">{t.reports.allFuelTypes}</option>
              {fuelTypeOptions.map((ft) => (
                <option key={ft} value={ft}>
                  {ft}
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

        {/* Action Row */}
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
            {t.reports.title}
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
                {t.reports.totalQuantity}
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <FuelPumpIcon className="w-4 h-4" />
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
                {t.reports.totalCost}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CurrencyIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">
              {t.common.currencySymbol}{" "}
              {summary.totalCost.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {t.reports.avgCostPerLiter}
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <ChartIcon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 mt-2">
              {t.common.currencySymbol}{" "}
              {summary.avgRate.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}

      {/* Report Table */}
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
              <p className="text-sm">{t.reports.noData}</p>
            </div>
          ) : activeColumns.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm">No columns selected. Please toggle on columns from the Columns menu above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    {activeColumns.map((col) => (
                      <th
                        key={col.key}
                        className={`px-4 py-3.5 ${
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {reportItems.map((log, index) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {activeColumns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 ${
                            col.align === "center"
                              ? "text-center font-mono text-xs text-slate-700"
                              : col.align === "right"
                              ? "text-right font-mono text-slate-800"
                              : "text-left text-slate-800 font-medium whitespace-nowrap"
                          }`}
                        >
                          {col.getValue(log, index, locale)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100/90 border-t-2 border-slate-300 font-semibold text-slate-900">
                  <tr>
                    {(() => {
                      let titleRendered = false;
                      return activeColumns.map((col) => {
                        if (col.getSummaryValue) {
                          const val = col.getSummaryValue(summary);
                          return (
                            <td
                              key={col.key}
                              className={`px-4 py-3.5 font-mono ${
                                col.align === "center"
                                  ? "text-center"
                                  : col.align === "right"
                                  ? "text-right text-emerald-700 font-bold"
                                  : "text-left"
                              }`}
                            >
                              {val ?? ""}
                            </td>
                          );
                        }
                        if (!titleRendered) {
                          titleRendered = true;
                          return (
                            <td
                              key={col.key}
                              className="px-4 py-3.5 text-left uppercase text-xs tracking-wider text-slate-700 font-bold"
                            >
                              Total Summary
                            </td>
                          );
                        }
                        return <td key={col.key} className="px-4 py-3.5"></td>;
                      });
                    })()}
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

function FuelPumpIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17" />
      <path d="M15 9h2a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9l-3-3" />
      <line x1="3" y1="22" x2="15" y2="22" />
      <rect x="6" y="6" width="6" height="4" />
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

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ColumnsIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
