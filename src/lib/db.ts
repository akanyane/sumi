"use client";

import Dexie, { type EntityTable } from "dexie";
import type { Card } from "ts-fsrs";

/** FSRS card for one kanji, plus our own bookkeeping. */
export type StudyCard = Card & {
  k: string;
  addedAt: Date;
  /** manually stamped as mastered (or graduated) */
  mastered: 0 | 1;
  masteredAt?: Date;
};

export type ExerciseKind =
  | "meaning"
  | "reading"
  | "pick"
  | "audio"
  | "flip"
  | "build"
  | "write";

export type ReviewEntry = {
  id?: number;
  k: string;
  at: Date;
  /** 1 Again · 2 Hard · 3 Good · 4 Easy */
  rating: 1 | 2 | 3 | 4;
  kind: ExerciseKind;
  ok: boolean;
  /** writing accuracy, 0–100 */
  score?: number;
  /** card state before this review (0 New, 1 Learning, 2 Review, 3 Relearning) */
  prevState: number;
};

export type Note = { k: string; text: string; updatedAt: Date };
export type Recent = { k: string; at: Date };
export type Meta = { key: string; value: unknown };

class SumiDB extends Dexie {
  cards!: EntityTable<StudyCard, "k">;
  reviews!: EntityTable<ReviewEntry, "id">;
  notes!: EntityTable<Note, "k">;
  recents!: EntityTable<Recent, "k">;
  meta!: EntityTable<Meta, "key">;

  constructor() {
    super("sumi");
    this.version(1).stores({
      cards: "k, due, state, mastered, addedAt",
      reviews: "++id, k, at",
      notes: "k",
      recents: "k, at",
      meta: "key",
    });
  }
}

export const db = new SumiDB();

export async function getMeta<T>(key: string, fallback: T): Promise<T> {
  const row = await db.meta.get(key);
  return (row?.value as T) ?? fallback;
}

export const setMeta = (key: string, value: unknown) =>
  db.meta.put({ key, value });

export async function touchRecent(k: string) {
  await db.recents.put({ k, at: new Date() });
  const all = await db.recents.orderBy("at").reverse().toArray();
  if (all.length > 12)
    await db.recents.bulkDelete(all.slice(12).map((r) => r.k));
}

// ---------- export / import ----------
const reviveDates = (o: Record<string, unknown>) => {
  for (const [key, v] of Object.entries(o))
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v))
      o[key] = new Date(v);
  return o;
};

export async function exportAll(settings: unknown) {
  const [cards, reviews, notes, recents, meta] = await Promise.all([
    db.cards.toArray(),
    db.reviews.toArray(),
    db.notes.toArray(),
    db.recents.toArray(),
    db.meta.toArray(),
  ]);
  return {
    app: "sumi",
    version: 1,
    exportedAt: new Date(),
    settings,
    cards,
    reviews,
    notes,
    recents,
    meta,
  };
}

export async function importAll(data: {
  app?: string;
  cards?: StudyCard[];
  reviews?: ReviewEntry[];
  notes?: Note[];
  recents?: Recent[];
  meta?: Meta[];
}) {
  if (data.app !== "sumi") throw new Error("Arquivo não é um backup do Sumi.");
  await db.transaction(
    "rw",
    [db.cards, db.reviews, db.notes, db.recents, db.meta],
    async () => {
      await Promise.all([
        db.cards.clear(),
        db.reviews.clear(),
        db.notes.clear(),
        db.recents.clear(),
        db.meta.clear(),
      ]);
      const revive = <T>(rows: T[] = []) =>
        rows.map(
          (r) =>
            reviveDates({ ...(r as object) } as Record<string, unknown>) as T,
        );
      await db.cards.bulkPut(revive(data.cards));
      await db.reviews.bulkPut(revive(data.reviews));
      await db.notes.bulkPut(revive(data.notes));
      await db.recents.bulkPut(revive(data.recents));
      await db.meta.bulkPut(revive(data.meta));
    },
  );
}

export async function resetAll() {
  await Promise.all([
    db.cards.clear(),
    db.reviews.clear(),
    db.notes.clear(),
    db.recents.clear(),
    db.meta.clear(),
  ]);
}
