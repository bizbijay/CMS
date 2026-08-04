import NepaliDate from "nepali-date-converter";

export const NEPALI_MONTHS_EN = [
  "Baishakh", "Jestha", "Ashadh", "Shrawan",
  "Bhadra", "Ashwin", "Kartik", "Mangsir",
  "Poush", "Magh", "Falgun", "Chaitra",
] as const;

export const NEPALI_MONTHS_NP = [
  "बैशाख", "जेठ", "असार", "साउन",
  "भदौ", "असोज", "कार्तिक", "मंसिर",
  "पुष", "माघ", "फागुन", "चैत",
] as const;

export function getCurrentBSDate(): { year: number; month: number } {
  const d = new NepaliDate();
  return { year: d.getYear(), month: d.getMonth() + 1 }; // month is 1-indexed
}

export function getBSYearOptions(count = 7): number[] {
  const { year } = getCurrentBSDate();
  return Array.from({ length: count }, (_, i) => year - 3 + i);
}

function bsIso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Convert an AD ISO date string (YYYY-MM-DD) to a BS {year, month, day} object. */
export function adToBS(isoAd: string): { year: number; month: number; day: number } {
  const nd = new NepaliDate(new Date(isoAd));
  return { year: nd.getYear(), month: nd.getMonth() + 1, day: nd.getDate() };
}

/** Convert a BS date (1-indexed month) to an AD ISO string (YYYY-MM-DD). */
export function bsToAdIso(year: number, month: number, day: number): string {
  const nd = new NepaliDate(bsIso(year, month, day));
  const ad = nd.toJsDate();
  return `${ad.getFullYear()}-${String(ad.getMonth() + 1).padStart(2, "0")}-${String(ad.getDate()).padStart(2, "0")}`;
}

/** Return the number of days in a given BS year/month (1-indexed month). */
export function getDaysInBSMonth(year: number, month: number): number {
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const adDate = new NepaliDate(bsIso(nextYear, nextMonth, 1)).toJsDate();
  adDate.setDate(adDate.getDate() - 1);
  return new NepaliDate(adDate).getDate();
}

/** Format an AD ISO date string as a human-readable BS date, e.g. "2082 Baishakh 15" or "२०८२ बैशाख १५". */
export function formatBSDate(isoAd: string, locale: "en" | "np" = "en"): string {
  try {
    const { year, month, day } = adToBS(isoAd);
    const monthName = locale === "np" ? NEPALI_MONTHS_NP[month - 1] : NEPALI_MONTHS_EN[month - 1];
    return `${year} ${monthName} ${day}`;
  } catch {
    return isoAd;
  }
}
