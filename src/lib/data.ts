"use client";

import { useQuery } from "@tanstack/react-query";
import { PT, RADICAL_PT } from "./pt";

/** One entry of public/data/kanji.json (see scripts/build-data.ts). */
export type Kanji = {
  k: string;
  g: number | null;
  s: number;
  m: string[];
  on: string[];
  kun: string[];
  j: number | null;
  u: string;
  f: number | null;
  /** top-level KanjiVG components */
  c: string[];
  /** radical element */
  r: string | null;
  /** siblings: same on'yomi / same radical / look-alikes (strings of kanji) */
  so: string;
  sr: string;
  lk: string;
  sv: 0 | 1;
  /** position in the index (grade, then frequency) */
  i: number;
};

export type Word = { w: string; r: string; g: string };
export type StrokeData = {
  p: string[];
  n: [number, number][];
  w: Word[];
  wt: number;
};

export type KanjiIndex = {
  list: Kanji[];
  by: Map<string, Kanji>;
  jouyou: Kanji[];
  kanjivg: string;
};

async function loadIndex(): Promise<KanjiIndex> {
  const res = await fetch("/data/kanji.json");
  if (!res.ok) throw new Error(`kanji.json ${res.status}`);
  const raw = (await res.json()) as {
    list: Omit<Kanji, "i">[];
    kanjivg: string;
  };
  const list = raw.list.map((k, i) => ({ ...k, i }) as Kanji);
  return {
    list,
    by: new Map(list.map((k) => [k.k, k])),
    jouyou: list.filter((k) => k.g !== null && k.g <= 8),
    kanjivg: raw.kanjivg,
  };
}

