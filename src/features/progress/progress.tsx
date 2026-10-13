"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { COLLECTIONS, useKanjiIndex } from "@/lib/data";
import type { ReviewEntry, StudyCard } from "@/lib/db";
import { EASE, isReduced } from "@/lib/motion";
import { statusOf, useCards } from "@/lib/srs";
import {
  countsByDay,
  forecast,
  heatmap,
  isTomorrowFrozen,
  retention30,
  streak,
  toggleFreezeTomorrow,
  useFreezes,
  useReviews,
} from "@/lib/stats";
import { CountUp } from "@/ui/count-up";
import { ProgressRing, SectionLabel, Skel } from "@/ui/primitives";
import { useToast } from "@/ui/toast";

const fmtDate = (d: Date) =>
  d
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "")
    .toUpperCase();

type Seal = {
  g: string;
  name: string;
  desc: string;
  got: boolean;
  meta: string;
};

function seals(
  cards: StudyCard[],
  reviews: ReviewEntry[],
  streakDays: number,
  n5: string[],
): Seal[] {
  const mastered = cards
    .filter((c) => statusOf(c) === "mastered")
    .map((c) => c.masteredAt ?? c.last_review ?? c.addedAt)
    .sort((a, b) => a.getTime() - b.getTime());
  const goodWrites = reviews.filter(
    (r) => r.kind === "write" && (r.score ?? 0) >= 95,
  );
  const night = reviews.find((r) => r.at.getHours() < 4);
  const masteredSet = new Set(
    cards.filter((c) => statusOf(c) === "mastered").map((c) => c.k),
  );
  const n5Done = n5.filter((k) => masteredSet.has(k)).length;
  return [
    {
      g: "初",
      name: "Primeiro traço",
      desc: "Primeiro kanji dominado",
      got: mastered.length >= 1,
      meta: mastered[0] ? fmtDate(mastered[0]) : `${mastered.length} / 1`,
    },
    {
      g: "十",
      name: "Dez",
      desc: "10 kanji dominados",
      got: mastered.length >= 10,
      meta: mastered[9] ? fmtDate(mastered[9]) : `${mastered.length} / 10`,
    },
    {
      g: "百",
      name: "Cem",
      desc: "100 kanji dominados",
      got: mastered.length >= 100,
      meta: mastered[99] ? fmtDate(mastered[99]) : `${mastered.length} / 100`,
    },
    {
      g: "筆",
      name: "Mão firme",
      desc: "10 escritas acima de 95%",
      got: goodWrites.length >= 10,
      meta: goodWrites[9]
        ? fmtDate(goodWrites[9].at)
        : `${goodWrites.length} / 10`,
    },
    {
      g: "夜",
      name: "Lanterna",
      desc: "Sessão depois da meia-noite",
      got: !!night,
      meta: night ? fmtDate(night.at) : "—",
    },
    {
      g: "継",
      name: "Constância",
      desc: "30 dias seguidos",
      got: streakDays >= 30,
      meta: `${Math.min(streakDays, 30)} / 30`,
    },
    {
      g: "皆",
      name: "Mestre N5",
      desc: "Todos os kanji do N5",
      got: n5.length > 0 && n5Done === n5.length,
      meta: `${n5Done} / ${n5.length}`,
    },
  ];
}

