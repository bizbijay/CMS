import { useEffect, useState } from "react";
import {
  adToBS,
  bsToAdIso,
  getDaysInBSMonth,
  getCurrentBSDate,
  NEPALI_MONTHS_EN,
} from "../utils/nepaliDate";

interface Props {
  value: string;       // ISO AD date string (YYYY-MM-DD) — stored/sent to API as AD
  onChange: (isoAd: string) => void;
  required?: boolean;
  className?: string;
}

function safeParseBs(isoAd: string) {
  try {
    return adToBS(isoAd);
  } catch {
    const { year, month } = getCurrentBSDate();
    return { year, month, day: 1 };
  }
}

export default function NepaliDatePicker({ value, onChange, required, className = "" }: Props) {
  const init = safeParseBs(value);
  const [bsYear, setBsYear] = useState(init.year);
  const [bsMonth, setBsMonth] = useState(init.month);
  const [bsDay, setBsDay] = useState(init.day);

  // Sync internal BS state when the parent changes value externally.
  useEffect(() => {
    const bs = safeParseBs(value);
    setBsYear(bs.year);
    setBsMonth(bs.month);
    setBsDay(bs.day);
  }, [value]);

  const { year: currentYear } = getCurrentBSDate();
  // 10-year window: 5 years back to 4 years forward, always includes the value's year.
  const baseYears = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  const years = baseYears.includes(bsYear) ? baseYears : [...baseYears, bsYear].sort((a, b) => a - b);

  const totalDays = getDaysInBSMonth(bsYear, bsMonth);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  function handleYear(y: number) {
    const maxDay = getDaysInBSMonth(y, bsMonth);
    const d = Math.min(bsDay, maxDay);
    setBsYear(y);
    setBsDay(d);
    onChange(bsToAdIso(y, bsMonth, d));
  }

  function handleMonth(m: number) {
    const maxDay = getDaysInBSMonth(bsYear, m);
    const d = Math.min(bsDay, maxDay);
    setBsMonth(m);
    setBsDay(d);
    onChange(bsToAdIso(bsYear, m, d));
  }

  function handleDay(d: number) {
    setBsDay(d);
    onChange(bsToAdIso(bsYear, bsMonth, d));
  }

  const sel = `rounded border border-slate-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${className}`;

  return (
    <div className="flex gap-2">
      <select
        value={bsYear}
        onChange={(e) => handleYear(Number(e.target.value))}
        required={required}
        className={`${sel} w-24`}
      >
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <select
        value={bsMonth}
        onChange={(e) => handleMonth(Number(e.target.value))}
        required={required}
        className={`${sel} flex-1`}
      >
        {NEPALI_MONTHS_EN.map((name, i) => (
          <option key={i + 1} value={i + 1}>{name}</option>
        ))}
      </select>
      <select
        value={bsDay}
        onChange={(e) => handleDay(Number(e.target.value))}
        required={required}
        className={`${sel} w-20`}
      >
        {days.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
  );
}
