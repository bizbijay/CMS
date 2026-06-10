import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  adToBS,
  bsToAdIso,
  getDaysInBSMonth,
  NEPALI_MONTHS_EN,
} from "../utils/nepaliDate";

type PickerMode = "day" | "month" | "year";

interface Props {
  value: string;         // ISO AD date string (YYYY-MM-DD)
  onChange: (isoAd: string) => void;
  placeholder?: string;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const YEARS_PER_PAGE = 12;
const DROPDOWN_W = 272;
const DROPDOWN_H = 350;

function safeParseBs(isoAd: string) {
  try { return adToBS(isoAd); }
  catch { return adToBS(new Date().toISOString().slice(0, 10)); }
}

function todayBs() {
  return adToBS(new Date().toISOString().slice(0, 10));
}

export default function NepaliCalendarPicker({ value, onChange, placeholder }: Props) {
  const selected = safeParseBs(value);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>("day");
  const [viewYear, setViewYear] = useState(selected.year);
  const [viewMonth, setViewMonth] = useState(selected.month);
  const [yearRangeStart, setYearRangeStart] = useState(selected.year - 5);
  const [alignRight, setAlignRight] = useState(false);
  const [above, setAbove] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync view when parent changes value (e.g. edit mode)
  useEffect(() => {
    const bs = safeParseBs(value);
    setViewYear(bs.year);
    setViewMonth(bs.month);
  }, [value]);

  // Measure available space and flip dropdown direction if needed
  useLayoutEffect(() => {
    if (!open || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setAlignRight(rect.left + DROPDOWN_W > window.innerWidth - 8);
    setAbove(rect.bottom + DROPDOWN_H > window.innerHeight);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("day");
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  const today = todayBs();
  const totalDays = getDaysInBSMonth(viewYear, viewMonth);
  const firstDow = new Date(bsToAdIso(viewYear, viewMonth, 1)).getDay();
  const yearRange = Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearRangeStart + i);

  // ── actions ──────────────────────────────────────────────────────────────
  function toggleOpen() {
    setMode("day");
    setOpen((o) => !o);
  }

  function prevMonth() {
    if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(day: number) {
    onChange(bsToAdIso(viewYear, viewMonth, day));
    setOpen(false);
    setMode("day");
  }

  function goToday() {
    const t = todayBs();
    setViewYear(t.year); setViewMonth(t.month);
    onChange(bsToAdIso(t.year, t.month, t.day));
    setOpen(false); setMode("day");
  }

  function selectMonth(m: number) {
    setViewMonth(m);
    setMode("day");
  }

  function selectYear(y: number) {
    setViewYear(y);
    setYearRangeStart(y - 5);
    setMode("month");           // drill down: year → month → day
  }

  function openYearPicker() {
    setYearRangeStart(viewYear - 5);
    setMode("year");
  }

  // ── display text on the trigger button ───────────────────────────────────
  const displayText = value
    ? `${selected.year} ${NEPALI_MONTHS_EN[selected.month - 1]} ${selected.day}`
    : (placeholder ?? "Select date");

  const dropdownCls = [
    "absolute z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-3 max-w-[calc(100vw-1rem)]",
    above ? "bottom-full mb-1" : "top-full mt-1",
    alignRight ? "right-0" : "left-0",
  ].join(" ");

  return (
    <div className="relative" ref={wrapperRef}>
      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full flex items-center justify-between gap-2 rounded border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>{displayText}</span>
        <CalendarIcon />
      </button>

      {open && (
        <div className={dropdownCls} style={{ width: "272px" }}>

          {/* ══ DAY VIEW ══ */}
          {mode === "day" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={prevMonth} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronLeftIcon />
                </button>

                {/* Clickable month + year — open their pickers */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setMode("month")}
                    className="px-2 py-0.5 rounded text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    {NEPALI_MONTHS_EN[viewMonth - 1]}
                  </button>
                  <button
                    type="button"
                    onClick={openYearPicker}
                    className="px-2 py-0.5 rounded text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                  >
                    {viewYear}
                  </button>
                </div>

                <button type="button" onClick={nextMonth} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronRightIcon />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {Array.from({ length: firstDow }, (_, i) => <div key={`blank-${i}`} />)}
                {Array.from({ length: totalDays }, (_, i) => {
                  const day = i + 1;
                  const isSelected = selected.year === viewYear && selected.month === viewMonth && selected.day === day;
                  const isToday = today.year === viewYear && today.month === viewMonth && today.day === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => selectDay(day)}
                      className={[
                        "text-center text-sm py-1.5 rounded transition-colors",
                        isSelected ? "bg-blue-600 text-white font-semibold" :
                        isToday   ? "bg-blue-50 text-blue-700 font-semibold" :
                                    "text-slate-700 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
                <button type="button" onClick={goToday} className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  Today
                </button>
              </div>
            </>
          )}

          {/* ══ MONTH VIEW ══ */}
          {mode === "month" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={() => setViewYear((y) => y - 1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  onClick={openYearPicker}
                  className="px-2 py-0.5 rounded text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  {viewYear}
                </button>
                <button type="button" onClick={() => setViewYear((y) => y + 1)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronRightIcon />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {NEPALI_MONTHS_EN.map((name, i) => {
                  const m = i + 1;
                  const isActive = m === viewMonth;
                  const isSelected = m === selected.month && viewYear === selected.year;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectMonth(m)}
                      className={[
                        "py-2 rounded text-sm font-medium transition-colors",
                        isSelected ? "bg-blue-600 text-white" :
                        isActive   ? "bg-blue-50 text-blue-700" :
                                     "text-slate-700 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
                <button type="button" onClick={() => setMode("day")} className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
                  ← Back
                </button>
              </div>
            </>
          )}

          {/* ══ YEAR VIEW ══ */}
          {mode === "year" && (
            <>
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() => setYearRangeStart((s) => s - YEARS_PER_PAGE)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <ChevronLeftIcon />
                </button>
                <span className="text-sm font-semibold text-slate-800 select-none">
                  {yearRange[0]} – {yearRange[yearRange.length - 1]}
                </span>
                <button
                  type="button"
                  onClick={() => setYearRangeStart((s) => s + YEARS_PER_PAGE)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition-colors"
                >
                  <ChevronRightIcon />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {yearRange.map((y) => {
                  const isCurrent = y === viewYear;
                  const isSelected = y === selected.year;
                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => selectYear(y)}
                      className={[
                        "py-2 rounded text-sm font-medium transition-colors",
                        isSelected ? "bg-blue-600 text-white" :
                        isCurrent  ? "bg-blue-50 text-blue-700" :
                                     "text-slate-700 hover:bg-slate-100",
                      ].join(" ")}
                    >
                      {y}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
                <button type="button" onClick={() => setMode("month")} className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors">
                  ← Back
                </button>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 text-slate-400">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
