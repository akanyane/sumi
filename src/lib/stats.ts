"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { State } from "ts-fsrs";
import { db, getMeta, type ReviewEntry, type StudyCard, setMeta } from "./db";
import { startOfDay } from "./srs";

export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export type Freezes = { available: number; days: string[] };
const DEFAULT_FREEZES: Freezes = { available: 2, days: [] };

export function useReviews() {
  return useLiveQuery(() => db.reviews.orderBy("at").toArray(), [], undefined);
}

export function useFreezes() {
  return useLiveQuery(
    () => getMeta<Freezes>("freezes", DEFAULT_FREEZES),
    [],
    DEFAULT_FREEZES,
  );
}

export async function toggleFreezeTomorrow() {
  const f = await getMeta<Freezes>("freezes", DEFAULT_FREEZES);
  const t = dayKey(addDays(new Date(), 1));
  if (f.days.includes(t))
    await setMeta("freezes", {
      available: f.available + 1,
      days: f.days.filter((d) => d !== t),
    });
  else if (f.available > 0)
    await setMeta("freezes", {
      available: f.available - 1,
      days: [...f.days, t],
    });
  else return false;
  return true;
}

export const isTomorrowFrozen = (f: Freezes) =>
  f.days.includes(dayKey(addDays(new Date(), 1)));

export function countsByDay(reviews: ReviewEntry[]) {
  const m = new Map<string, number>();
  for (const r of reviews) m.set(dayKey(r.at), (m.get(dayKey(r.at)) ?? 0) + 1);
  return m;
}

/** Consecutive days with reviews (or frozen), ending today — or yesterday if today is still open. */
export function streak(
  byDay: Map<string, number>,
  frozen: string[],
  now = new Date(),
) {
  const ok = (d: Date) =>
    (byDay.get(dayKey(d)) ?? 0) > 0 || frozen.includes(dayKey(d));
  let d = startOfDay(now);
  if (!ok(d)) d = addDays(d, -1);
  let n = 0;
  while (ok(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export type HeatCell = {
  key: string;
  date: Date;
  count: number;
  level: number;
  frozen: boolean;
};

/** 53 weeks × 7 days, columns = weeks, ending at today's week. */
export function heatmap(
  byDay: Map<string, number>,
  frozen: string[],
  now = new Date(),
) {
  const today = startOfDay(now);
  const start = addDays(today, -(52 * 7 + today.getDay()));
  const cells: HeatCell[] = [];
  const months: { label: string; col: number }[] = [];
  const MN = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];
  let lastMonth = -1;
  const max = Math.max(1, ...byDay.values());
  for (let i = 0; addDays(start, i) <= today; i++) {
    const date = addDays(start, i);
    const key = dayKey(date);
    const count = byDay.get(key) ?? 0;
    const level =
      count === 0 ? 0 : Math.min(4, 1 + Math.floor((count / max) * 3.999));
    cells.push({
      key,
      date,
      count,
      level,
      frozen: frozen.includes(key) && count === 0,
    });
    const col = Math.floor(i / 7);
    if (date.getMonth() !== lastMonth && date.getDate() <= 7) {
      months.push({ label: MN[date.getMonth()], col: col + 1 });
      lastMonth = date.getMonth();
    }
  }
  return { cells, months };
}

/** Share of reviews of mature cards (state Review) answered correctly in the last 30 days. */
export function retention30(reviews: ReviewEntry[], now = new Date()) {
  const since = addDays(now, -30);
  const rel = reviews.filter(
    (r) => r.at >= since && r.prevState === State.Review,
  );
  if (!rel.length) return null;
  return (rel.filter((r) => r.rating > 1).length / rel.length) * 100;
}

/** Number of cards due on each of the next `days` days (starting tomorrow). */
export function forecast(cards: StudyCard[], days: number, now = new Date()) {
  const start = addDays(startOfDay(now), 1);
  return Array.from({ length: days }, (_, i) => {
    const from = addDays(start, i);
    const to = addDays(start, i + 1);
    return {
      date: from,
      count: cards.filter(
        (c) => c.state !== State.New && c.due >= from && c.due < to,
      ).length,
    };
  });
}

export function reviewsToday(reviews: ReviewEntry[], now = new Date()) {
  const s = startOfDay(now);
  return reviews.filter((r) => r.at >= s).length;
}
