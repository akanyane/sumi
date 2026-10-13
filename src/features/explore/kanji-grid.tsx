"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { type Kanji, meaningOf, pad, statusLabel } from "@/lib/data";
import type { StudyCard } from "@/lib/db";
import { cleanReading } from "@/lib/kana";
import { EASE, isReduced, springEasing } from "@/lib/motion";
import {
  type NavContext,
  pointer,
  setNavContext,
  vtName,
} from "@/lib/nav-context";
import { setSettings, useSettings } from "@/lib/settings";
import { progressOf, type Status, statusOf } from "@/lib/srs";
import { Enso, Hanko } from "@/ui/primitives";

type Density = "compact" | "comfortable" | "ficha";
type Filters = { jlpt: string; strokes: string; status: string; sort: string };
const EMPTY: Filters = {
  jlpt: "all",
  strokes: "all",
  status: "all",
  sort: "grade",
};

const strokeOk = (s: string, n: number) =>
  s === "all" ||
  (s === "1–4"
    ? n <= 4
    : s === "5–8"
      ? n >= 5 && n <= 8
      : s === "9–12"
        ? n >= 9 && n <= 12
        : n >= 13);

const PAGE = 180;

export function KanjiGrid({
  list,
  cards,
  context,
  title,
  n,
}: {
  list: Kanji[];
  cards: Map<string, StudyCard> | undefined;
  context: Omit<NavContext, "list">;
  title: string;
  n: string;
}) {
  const { density } = useSettings();
  const [f, setF] = useState<Filters>(EMPTY);
  const [limit, setLimit] = useState(PAGE);
  const now = useMemo(() => new Date(), []);

  const status = useCallback(
    (k: string): Status => statusOf(cards?.get(k), now),
    [cards, now],
  );
  const position = useMemo(
    () => new Map(list.map((k, i) => [k.k, i + 1])),
    [list],
  );

  const filtered = useMemo(() => {
    let out = list.filter(
      (d) =>
        (f.jlpt === "all" || `N${d.j}` === f.jlpt) &&
        strokeOk(f.strokes, d.s) &&
        (f.status === "all" || status(d.k) === f.status),
    );
    if (f.sort === "freq")
      out = [...out].sort((a, b) => (a.f ?? 9999) - (b.f ?? 9999));
    if (f.sort === "strokes")
      out = [...out].sort((a, b) => a.s - b.s || a.i - b.i);
    return out;
  }, [list, f, status]);

  const shown = filtered.slice(0, limit);
  const gridRef = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const keyOf = `${density}|${f.jlpt}|${f.strokes}|${f.status}|${f.sort}`;

  // remember the visible order for J/K on the detail page
  useEffect(() => {
    setNavContext({ ...context, list: filtered.map((k) => k.k).join("") });
  }, [filtered, context]);

  // incremental rendering for the big collections
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setLimit((l) => l + PAGE),
      {
        rootMargin: "800px",
      },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // grid.stagger — cards enter from the cursor outwards
  const firstRun = useRef(true);
  const animated = useRef(new WeakSet<Element>());
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the filter/density key or page changes
  useLayoutEffect(() => {
    const g = gridRef.current;
    if (!g) return;
    const quick = !firstRun.current;
    firstRun.current = false;
    if (quick) animated.current = new WeakSet();
    const R = isReduced();
    const vh = window.innerHeight;
    const o =
      pointer.x >= 0 ? pointer : { x: window.innerWidth / 2, y: vh / 2 };
    const animIn = (c: Element, delay: number) => {
      animated.current.add(c);
      c.animate(
        R
          ? [{ opacity: 0 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: "translateY(10px)" },
              { opacity: 1, transform: "none" },
            ],
        { duration: R ? 180 : 460, delay, easing: EASE.out, fill: "backwards" },
      );
    };
    let n = 0;
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (!e.isIntersecting) continue;
          io.unobserve(e.target);
          animIn(e.target, R ? 0 : n++ * 22);
        }
        n = 0;
      },
      { rootMargin: "0px 0px -5% 0px" },
    );
    for (const c of g.querySelectorAll("[data-card]")) {
      if (animated.current.has(c)) continue;
      const r = c.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const d = Math.hypot(
          r.left + r.width / 2 - o.x,
          r.top + r.height / 2 - o.y,
        );
        animIn(
          c,
          R ? 0 : Math.min(quick ? 260 : 620, d * (quick ? 0.25 : 0.5)),
        );
      } else io.observe(c);
    }
    return () => io.disconnect();
  }, [keyOf, shown.length]);

  // card.lift + ink.bleed — one delegated handler for the whole grid
  const hovered = useRef<Element | null>(null);
  const spring = useMemo(
    () => (typeof window === "undefined" ? null : springEasing(420, 26)),
    [],
  );
  const leave = (c: Element | null) => {
    if (!c) return;
    const b = c.querySelector<HTMLElement>("[data-bleed]");
    const gl = c.querySelector<HTMLElement>("[data-glyph]");
    b?.animate(
      [
        { opacity: getComputedStyle(b).opacity },
        { opacity: 0, transform: "scale(1.08)" },
      ],
      {
        duration: 280,
        easing: "ease-out",
        fill: "forwards",
      },
    );
    gl?.animate(
      [
        { transform: getComputedStyle(gl).transform },
        { transform: "translateY(0)" },
      ],
      {
        duration: 260,
        easing: EASE.out,
        fill: "forwards",
      },
    );
  };
  const onOver = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const c = (e.target as Element).closest("[data-card]");
    if (c === hovered.current) return;
    leave(hovered.current);
    hovered.current = c;
    if (!c || isReduced()) return;
    c.querySelector("[data-bleed]")?.animate(
      [
        { opacity: 0, transform: "scale(.35) rotate(-10deg)" },
        { opacity: 1, transform: "scale(1) rotate(0deg)" },
      ],
      { duration: 640, easing: EASE.bleed, fill: "forwards" },
    );
    if (spring)
      c.querySelector("[data-glyph]")?.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(-3px)" }],
        {
          duration: spring.duration,
          easing: spring.easing,
          fill: "forwards",
        },
      );
  };
  const onLeave = () => {
    leave(hovered.current);
    hovered.current = null;
  };

  const opt = <K extends keyof Filters>(
    key: K,
    vals: string[],
    labels: string[],
  ) =>
    vals.map((v, i) => (
      <button
        type="button"
        key={v}
        onClick={() => {
          setF((x) => ({ ...x, [key]: v }));
          setLimit(PAGE);
        }}
        aria-pressed={f[key] === v}
        className={`border-b px-[9px] py-1.5 text-[13px] transition-colors hover:text-ink ${f[key] === v ? "border-ink text-ink" : "border-transparent text-ink-3"}`}
      >
        {labels[i]}
      </button>
    ));
  const groups: [string, React.ReactNode][] = [
    [
      "JLPT",
      opt(
        "jlpt",
        ["all", "N5", "N4", "N3", "N2", "N1"],
        ["Todos", "N5", "N4", "N3", "N2", "N1"],
      ),
    ],
    [
      "TRAÇOS",
      opt(
        "strokes",
        ["all", "1–4", "5–8", "9–12", "13+"],
        ["Todos", "1–4", "5–8", "9–12", "13+"],
      ),
    ],
    [
      "STATUS",
      opt(
        "status",
        ["all", "new", "learning", "review", "mastered"],
        ["Todos", "Novos", "Aprendendo", "Revisar", "Dominados"],
      ),
    ],
    [
      "ORDEM",
      opt(
        "sort",
        ["grade", "freq", "strokes"],
        ["Série", "Frequência", "Traços"],
      ),
    ],
  ];

  const cols: Record<Density, string> = {
    comfortable: "grid-cols-[repeat(auto-fill,minmax(118px,1fr))]",
    compact: "grid-cols-[repeat(auto-fill,minmax(60px,1fr))]",
    ficha: "grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))]",
  };

  return (
    <section
      id="grade"
      aria-labelledby="grade-title"
      className="flex scroll-mt-6 flex-col gap-5"
    >
      <div className="label-mono flex items-center gap-3">
        <span>{n}</span>
        <span id="grade-title">{title}</span>
        <span className="h-px flex-1 bg-line" />
        <span className="tabular-nums">
          {pad(filtered.length, 3)} / {pad(list.length, 3)}
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-7 gap-y-3">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {groups.map(([l, opts]) => (
            <fieldset key={l} className="flex flex-wrap items-center gap-0.5">
              <legend className="sr-only">{l}</legend>
              <span
                aria-hidden="true"
                className="mr-1.5 font-mono text-[10px] tracking-[.1em] text-ink-3"
              >
                {l}
              </span>
              {opts}
            </fieldset>
          ))}
        </div>
        <fieldset className="flex border border-line">
          <legend className="sr-only">Densidade</legend>
          {(
            [
              ["compact", "Compacta"],
              ["comfortable", "Confortável"],
              ["ficha", "Ficha"],
            ] as const
          ).map(([v, l]) => (
            <button
              type="button"
              key={v}
              aria-pressed={density === v}
              onClick={() => setSettings({ density: v })}
              className={`px-3 py-[7px] text-xs ${density === v ? "bg-ink text-paper" : "text-ink-2"}`}
            >
              {l}
            </button>
          ))}
        </fieldset>
      </div>

      {!filtered.length && (
        <div className="flex flex-col items-center gap-5 border border-line px-6 py-[72px] text-center">
          <Enso />
          <div className="flex flex-col gap-1.5">
            <span className="text-lg">Nada por aqui</span>
            <span className="text-sm text-ink-3">
              Nenhum kanji corresponde a esses filtros.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setF(EMPTY)}
            className="border border-line-2 px-4 py-2.5 text-[13px] transition-colors hover:border-ink"
          >
            Limpar filtros
          </button>
        </div>
      )}

      <div
        ref={gridRef}
        onPointerOver={onOver}
        onPointerLeave={onLeave}
        className={`hairline-grid ${cols[density]} ${filtered.length ? "" : "hidden"}`}
      >
        {shown.map((d) => (
          <Card
            key={d.k}
            d={d}
            density={density}
            idx={position.get(d.k) ?? d.i + 1}
            status={status(d.k)}
            progress={progressOf(cards?.get(d.k))}
          />
        ))}
      </div>
      <div
        ref={sentinel}
        aria-hidden="true"
        className={shown.length < filtered.length ? "h-px" : "hidden"}
      />
    </section>
  );
}