export function useKanjiIndex() {
  return useQuery({
    queryKey: ["index"],
    queryFn: loadIndex,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export const hexOf = (k: string) =>
  (k.codePointAt(0) ?? 0).toString(16).padStart(5, "0");

// ---------- strokes + words ----------
const KANJIAPI = "https://kanjiapi.dev/v1";
const KANJIVG_CDN = "https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji";

type ApiWord = {
  meanings: { glosses: string[] }[];
  variants: { priorities: string[]; pronounced: string; written: string }[];
};

/** Parse a KanjiVG SVG in the browser (fallback for kanji outside the bundled dataset). */
function parseKanjiVG(svg: string): Pick<StrokeData, "p" | "n"> {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const p = [...doc.querySelectorAll("path")].map(
    (e) => e.getAttribute("d") ?? "",
  );
  const n = [...doc.querySelectorAll("text")].map((t) => {
    const m = /matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)/.exec(
      t.getAttribute("transform") ?? "",
    );
    return (m ? [Number(m[1]), Number(m[2])] : [0, 0]) as [number, number];
  });
  return { p, n };
}

async function loadStrokes(k: string, bundled: boolean): Promise<StrokeData> {
  if (bundled) {
    const res = await fetch(
      `/data/k/${(k.codePointAt(0) ?? 0).toString(16)}.json`,
    );
    if (res.ok) return res.json();
  }
  const [svg, words] = await Promise.all([
    fetch(`${KANJIVG_CDN}/${hexOf(k)}.svg`).then((r) =>
      r.ok ? r.text() : null,
    ),
    fetch(`${KANJIAPI}/words/${encodeURIComponent(k)}`)
      .then((r) => (r.ok ? (r.json() as Promise<ApiWord[]>) : []))
      .catch(() => [] as ApiWord[]),
  ]);
  const strokes = svg ? parseKanjiVG(svg) : { p: [], n: [] };
  const w = words
    .filter((x) =>
      x.variants.some((v) =>
        v.priorities.some((p) => /^(ichi1|news1)$/.test(p)),
      ),
    )
    .map((x) => ({
      w: x.variants[0].written,
      r: x.variants[0].pronounced,
      g: x.meanings[0]?.glosses.slice(0, 2).join("; ") ?? "",
    }))
    .filter((x) => x.w.length <= 4)
    .slice(0, 10);
  return { ...strokes, w, wt: words.length };
}

export function strokesQuery(k: string, bundled: boolean) {
  return {
    queryKey: ["strokes", k],
    queryFn: () => loadStrokes(k, bundled),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  } as const;
}

export function useStrokes(k: string | undefined, bundled = true) {
  return useQuery({ ...strokesQuery(k ?? "", bundled), enabled: !!k });
}

/** Metadata for a kanji outside the bundled Jōyō/Jinmeiyō set. */
export function useRemoteKanji(k: string, enabled: boolean) {
  return useQuery({
    queryKey: ["remote-kanji", k],
    enabled,
    staleTime: Infinity,
    retry: (n, err) =>
      !(err instanceof Error && err.message === "404") && n < 2,
    queryFn: async (): Promise<Kanji> => {
      const res = await fetch(`${KANJIAPI}/kanji/${encodeURIComponent(k)}`);
      if (!res.ok) throw new Error(String(res.status));
      const d = await res.json();
      return {
        k: d.kanji,
        g: d.grade,
        s: d.stroke_count,
        m: d.meanings,
        on: d.on_readings,
        kun: d.kun_readings,
        j: d.jlpt,
        u: d.unicode,
        f: d.freq_mainichi_shinbun,
        c: [],
        r: null,
        so: "",
        sr: "",
        lk: "",
        sv: 0,
        i: -1,
      };
    },
  });
}

// ---------- labels ----------
/** Portuguese meaning when we have one, English otherwise. */
export const meaningOf = (k: Kanji) => PT[k.k] ?? k.m.slice(0, 2).join(", ");
export const hasPt = (k: Kanji) => k.k in PT;

/** Name of a component; Portuguese only unless `allowEnglish` (then falls back to kanjiapi). */
export function componentName(
  c: string,
  index?: KanjiIndex,
  allowEnglish = true,
) {
  if (RADICAL_PT[c]) return RADICAL_PT[c];
  if (PT[c]) return PT[c].split(",")[0];
  const k = allowEnglish ? index?.by.get(c) : undefined;
  return k ? k.m[0] : "";
}

export const gradeLabel = (g: number | null) =>
  g === null ? "—" : g <= 6 ? `${g}º ano` : g === 8 ? "Sec." : "Jinmei";

export const statusLabel = {
  new: "novo",
  learning: "aprendendo",
  review: "revisar hoje",
  mastered: "dominado",
} as const;

export const pad = (n: number, l = 2) => String(n).padStart(l, "0");

// ---------- collections ----------
export type Collection = {
  id: string;
  label: string;
  ja: string;
  test: (k: Kanji) => boolean;
};

export const COLLECTIONS: Collection[] = [
  { id: "jlpt-n5", label: "JLPT N5", ja: "五級", test: (k) => k.j === 5 },
  { id: "jlpt-n4", label: "JLPT N4", ja: "四級", test: (k) => k.j === 4 },
  { id: "jlpt-n3", label: "JLPT N3", ja: "三級", test: (k) => k.j === 3 },
  { id: "jlpt-n2", label: "JLPT N2", ja: "二級", test: (k) => k.j === 2 },
  { id: "jlpt-n1", label: "JLPT N1", ja: "一級", test: (k) => k.j === 1 },
  { id: "grade-1", label: "Série 1", ja: "一年", test: (k) => k.g === 1 },
  { id: "grade-2", label: "Série 2", ja: "二年", test: (k) => k.g === 2 },
  { id: "grade-3", label: "Série 3", ja: "三年", test: (k) => k.g === 3 },
  { id: "grade-4", label: "Série 4", ja: "四年", test: (k) => k.g === 4 },
  { id: "grade-5", label: "Série 5", ja: "五年", test: (k) => k.g === 5 },
  { id: "grade-6", label: "Série 6", ja: "六年", test: (k) => k.g === 6 },
  { id: "grade-8", label: "Secundário", ja: "中学", test: (k) => k.g === 8 },
  {
    id: "jouyou",
    label: "Jōyō",
    ja: "常用",
    test: (k) => k.g !== null && k.g <= 8,
  },
  {
    id: "jinmeiyou",
    label: "Jinmeiyō",
    ja: "人名",
    test: (k) => k.g !== null && k.g >= 9,
  },
];

export const collectionById = (id: string) =>
  COLLECTIONS.find((c) => c.id === id);

export const collectionHref = (id: string) => `/${id}`;

export function collectionOf(k: Kanji): Collection {
  if (k.g !== null && k.g <= 6)
    return COLLECTIONS.find((c) => c.id === `grade-${k.g}`) as Collection;
  if (k.g === 8) return collectionById("grade-8") as Collection;
  return collectionById("jinmeiyou") as Collection;
}
