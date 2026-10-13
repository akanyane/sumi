import {
  type Kanji,
  type KanjiIndex,
  meaningOf,
  type StrokeData,
  type Word,
} from "@/lib/data";
import type { ExerciseKind, StudyCard } from "@/lib/db";
import { cleanReading, romaji } from "@/lib/kana";
import { distractors, type QueueItem } from "@/lib/srs";

export type Option = { l: string; sub: string; k: string };

export type Item =
  | {
      type: "mc";
      mode: "meaning" | "reading" | "pick" | "audio";
      k: string;
      label: string;
      q: string;
      qsub?: string;
      opts: Option[];
      ans: number;
      isNew: boolean;
    }
  | { type: "flip"; k: string; label: string; word?: Word; isNew: boolean }
  | {
      type: "build";
      k: string;
      label: string;
      target: string[];
      tiles: string[];
      gloss: string;
      reading: string;
      isNew: boolean;
    }
  | { type: "write"; k: string; label: string; isNew: boolean };

export const kindOf = (it: Item): ExerciseKind =>
  it.type === "mc" ? it.mode : it.type;

const shuffle = <T>(a: T[]) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

function withAnswer(right: Option, wrong: Option[]) {
  const opts = shuffle([right, ...wrong]);
  return { opts, ans: opts.indexOf(right) };
}

function meaningItem(k: Kanji, index: KanjiIndex, isNew: boolean): Item {
  const right = { l: meaningOf(k), sub: k.k, k: k.k };
  const seen = new Set([right.l]);
  const wrong = distractors(k, index, 6)
    .map((d) => ({ l: meaningOf(d), sub: d.k, k: d.k }))
    .filter((o) => !seen.has(o.l) && seen.add(o.l))
    .slice(0, 3);
  return {
    type: "mc",
    mode: "meaning",
    k: k.k,
    label: "Kanji → significado",
    q: "O que significa?",
    ...withAnswer(right, wrong),
    isNew,
  };
}

function readingItem(k: Kanji, index: KanjiIndex, isNew: boolean): Item | null {
  const useOn = k.on.length > 0;
  const pick = (x: Kanji) =>
    useOn ? x.on[0] : x.kun[0] && cleanReading(x.kun[0]);
  const r = pick(k);
  if (!r) return null;
  const right = { l: r, sub: romaji(r), k: k.k };
  const own = new Set([...k.on, ...k.kun.map(cleanReading)]);
  const seen = new Set([r]);
  const wrong = distractors(k, index, 10)
    .map((d) => ({
      l: pick(d) ?? "",
      sub: `${romaji(pick(d) ?? "")} · ${d.k}`,
      k: d.k,
    }))
    .filter((o) => o.l && !own.has(o.l) && !seen.has(o.l) && seen.add(o.l))
    .slice(0, 3);
  if (wrong.length < 3) return null;
  return {
    type: "mc",
    mode: "reading",
    k: k.k,
    label: "Kanji → leitura",
    q: useOn ? "Qual é o on'yomi?" : "Qual é o kun'yomi?",
    ...withAnswer(right, wrong),
    isNew,
  };
}

function pickItem(k: Kanji, index: KanjiIndex, isNew: boolean): Item {
  const right = { l: k.k, sub: meaningOf(k), k: k.k };
  const wrong = distractors(k, index).map((d) => ({
    l: d.k,
    sub: meaningOf(d),
    k: d.k,
  }));
  return {
    type: "mc",
    mode: "pick",
    k: k.k,
    label: "Significado → kanji",
    q: meaningOf(k),
    qsub: k.m.slice(0, 2).join(" · "),
    ...withAnswer(right, wrong),
    isNew,
  };
}

function audioItem(
  k: Kanji,
  index: KanjiIndex,
  words: Word[],
  isNew: boolean,
): Item | null {
  // a word that is just this kanji, so the sound identifies it unambiguously
  const solo = words.find((w) => w.w === k.k);
  const reading = solo?.r ?? (k.kun[0] ? cleanReading(k.kun[0]) : null);
  if (!reading) return null;
  const right = { l: k.k, sub: meaningOf(k), k: k.k };
  const wrong = distractors(k, index)
    .filter((d) => ![...d.on, ...d.kun.map(cleanReading)].includes(reading))
    .map((d) => ({ l: d.k, sub: meaningOf(d), k: d.k }));
  if (wrong.length < 3) return null;
  return {
    type: "mc",
    mode: "audio",
    k: k.k,
    label: "Áudio → kanji",
    q: reading,
    ...withAnswer(right, wrong),
    isNew,
  };
}

function buildItem(
  k: Kanji,
  index: KanjiIndex,
  words: Word[],
  isNew: boolean,
): Item | null {
  const w = words.find((x) => {
    const chars = [...x.w];
    return (
      chars.length >= 2 &&
      chars.length <= 3 &&
      chars.every((c) => index.by.has(c)) &&
      new Set(chars).size === chars.length
    );
  });
  if (!w) return null;
  const target = [...w.w];
  const extra = new Set<string>();
  for (const c of target)
    for (const d of distractors(index.by.get(c) as Kanji, index, 2))
      if (!target.includes(d.k)) extra.add(d.k);
  const tiles = shuffle([
    ...target,
    ...shuffle([...extra]).slice(0, 6 - target.length),
  ]);
  if (tiles.length < 4) return null;
  return {
    type: "build",
    k: k.k,
    label: "Montar palavra",
    target,
    tiles,
    gloss: w.g.split(";")[0],
    reading: w.r,
    isNew,
  };
}

/** One exercise per queue entry, varying the kind so the session doesn't feel repetitive. */
export function makeItems(
  queue: QueueItem[],
  index: KanjiIndex,
  cards: Map<string, StudyCard>,
  strokes: Map<string, StrokeData | undefined>,
): Item[] {
  let last = "";
  return queue.map(({ k: ch, isNew }) => {
    const k = index.by.get(ch) as Kanji;
    const data = strokes.get(ch);
    const words = data?.w ?? [];
    if (isNew) {
      last = "flip";
      return {
        type: "flip",
        k: ch,
        label: "Kanji novo",
        word: words[0],
        isNew,
      } as Item;
    }
    const reps = cards.get(ch)?.reps ?? 0;
    const pool: (() => Item | null)[] = [
      () => meaningItem(k, index, isNew),
      () => readingItem(k, index, isNew),
      () => pickItem(k, index, isNew),
      () => audioItem(k, index, words, isNew),
      () => buildItem(k, index, words, isNew),
    ];
    if (data?.p.length && k.s <= 14 && reps >= 1)
      pool.push(() => ({
        type: "write",
        k: ch,
        label: "Praticar escrita",
        isNew,
      }));
    if (reps >= 3)
      pool.push(() => ({
        type: "flip",
        k: ch,
        label: "Cartão de revisão",
        word: words[0],
        isNew,
      }));
    const tries = shuffle(pool);
    for (const t of tries) {
      const it = t();
      if (it && (it.type === "mc" ? it.mode : it.type) !== last) {
        last = it.type === "mc" ? it.mode : it.type;
        return it;
      }
    }
    last = "meaning";
    return meaningItem(k, index, isNew);
  });
}
