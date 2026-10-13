const DIGITS = "〇一二三四五六七八九";

/** 1–99 in kanji numerals (十, 二十三…). */
export function kanjiNumber(n: number): string {
  if (n < 10) return DIGITS[n];
  const t = Math.floor(n / 10);
  const u = n % 10;
  return `${t > 1 ? DIGITS[t] : ""}十${u ? DIGITS[u] : ""}`;
}

const WEEK_JA = ["日", "月", "火", "水", "木", "金", "土"];
const WEEK_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_PT = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

/** "SEG · 12 OUT 2026" */
export const datePt = (d: Date) =>
  `${WEEK_PT[d.getDay()]} · ${String(d.getDate()).padStart(2, "0")} ${MONTH_PT[d.getMonth()]} ${d.getFullYear()}`;

/** "令和八年 十月十二日 月曜日" */
export const dateJa = (d: Date) =>
  `令和${kanjiNumber(d.getFullYear() - 2018)}年 ${kanjiNumber(d.getMonth() + 1)}月${kanjiNumber(d.getDate())}日 ${WEEK_JA[d.getDay()]}曜日`;

/** Days since epoch in local time — used to rotate the kanji of the day. */
export const dayNumber = (d = new Date()) =>
  Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
