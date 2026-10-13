"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { createEmptyCard, fsrs, type Grade, State } from "ts-fsrs";
import type { Kanji, KanjiIndex } from "./data";
import { db, type ExerciseKind, type StudyCard } from "./db";

export const RETENTION = 0.9;
export const scheduler = fsrs({
  request_retention: RETENTION,
  enable_fuzz: true,
});

/** A card counts as mastered after graduating to a 3-week interval (or being stamped). */
const MASTERED_INTERVAL = 21;

export type Status = "new" | "learning" | "review" | "mastered";

export function statusOf(
  card: StudyCard | undefined,
  now = new Date(),
): Status {
  if (!card) return "new";
  if (card.state !== State.New && card.due <= now && !card.mastered)
    return "review";
  if (
    card.mastered ||
    (card.state === State.Review && card.scheduled_days >= MASTERED_INTERVAL)
  )
    return "mastered";
  return "learning";
}

/** 0–1 progress towards mastery, for the thin bar on learning cards. */
export const progressOf = (card: StudyCard | undefined) =>
  card ? Math.min(1, Math.max(0.08, card.stability / MASTERED_INTERVAL)) : 0;

export function useCards() {
  return useLiveQuery(
    async () => new Map((await db.cards.toArray()).map((c) => [c.k, c])),
    [],
    undefined,
  );
}

export function newCard(k: string, now = new Date()): StudyCard {
  return { ...createEmptyCard(now), k, addedAt: now, mastered: 0 };
}

export async function addToStudy(k: string) {
  const existing = await db.cards.get(k);
  if (existing) return false;
  await db.cards.put(newCard(k));
  return true;
}

export async function setMastered(k: string, mastered: boolean) {
  const now = new Date();
  const card = (await db.cards.get(k)) ?? newCard(k, now);
  await db.cards.put({
    ...card,
    mastered: mastered ? 1 : 0,
    masteredAt: mastered ? now : undefined,
  });
}

/** Preview the next interval (in days) for each of the four grades. */
export function previewIntervals(
  card: StudyCard | undefined,
  now = new Date(),
): number[] {
  const c = card ?? newCard("", now);
  const p = scheduler.repeat(c, now);
  return ([1, 2, 3, 4] as Grade[]).map(
    (g) => (p[g].card.due.getTime() - now.getTime()) / 864e5,
  );
}

export async function gradeCard(
  k: string,
  rating: Grade,
  info: { kind: ExerciseKind; ok: boolean; score?: number },
) {
  const now = new Date();
  const card = (await db.cards.get(k)) ?? newCard(k, now);
  const next = scheduler.next(card, now, rating).card;
  const graduated =
    next.state === State.Review && next.scheduled_days >= MASTERED_INTERVAL;
  await db.transaction("rw", [db.cards, db.reviews], async () => {
    await db.cards.put({
      ...card,
      ...next,
      k,
      mastered: card.mastered || (graduated ? 1 : 0),
      masteredAt: card.masteredAt ?? (graduated ? now : undefined),
    });
    await db.reviews.add({
      k,
      at: now,
      rating: rating as 1 | 2 | 3 | 4,
      kind: info.kind,
      ok: info.ok,
      score: info.score,
      prevState: card.state,
    });
  });
}

export function fmtInterval(d: number) {
  if (d < 1 / 24) return `${Math.max(1, Math.round(d * 1440))} min`;
  if (d < 1) return `${Math.round(d * 24)} h`;
  if (d < 30) return `${Math.round(d)} d`;
  if (d < 365)
    return `${(d / 30).toFixed(1).replace(".", ",").replace(",0", "")} m`;
  return `${(d / 365).toFixed(1).replace(".", ",")} a`;
}

export const startOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export type QueueItem = { k: string; isNew: boolean };

/**
 * Today's queue: due reviews first (most overdue first), then new kanji — the ones the user
 * added explicitly, then the next ones along the path (kana first when enabled, then Jōyō).
 */
export function buildQueue(
  index: KanjiIndex,
  cards: Map<string, StudyCard>,
  opts: {
    dailyGoal: number;
    newPerDay: number;
    newToday: number;
    kanaFirst?: boolean;
  },
  now = new Date(),
): QueueItem[] {
  const all = [...cards.values()];
  const due = all
    .filter((c) => c.state !== State.New && c.due <= now)
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, Math.max(opts.dailyGoal, 10))
    .map((c) => ({ k: c.k, isNew: false }));

  const kanaLeft = opts.kanaFirst && index.kana.some((k) => !cards.has(k.k));
  // kana are lighter than kanji, so the daily quota doubles while learning them
  const newSlots = Math.max(
    0,
    opts.newPerDay * (kanaLeft ? 2 : 1) - opts.newToday,
  );
  const added = all
    .filter((c) => c.state === State.New && !c.mastered)
    .sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime())
    .map((c) => c.k);
  const path: string[] = [];
  for (const k of opts.kanaFirst
    ? [...index.kana, ...index.jouyou]
    : index.jouyou) {
    if (added.length + path.length >= newSlots) break;
    if (!cards.has(k.k)) path.push(k.k);
  }
  const fresh = [...added, ...path]
    .slice(0, newSlots)
    .map((k) => ({ k, isNew: true }));

  // interleave so new kanji don't all land at the end
  const out: QueueItem[] = [];
  const step = fresh.length
    ? Math.max(1, Math.floor(due.length / fresh.length))
    : 0;
  let f = 0;
  due.forEach((d, i) => {
    out.push(d);
    if (step && (i + 1) % step === 0 && f < fresh.length) out.push(fresh[f++]);
  });
  while (f < fresh.length) out.push(fresh[f++]);
  return out;
}

export function countNewToday(
  reviews: { at: Date; prevState: number }[],
  now = new Date(),
) {
  const s = startOfDay(now);
  return reviews.filter((r) => r.at >= s && r.prevState === State.New).length;
}

/** Distractors for multiple choice: look-alikes first, then same grade with similar stroke count. */
export function distractors(target: Kanji, index: KanjiIndex, n = 3): Kanji[] {
  const out: Kanji[] = [];
  const seen = new Set([target.k]);
  const push = (k?: Kanji) => {
    if (k && !seen.has(k.k) && out.length < n) {
      seen.add(k.k);
      out.push(k);
    }
  };
  for (const c of [...target.lk]) push(index.by.get(c));
  const pool = index.list
    .filter(
      (k) =>
        k.g === target.g && Math.abs(k.s - target.s) <= 3 && !seen.has(k.k),
    )
    .sort(() => Math.random() - 0.5);
  for (const k of pool) push(k);
  for (const k of [...index.jouyou].sort(() => Math.random() - 0.5)) push(k);
  return out;
}