export function Progress() {
  const toast = useToast();
  const { data: index } = useKanjiIndex();
  const cards = useCards();
  const reviews = useReviews();
  const freezes = useFreezes();
  const [range, setRange] = useState<7 | 30>(7);
  const root = useRef<HTMLDivElement>(null);

  const data = useMemo(() => {
    if (!index || !cards || !reviews) return null;
    const all = [...cards.values()];
    const now = new Date();
    const st = new Map(all.map((c) => [c.k, statusOf(c, now)]));
    const byDay = countsByDay(reviews);
    const s = streak(byDay, freezes.days, now);
    const masteredOf = (list: { k: string }[]) =>
      list.filter((k) => st.get(k.k) === "mastered").length;
    const jlpt = [5, 4, 3, 2, 1].map((j) => {
      const list = index.list.filter((k) => k.j === j);
      return { l: `N${j}`, done: masteredOf(list), total: list.length };
    });
    const grades = COLLECTIONS.filter((c) => c.id.startsWith("grade-")).map(
      (c) => {
        const list = index.list.filter(c.test);
        return {
          l: c.id === "grade-8" ? "Secundário" : `${c.id.slice(6)}º ano`,
          done: masteredOf(list),
          total: list.length,
        };
      },
    );
    const masteredSet = new Set(
      all.filter((c) => st.get(c.k) === "mastered").map((c) => c.k),
    );
    return {
      streak: s,
      mastered: masteredOf(index.jouyou),
      learning: all.filter((c) => {
        const x = st.get(c.k);
        return x === "learning" || x === "review";
      }).length,
      retention: retention30(reviews, now),
      totalReviews: reviews.length,
      heat: heatmap(byDay, freezes.days, now),
      jlpt,
      grades,
      wall: index.jouyou.map((k) => ({ k: k.k, lit: masteredSet.has(k.k) })),
      seals: seals(
        all,
        reviews,
        s,
        index.list.filter((k) => k.j === 5).map((k) => k.k),
      ),
      all,
    };
  }, [index, cards, reviews, freezes]);

  const fc = useMemo(
    () => (data ? forecast(data.all, range) : []),
    [data, range],
  );
  const fcMax = Math.max(1, ...fc.map((f) => f.count));
  const ready = !!data;

  // reveal choreography: rings fill, bars grow, columns rise, the wall lights up in a wave
  useLayoutEffect(() => {
    const el = root.current;
    if (!ready || !el) return;
    const R = isReduced();
    el.querySelectorAll<SVGCircleElement>("[data-ring]").forEach((c, i) => {
      c.animate(
        [
          { strokeDashoffset: 100 },
          { strokeDashoffset: Number(c.dataset.ring) },
        ],
        {
          duration: R ? 1 : 1100,
          delay: R ? 0 : 200 + i * 90,
          easing: EASE.fill,
          fill: "backwards",
        },
      );
    });
    el.querySelectorAll("[data-bar]").forEach((c, i) => {
      c.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
        duration: R ? 1 : 900,
        delay: R ? 0 : 300 + i * 60,
        easing: EASE.fill,
        fill: "backwards",
      });
    });
    el.querySelectorAll<HTMLElement>("[data-col]").forEach((c) => {
      c.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
        duration: R ? 1 : 700,
        delay: R ? 0 : Number(c.dataset.col) * 18,
        easing: EASE.out,
        fill: "backwards",
      });
    });
    const wall = el.querySelector("[data-wall]");
    if (wall) {
      const n = wall.children.length;
      wall.querySelectorAll<HTMLElement>("[data-lit]").forEach((e) => {
        const idx = Number(e.dataset.lit);
        e.animate(
          R
            ? [{ opacity: 0.15 }, { opacity: 1 }]
            : [
                { opacity: 0.12, filter: "blur(2px)" },
                { opacity: 1, filter: "blur(0)" },
              ],
          {
            duration: R ? 300 : 700,
            delay: R ? 0 : 400 + (idx / n) * 1800,
            easing: EASE.out,
            fill: "backwards",
          },
        );
      });
    }
  }, [ready]);

  // forecast bars re-grow when the range changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on range
  useLayoutEffect(() => {
    if (!ready) return;
    root.current?.querySelectorAll("[data-fc]").forEach((c, i) => {
      c.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], {
        duration: isReduced() ? 1 : 500,
        delay: i * 14,
        easing: EASE.out,
        fill: "backwards",
      });
    });
  }, [range]);

  if (!data)
    return (
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-12 p-[clamp(20px,4.5cqi,56px)]">
        <Skel w={140} />
        <Skel w="50%" h={24} />
        <div className="hairline-grid grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 p-6">
              <Skel w="40%" />
            </div>
          ))}
        </div>
      </div>
    );

  const frozenTomorrow = isTomorrowFrozen(freezes);
  const DW = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const got = data.seals.filter((s) => s.got).length;

  return (
    <div
      ref={root}
      className="mx-auto flex w-full max-w-[1240px] flex-col gap-[clamp(56px,7cqi,96px)] p-[clamp(20px,4.5cqi,56px)]"
    >
      <header className="flex flex-col gap-2">
        <span className="label-mono">
          Progresso · {new Date().getFullYear()}
        </span>
        <h1 className="m-0 text-[clamp(36px,5cqi,56px)] font-light leading-[1.05] tracking-[-.02em]">
          Seu caminho até aqui
        </h1>
      </header>

      <dl className="hairline-grid m-0 grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
        <div className="flex flex-col gap-2.5 p-[22px]">
          <dt className="font-mono text-[10px] tracking-[.12em] text-ink-3">
            SEQUÊNCIA
          </dt>
          <dd className="m-0 flex items-baseline gap-2">
            <span className="font-mono text-[40px]">
              <CountUp to={data.streak} />
            </span>
            <span className="text-sm text-ink-2">
              dia{data.streak === 1 ? "" : "s"}
            </span>
          </dd>
          <button
            type="button"
            onClick={async () => {
              const ok = await toggleFreezeTomorrow();
              if (!ok) toast("Sem congelamentos disponíveis");
              else
                toast(
                  frozenTomorrow
                    ? "Congelamento cancelado"
                    : "Amanhã está protegido",
                );
            }}
            className="self-start border-b border-line-2 pb-0.5 text-xs text-ink-2 transition-colors hover:border-ink hover:text-ink"
          >
            {frozenTomorrow
              ? "Amanhã protegido ✓"
              : `Congelar amanhã (${freezes.available} disponíve${freezes.available === 1 ? "l" : "is"})`}
          </button>
        </div>
        <div className="flex flex-col gap-2.5 p-[22px]">
          <dt className="font-mono text-[10px] tracking-[.12em] text-hanko">
            DOMINADOS
          </dt>
          <dd className="m-0 flex items-baseline gap-2">
            <span className="font-mono text-[40px] text-hanko">
              <CountUp to={data.mastered} delay={80} />
            </span>
            <span className="text-sm text-ink-2">
              de {data.wall.length.toLocaleString("pt-BR")}
            </span>
          </dd>
        </div>
        <div className="flex flex-col gap-2.5 p-[22px]">
          <dt className="font-mono text-[10px] tracking-[.12em] text-ink-3">
            APRENDENDO
          </dt>
          <dd className="m-0 font-mono text-[40px]">
            <CountUp to={data.learning} delay={160} />
          </dd>
        </div>
        <div className="flex flex-col gap-2.5 p-[22px]">
          <dt className="font-mono text-[10px] tracking-[.12em] text-ink-3">
            RETENÇÃO · 30 D
          </dt>
          <dd className="m-0 flex items-baseline gap-0.5">
            {data.retention === null ? (
              <span className="font-mono text-[40px] text-ink-3">—</span>
            ) : (
              <>
                <span className="font-mono text-[40px]">
                  <CountUp to={data.retention} decimals={1} delay={240} />
                </span>
                <span className="font-mono text-lg text-ink-3">%</span>
              </>
            )}
          </dd>
        </div>
      </dl>

      <section className="flex flex-col gap-4">
        <SectionLabel
          n="01"
          meta={`${data.totalReviews.toLocaleString("pt-BR")} REVISÕES`}
        >
          Estudo diário
        </SectionLabel>
        <div className="overflow-x-auto pb-1.5">
          <div className="flex min-w-[720px] flex-col gap-1.5">
            <div className="grid h-3.5 grid-cols-[repeat(53,minmax(0,1fr))] gap-[3px] font-mono text-[10px] text-ink-3">
              {data.heat.months.map((m) => (
                <span
                  key={`${m.label}${m.col}`}
                  style={{ gridColumn: `${m.col} / span 4`, gridRow: 1 }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div
              role="img"
              aria-label="Mapa de calor anual de estudo"
              className="grid grid-flow-col grid-rows-7 gap-[3px]"
              style={{ gridAutoColumns: "minmax(0,1fr)" }}
            >
              {data.heat.cells.map((c, i) => (
                <span
                  key={c.key}
                  data-col={Math.floor(i / 7)}
                  title={`${c.date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} · ${c.frozen ? "congelado" : `${c.count} revis${c.count === 1 ? "ão" : "ões"}`}`}
                  className="aspect-square origin-bottom rounded-[2px]"
                  style={{
                    background: c.frozen ? "transparent" : HEAT[c.level],
                    boxShadow: c.frozen
                      ? "inset 0 0 0 1px var(--hanko)"
                      : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 font-mono text-[10px] text-ink-3">
          <span>menos</span>
          {HEAT.map((bg) => (
            <span
              key={bg}
              className="size-2.5 rounded-[2px]"
              style={{ background: bg }}
            />
          ))}
          <span>mais</span>
          <span
            className="ml-3 size-2.5 rounded-[2px]"
            style={{ boxShadow: "inset 0 0 0 1px var(--hanko)" }}
          />
          <span>congelado</span>
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-[clamp(40px,6cqi,80px)]">
        <section className="flex flex-col gap-6">
          <SectionLabel n="02">Por nível JLPT</SectionLabel>
          <div className="grid grid-cols-5 gap-3">
            {data.jlpt.map((r) => {
              const p = r.total ? (r.done / r.total) * 100 : 0;
              return (
                <div key={r.l} className="flex flex-col items-center gap-2">
                  <div className="w-full max-w-[92px]">
                    <ProgressRing value={p} size="100%" track={5} stroke={7}>
                      {Math.round(p)}%
                    </ProgressRing>
                  </div>
                  <span className="text-sm">{r.l}</span>
                  <span className="font-mono text-[10px] text-ink-3">
                    {r.done} / {r.total}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
        <section className="flex flex-col gap-5">
          <SectionLabel n="03">Por série escolar</SectionLabel>
          <div className="flex flex-col gap-3">
            {data.grades.map((b) => (
              <div
                key={b.l}
                className="grid grid-cols-[92px_1fr_72px] items-center gap-3.5"
              >
                <span className="text-sm">{b.l}</span>
                <span className="relative h-1.5 overflow-hidden rounded-[3px] bg-line">
                  <span
                    data-bar
                    className="absolute inset-y-0 left-0 origin-left rounded-[3px] bg-ink"
                    style={{
                      width: `${b.total ? (b.done / b.total) * 100 : 0}%`,
                    }}
                  />
                </span>
                <span className="text-right font-mono text-[11px] text-ink-3">
                  {b.done} / {b.total}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-5">
        <SectionLabel
          n="04"
          meta={
            <span className="flex border border-line">
              {([7, 30] as const).map((v) => (
                <button
                  type="button"
                  key={v}
                  aria-pressed={range === v}
                  onClick={() => setRange(v)}
                  className={`px-2.5 py-[5px] text-[11px] normal-case ${range === v ? "bg-ink text-paper" : "text-ink-2"}`}
                >
                  {v} dias
                </button>
              ))}
            </span>
          }
        >
          Previsão de revisões
        </SectionLabel>
        <div
          className="grid h-40 grid-flow-col items-end gap-1 border-b border-line-2"
          style={{ gridAutoColumns: "minmax(0,1fr)" }}
        >
          {fc.map((f, i) => (
            <div
              key={f.date.toISOString()}
              title={`${f.date.toLocaleDateString("pt-BR")} · ${f.count} revis${f.count === 1 ? "ão" : "ões"}`}
              className="flex h-full flex-col items-center justify-end gap-1.5"
            >
              <span className="font-mono text-[10px] text-ink-3">
                {range === 7 || i % 5 === 0 ? f.count : ""}
              </span>
              <span
                data-fc
                className="w-full max-w-11 origin-bottom rounded-t-[2px]"
                style={{
                  height: `${Math.max(f.count ? 4 : 1, (f.count / fcMax) * 82)}%`,
                  background:
                    i === 0
                      ? "var(--hanko)"
                      : f.count
                        ? "var(--ink)"
                        : "var(--line)",
                }}
              />
            </div>
          ))}
        </div>
        <div
          className="grid grid-flow-col gap-1 text-center font-mono text-[10px] text-ink-3"
          style={{ gridAutoColumns: "minmax(0,1fr)" }}
        >
          {fc.map((f, i) => (
            <span key={f.date.toISOString()}>
              {range === 7
                ? i === 0
                  ? "amanhã"
                  : DW[f.date.getDay()]
                : i % 5 === 0
                  ? `${f.date.getDate()}/${f.date.getMonth() + 1}`
                  : ""}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel
          n="05"
          meta={`${data.mastered} / ${data.wall.length.toLocaleString("pt-BR")} JŌYŌ`}
        >
          Minha parede de kanji
        </SectionLabel>
        <p className="m-0 max-w-[560px] text-[15px] leading-[1.6] text-pretty text-ink-2">
          Cada um dos {data.wall.length.toLocaleString("pt-BR")} kanji de uso
          comum. Os que você domina ganham tinta; o resto espera no papel.
        </p>
        <div
          data-wall
          lang="ja"
          role="img"
          aria-label={`Parede de kanji: ${data.mastered} de ${data.wall.length} dominados`}
          className="grid grid-cols-[repeat(auto-fill,minmax(19px,1fr))] gap-px border border-line p-4 text-center font-k text-[15px] leading-[19px]"
        >
          {data.wall.map((w, i) => (
            <span
              key={w.k}
              data-lit={w.lit ? i : undefined}
              style={{
                color: w.lit
                  ? "var(--ink)"
                  : "color-mix(in oklab, var(--ink) 14%, transparent)",
              }}
            >
              {w.k}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel n="06" meta={`${got} / ${data.seals.length}`}>
          Selos
        </SectionLabel>
        <div className="hairline-grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {data.seals.map((a, i) => (
            <div
              key={a.g}
              className="flex flex-col items-center gap-3 px-4 py-5 text-center"
            >
              <span
                lang="ja"
                className="grid size-16 place-items-center font-min text-[30px] font-extrabold"
                style={{
                  borderRadius: i % 2 ? "50%" : 6,
                  transform: `rotate(${a.got ? (i % 2 ? 4 : -6) : 0}deg)`,
                  background: a.got ? "var(--hanko)" : "transparent",
                  color: a.got ? "var(--on-hanko)" : "var(--ink-3)",
                  boxShadow: a.got
                    ? "inset 0 0 0 3px var(--hanko), inset 0 0 0 4.5px var(--on-hanko)"
                    : "inset 0 0 0 1px var(--line-2)",
                }}
              >
                {a.g}
              </span>
              <span className="flex flex-col gap-[3px]">
                <span className="text-sm">{a.name}</span>
                <span className="text-xs text-pretty text-ink-3">{a.desc}</span>
              </span>
              <span className="font-mono text-[10px] text-ink-3">{a.meta}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const HEAT = [
  "var(--line)",
  "color-mix(in oklab, var(--ink) 22%, var(--paper))",
  "color-mix(in oklab, var(--ink) 45%, var(--paper))",
  "color-mix(in oklab, var(--ink) 70%, var(--paper))",
  "var(--ink)",
];