function Card({
  d,
  density,
  idx,
  status,
  progress,
}: {
  d: Kanji;
  density: Density;
  idx: number;
  status: Status;
  progress: number;
}) {
  const pt = meaningOf(d);
  const read = cleanReading(d.on[0] ?? d.kun[0] ?? "");
  const aria = `${d.k}, ${pt}, ${statusLabel[status]}`;
  const href = `/${encodeURIComponent(d.k)}`;
  const bleed = (
    <span
      data-bleed
      aria-hidden="true"
      className="pointer-events-none absolute opacity-0"
      style={{
        borderRadius: "46% 54% 58% 42% / 44% 40% 60% 56%",
        background: "radial-gradient(closest-side, var(--ghost), transparent)",
        inset:
          density === "comfortable"
            ? "16% 12% 24%"
            : density === "compact"
              ? "12%"
              : undefined,
        ...(density === "ficha"
          ? { left: 8, top: 8, width: 100, height: 100 }
          : {}),
      }}
    />
  );
  const glyph = (cls: string) => (
    <ViewTransition name={vtName(d.k)}>
      <span
        data-glyph
        lang="ja"
        className={`relative font-k leading-none ${cls}`}
      >
        {d.k}
      </span>
    </ViewTransition>
  );

  if (density === "compact")
    return (
      <Link
        href={href}
        prefetch={false}
        data-card
        aria-label={aria}
        className="relative grid aspect-square place-items-center overflow-hidden no-underline"
      >
        {bleed}
        {glyph("text-[30px]")}
        {status === "review" && (
          <span className="absolute top-1.5 right-1.5 size-[5px] rounded-full bg-hanko" />
        )}
        {status === "mastered" && (
          <span className="absolute right-[5px] bottom-[5px] size-2 rotate-[-8deg] rounded-[1px] bg-hanko" />
        )}
      </Link>
    );

  if (density === "ficha")
    return (
      <Link
        href={href}
        prefetch={false}
        data-card
        aria-label={aria}
        className="relative grid grid-cols-[84px_1fr] items-center gap-4 overflow-hidden p-4 no-underline"
      >
        {bleed}
        {glyph("text-center text-[64px]")}
        <span className="relative flex min-w-0 flex-col gap-2">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-base">{pt}</span>
            <span
              className={`whitespace-nowrap font-mono text-[10px] ${status === "review" || status === "mastered" ? "text-hanko" : "text-ink-3"}`}
            >
              {statusLabel[status]}
            </span>
          </span>
          <span lang="ja" className="flex flex-wrap gap-2.5 text-sm">
            <span className="font-goth font-medium">
              {d.on.slice(0, 2).join("・")}
            </span>
            <span className="font-min text-ink-2">
              {d.kun.slice(0, 2).map(cleanReading).join("・")}
            </span>
          </span>
          <span className="font-mono text-[10px] tracking-[.04em] text-ink-3">
            {pad(d.s)} TRAÇOS · {d.j ? `N${d.j}` : "—"} ·{" "}
            {d.f ? `#${d.f}` : "—"}
          </span>
        </span>
      </Link>
    );

  return (
    <Link
      href={href}
      prefetch={false}
      data-card
      aria-label={aria}
      className="relative flex aspect-[4/5] flex-col justify-between overflow-hidden p-3 no-underline"
    >
      {bleed}
      <span className="relative flex items-center justify-between font-mono text-[10px] text-ink-3">
        <span>{pad(idx, 3)}</span>
        {status === "review" && (
          <span className="flex items-center gap-[5px] text-hanko">
            <span className="size-[5px] rounded-full bg-hanko" />
            revisar
          </span>
        )}
        {status === "new" && <span>novo</span>}
      </span>
      {glyph("self-center text-[clamp(40px,8cqi,60px)]")}
      <span className="relative flex items-baseline justify-between gap-1.5">
        <span className="truncate text-[13px] text-ink-2">{pt}</span>
        <span
          lang="ja"
          className="whitespace-nowrap font-goth text-[11px] text-ink-3"
        >
          {read}
        </span>
      </span>
      {status === "learning" && (
        <span className="absolute right-3 bottom-0 left-3 h-0.5 bg-line">
          <span
            className="absolute inset-y-0 left-0 bg-ink"
            style={{ width: `${progress * 100}%` }}
          />
        </span>
      )}
      {status === "mastered" && (
        <span className="absolute top-7 right-[9px]">
          <Hanko size={22} />
        </span>
      )}
    </Link>
  );
}
