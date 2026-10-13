/**
 * Builds the static dataset used by the app from two public sources:
 *   - kanjiapi.dev full dump (metadata + vocabulary)
 *   - KanjiVG (stroke paths, stroke-number positions, component tree) — CC BY-SA 3.0
 *
 * Outputs (committed):
 *   public/data/kanji.json      — compact index of every Jōyō + Jinmeiyō kanji
 *   public/data/k/{hex}.json    — per-kanji strokes, number positions and words
 *
 * Run with `bun run data`. Needs `unzip` on PATH; downloads are cached in .cache/.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const CACHE = join(ROOT, ".cache");
const OUT = join(ROOT, "public", "data");
const KANJIAPI_URL = "https://kanjiapi.dev/kanjiapi_full.zip";
const KANJIVG_RELEASE =
  "https://api.github.com/repos/KanjiVG/kanjivg/releases/latest";

type ApiKanji = {
  kanji: string;
  grade: number | null;
  stroke_count: number;
  meanings: string[];
  kun_readings: string[];
  on_readings: string[];
  name_readings: string[];
  jlpt: number | null;
  unicode: string;
  freq_mainichi_shinbun: number | null;
  heisig_en: string | null;
};
type ApiWord = {
  meanings: { glosses: string[] }[];
  variants: { priorities: string[]; pronounced: string; written: string }[];
};

async function download(url: string, file: string) {
  if (existsSync(file)) return;
  console.log(`↓ ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  await Bun.write(file, res);
}

function unzip(file: string, dir: string) {
  if (existsSync(dir)) return;
  mkdirSync(dir, { recursive: true });
  const r = Bun.spawnSync(["unzip", "-q", "-o", file, "-d", dir]);
  if (r.exitCode !== 0) throw new Error(`unzip failed: ${r.stderr.toString()}`);
}

// ---------- KanjiVG parsing ----------
type KvgGroup = {
  element?: string;
  radical?: string;
  children: KvgGroup[];
  strokes: number;
};
type Kvg = {
  paths: string[];
  nums: [number, number][];
  top: string[];
  all: string[];
  radical?: string;
};

function parseKvg(svg: string): Kvg {
  const paths: string[] = [];
  const nums: [number, number][] = [];
  const root: KvgGroup = { children: [], strokes: 0 };
  const stack: KvgGroup[] = [root];
  const tag = /<(\/?)(g|path|text)\b([^>]*?)(\/?)>([^<]*)/g;
  for (let m = tag.exec(svg); m; m = tag.exec(svg)) {
    const [, close, name, attrs, selfClose, text] = m;
    if (name === "g") {
      if (close) stack.pop();
      else {
        const g: KvgGroup = {
          element: /kvg:element="([^"]+)"/.exec(attrs)?.[1],
          radical: /kvg:radical="([^"]+)"/.exec(attrs)?.[1],
          children: [],
          strokes: 0,
        };
        stack[stack.length - 1].children.push(g);
        if (!selfClose) stack.push(g);
      }
    } else if (name === "path" && !close) {
      const d = /\sd="([^"]+)"/.exec(attrs)?.[1];
      if (d) {
        paths.push(d);
        for (const g of stack) g.strokes++;
      }
    } else if (name === "text" && !close) {
      const t = /matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)/.exec(attrs);
      if (t && /^\d+$/.test(text.trim()))
        nums[Number(text) - 1] = [Number(t[1]), Number(t[2])];
    }
  }
  // root → StrokePaths group → kanji group
  const kanjiGroup = root.children[0]?.children[0];
  const top: string[] = [];
  const all = new Set<string>();
  let radical: string | undefined;
  let radicalRank = 9;
  const rank = { general: 0, tradit: 1, nelson: 2 } as Record<string, number>;
  const walk = (g: KvgGroup, collectTop: boolean) => {
    for (const c of g.children) {
      if (c.element) all.add(c.element);
      if (c.radical && c.element && (rank[c.radical] ?? 3) < radicalRank) {
        radical = c.element;
        radicalRank = rank[c.radical] ?? 3;
      }
      if (collectTop && c.element) {
        if (!top.includes(c.element)) top.push(c.element);
        walk(c, false);
      } else walk(c, collectTop);
    }
  };
  if (kanjiGroup) walk(kanjiGroup, true);
  return { paths, nums, top, all: [...all], radical };
}

// ---------- main ----------
mkdirSync(CACHE, { recursive: true });
await download(KANJIAPI_URL, join(CACHE, "kanjiapi_full.zip"));
unzip(join(CACHE, "kanjiapi_full.zip"), join(CACHE, "kanjiapi"));

const release = (await (await fetch(KANJIVG_RELEASE)).json()) as {
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
};
const mainAsset = release.assets.find((a) => a.name.endsWith("-main.zip"));
if (!mainAsset) throw new Error("KanjiVG main.zip not found in latest release");
const kvgZip = join(CACHE, mainAsset.name);
await download(mainAsset.browser_download_url, kvgZip);
const kvgDir = join(CACHE, release.tag_name);
unzip(kvgZip, kvgDir);
const kvgKanjiDir = join(kvgDir, "kanji");

console.log("parsing kanjiapi dump…");
const dump = JSON.parse(
  readFileSync(join(CACHE, "kanjiapi", "kanjiapi_full.json"), "utf8"),
) as {
  kanjis: Record<string, ApiKanji>;
  words: Record<string, ApiWord[]>;
};

// Jōyō = grades 1–8, Jinmeiyō = grades 9–10
const selected = Object.values(dump.kanjis).filter((k) => k.grade !== null);
const gradeKey = (g: number) => (g === 10 ? 9 : g);
selected.sort(
  (a, b) =>
    gradeKey(a.grade ?? 99) - gradeKey(b.grade ?? 99) ||
    (a.freq_mainichi_shinbun ?? 9999) - (b.freq_mainichi_shinbun ?? 9999) ||
    a.stroke_count - b.stroke_count,
);
const inSet = new Set(selected.map((k) => k.kanji));

const PRIORITY = /^(ichi1|news1|spec1)$/;
function wordsFor(k: string) {
  const list = dump.words[k] ?? [];
  const scored = list
    .map((w) => {
      const v = w.variants.find((x) => x.written.includes(k)) ?? w.variants[0];
      const prio = v.priorities.filter((p) => PRIORITY.test(p)).length;
      return { v, prio, w };
    })
    .filter(
      (x) => x.prio > 0 && x.v.written.length <= 4 && x.v.written.length >= 1,
    )
    .sort(
      (a, b) =>
        b.prio - a.prio ||
        Number(b.v.priorities.includes("ichi1")) -
          Number(a.v.priorities.includes("ichi1")) ||
        a.v.written.length - b.v.written.length,
    );
  const seen = new Set<string>();
  const out: { w: string; r: string; g: string }[] = [];
  for (const { v, w } of scored) {
    if (seen.has(v.written)) continue;
    seen.add(v.written);
    out.push({
      w: v.written,
      r: v.pronounced,
      g: w.meanings[0]?.glosses.slice(0, 2).join("; ") ?? "",
    });
    if (out.length >= 10) break;
  }
  return { list: out, total: list.length };
}

console.log(`parsing KanjiVG for ${selected.length} kanji…`);
const kvg = new Map<string, Kvg>();
for (const k of selected) {
  const file = join(
    kvgKanjiDir,
    `${k.unicode.toLowerCase().padStart(5, "0")}.svg`,
  );
  if (existsSync(file)) kvg.set(k.kanji, parseKvg(readFileSync(file, "utf8")));
}

// indexes for siblings
const byOn = new Map<string, string[]>();
const byRadical = new Map<string, string[]>();
const byComponent = new Map<string, string[]>();
for (const k of selected) {
  for (const on of k.on_readings)
    byOn.set(on, [...(byOn.get(on) ?? []), k.kanji]);
  const v = kvg.get(k.kanji);
  if (v?.radical)
    byRadical.set(v.radical, [...(byRadical.get(v.radical) ?? []), k.kanji]);
  for (const c of v?.all ?? [])
    byComponent.set(c, [...(byComponent.get(c) ?? []), k.kanji]);
}
const freq = new Map(
  selected.map((k) => [k.kanji, k.freq_mainichi_shinbun ?? 9999]),
);
const strokes = new Map(selected.map((k) => [k.kanji, k.stroke_count]));
const byFreq = (a: string, b: string) =>
  (freq.get(a) ?? 9999) - (freq.get(b) ?? 9999);

function lookalikes(k: string): string[] {
  const own = new Set(kvg.get(k)?.all ?? []);
  const cand = new Set<string>();
  for (const c of own)
    for (const x of byComponent.get(c) ?? []) if (x !== k) cand.add(x);
  // kanji that contain this one, or that this one contains, look alike too
  for (const x of byComponent.get(k) ?? []) cand.add(x);
  for (const c of own) if (inSet.has(c) && c !== k) cand.add(c);
  const sk = strokes.get(k) ?? 0;
  return [...cand]
    .map((x) => {
      const other = new Set(kvg.get(x)?.all ?? []);
      const inter = [...own].filter((c) => other.has(c)).length;
      const union = new Set([...own, ...other]).size || 1;
      const contains = other.has(k) || own.has(x) ? 0.25 : 0;
      const score =
        inter / union + contains - Math.abs((strokes.get(x) ?? 0) - sk) * 0.04;
      return { x, score };
    })
    .filter((s) => s.score > 0.15)
    .sort((a, b) => b.score - a.score || byFreq(a.x, b.x))
    .slice(0, 5)
    .map((s) => s.x);
}

rmSync(join(OUT, "k"), { recursive: true, force: true });
mkdirSync(join(OUT, "k"), { recursive: true });

const index = selected.map((k) => {
  const v = kvg.get(k.kanji);
  const sameOn = [
    ...new Set(
      k.on_readings
        .flatMap((on) => byOn.get(on) ?? [])
        .filter((x) => x !== k.kanji),
    ),
  ]
    .sort(byFreq)
    .slice(0, 6);
  const sameRad = v?.radical
    ? (byRadical.get(v.radical) ?? [])
        .filter((x) => x !== k.kanji)
        .sort(byFreq)
        .slice(0, 6)
    : [];
  const words = wordsFor(k.kanji);
  if (v) {
    writeFileSync(
      join(OUT, "k", `${k.unicode.toLowerCase()}.json`),
      JSON.stringify({
        p: v.paths,
        n: v.nums.map(([x, y]) => [x, y]),
        w: words.list,
        wt: words.total,
      }),
    );
  }
  return {
    k: k.kanji,
    g: k.grade,
    s: k.stroke_count,
    m: k.meanings,
    on: k.on_readings,
    kun: k.kun_readings,
    j: k.jlpt,
    u: k.unicode,
    f: k.freq_mainichi_shinbun,
    c: v?.top ?? [],
    r: v?.radical ?? null,
    so: sameOn.join(""),
    sr: sameRad.join(""),
    lk: lookalikes(k.kanji).join(""),
    sv: v ? 1 : 0,
  };
});

writeFileSync(
  join(OUT, "kanji.json"),
  JSON.stringify({ v: 1, kanjivg: release.tag_name, list: index }),
);
const files = readdirSync(join(OUT, "k")).length;
console.log(
  `✓ ${index.length} kanji · ${files} stroke files · KanjiVG ${release.tag_name}`,
);
