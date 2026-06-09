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
