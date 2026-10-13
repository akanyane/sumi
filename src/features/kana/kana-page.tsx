"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  ViewTransition,
} from "react";
import { HomeHeader } from "@/features/explore/home";
import { type Kanji, useKanjiIndex } from "@/lib/data";
import type { StudyCard } from "@/lib/db";
import { EASE, isReduced } from "@/lib/motion";
import { setNavContext, vtName } from "@/lib/nav-context";
import { setSettings, useSettings } from "@/lib/settings";
import { speak } from "@/lib/speech";
import { progressOf, type Status, statusOf, useCards } from "@/lib/srs";
import { IconArrow } from "@/ui/icons";
import { btn, Hanko, SectionLabel, Skel } from "@/ui/primitives";

type Script = "hiragana" | "katakana";
const VOWELS = ["a", "i", "u", "e", "o"];

function Marker({ status, progress }: { status: Status; progress: number }) {
  if (status === "review")
    return (
      <span className="absolute top-1.5 right-1.5 size-[5px] rounded-full bg-hanko" />
    );
  if (status === "mastered")
    return (
      <span className="absolute top-1.5 right-1.5">
        <Hanko size={14} />
      </span>
    );
  if (status === "learning")
    return (
      <span className="absolute right-2 bottom-0 left-2 h-0.5 bg-line">
        <span
          className="absolute inset-y-0 left-0 bg-ink"
          style={{ width: `${progress * 100}%` }}
        />
      </span>
    );
  return null;
}

function Cell({
  k,
  cards,
}: {
  k: Kanji;
  cards: Map<string, StudyCard> | undefined;
}) {
  const card = cards?.get(k.k);
  const status = statusOf(card);
  const single = [...k.k].length === 1;
  const inner = (
    <>
      <Marker status={status} progress={progressOf(card)} />
      {single ? (
        <ViewTransition name={vtName(k.k)}>
          <span
            lang="ja"
            className="font-k text-[clamp(30px,5.5cqi,48px)] leading-none"
          >
            {k.k}
          </span>
        </ViewTransition>
      ) : (
        <span
          lang="ja"
          className="font-k text-[clamp(24px,4cqi,36px)] leading-none"
        >
          {k.k}
        </span>
      )}
      <span className="font-mono text-[11px] text-ink-3">{k.kana?.r}</span>
    </>
  );
  const cls =
    "relative flex aspect-square flex-col items-center justify-center gap-1.5 bg-paper no-underline transition-colors hover:!bg-paper-2";
  return single ? (
    <Link
      data-cell
      href={`/${encodeURIComponent(k.k)}`}
      prefetch={false}
      aria-label={`${k.k}, ${k.kana?.r}`}
      className={cls}
    >
      {inner}
    </Link>
  ) : (
    <button
      data-cell
      type="button"
      onClick={() => speak(k.k)}
      aria-label={`Ouvir ${k.k}, ${k.kana?.r}`}
      className={cls}
    >
      {inner}
    </button>
  );
}

function Table({
  rows,
  cols,
  cards,
}: {
  rows: { row: string; cells: (Kanji | null)[] }[];
  cols: string[];
  cards: Map<string, StudyCard> | undefined;
}) {
  return (
    <div className="max-w-[640px] overflow-x-auto">
      <div
        className="hairline-grid min-w-[320px]"
        style={{
          gridTemplateColumns: `36px repeat(${cols.length}, minmax(0, 1fr))`,
        }}
      >
        <span />
        {cols.map((c) => (
          <span
            key={c}
            className="py-2 text-center font-mono text-[10px] tracking-[.12em] text-ink-3 uppercase"
          >
            {c}
          </span>
        ))}
        {rows.map(({ row, cells }) => (
          <div key={row} className="contents">
            <span className="grid place-items-center bg-paper font-mono text-[10px] text-ink-3">
              {row}
            </span>
            {cols.map((c, ci) => {
              const k = cells[ci];
              return k ? (
                <Cell key={k.k} k={k} cards={cards} />
              ) : (
                <span
                  key={`${row}-${c}`}
                  aria-hidden="true"
                  className="bg-paper"
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function rowsOf(list: Kanji[], width: number) {
  const rows: { row: string; cells: (Kanji | null)[] }[] = [];
  for (const k of list) {
    const info = k.kana;
    if (!info) continue;
    let r = rows.find((x) => x.row === info.row);
    if (!r) {
      r = { row: info.row, cells: Array(width).fill(null) };
      rows.push(r);
    }
    r.cells[info.col] = k;
  }
  return rows;
}

export function KanaPage() {
  const router = useRouter();
  const { data: index } = useKanjiIndex();
  const cards = useCards();
  const { kanaFirst } = useSettings();
  const [script, setScript] = useState<Script>("hiragana");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.location.hash === "#katakana") setScript("katakana");
  }, []);
  const choose = (s: Script) => {
    setScript(s);
    history.replaceState(null, "", `#${s}`);
  };

  const data = useMemo(() => {
    if (!index) return null;
    const of = (s: Script, g: string) =>
      index.kana.filter((k) => k.kana?.script === s && k.kana.group === g);
    const progress = (s: Script) => {
      const all = index.kana.filter((k) => k.kana?.script === s);
      const now = new Date();
      return {
        total: all.length,
        done: all.filter((k) => statusOf(cards?.get(k.k), now) === "mastered")
          .length,
        started: all.filter((k) => cards?.has(k.k)).length,
      };
    };
    return {
      basic: rowsOf(of(script, "basic"), 5),
      dakuten: rowsOf(of(script, "dakuten"), 5),
      combo: rowsOf(of(script, "combo"), 3),
      list: [...of(script, "basic"), ...of(script, "dakuten")]
        .map((k) => k.k)
        .join(""),
      hira: progress("hiragana"),
      kata: progress("katakana"),
    };
  }, [index, cards, script]);

  useEffect(() => {
    if (data)
      setNavContext({
        label: script === "hiragana" ? "Hiragana" : "Katakana",
        href: `/kana#${script}`,
        list: data.list,
      });
  }, [data, script]);

  // cells ink in row by row when the script changes
  const ready = !!data;
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run per script
  useLayoutEffect(() => {
    if (!ready || isReduced()) return;
    root.current?.querySelectorAll("[data-cell]").forEach((c, i) => {
      c.animate(
        [
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "none" },
        ],
        {
          duration: 420,
          delay: Math.min(i * 10, 700),
          easing: EASE.out,
          fill: "backwards",
        },
      );
    });
  }, [ready, script]);

  const start = () => {
    setSettings({ kanaFirst: true });
    router.push("/aprender");
  };

  return (
    <div
      ref={root}
      className="mx-auto flex w-full max-w-[1240px] flex-col gap-[clamp(48px,7cqi,88px)] p-[clamp(20px,4.5cqi,56px)]"
    >
      <HomeHeader />
      <header className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-end gap-8">
        <div className="flex flex-col gap-3">
          <span className="label-mono">Kana · 仮名</span>
          <h1 className="m-0 text-[clamp(36px,5cqi,56px)] font-light leading-[1.05] tracking-[-.02em]">
            Antes do kanji, o kana
          </h1>
        </div>
        <p className="m-0 max-w-[520px] text-[15px] leading-[1.65] text-pretty text-ink-2">
          Dois silabários com os mesmos sons. O{" "}
          <strong className="font-medium text-ink">hiragana</strong> escreve
          palavras nativas e a gramática; o{" "}
          <strong className="font-medium text-ink">katakana</strong>, palavras
          estrangeiras e ênfase. São eles que mostram como cada kanji se lê.
        </p>
      </header>

      <section className="hairline-grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))]">
        {(
          [
            ["hiragana", "Hiragana", "平仮名", data?.hira],
            ["katakana", "Katakana", "片仮名", data?.kata],
          ] as const
        ).map(([id, label, ja, p]) => (
          <button
            type="button"
            key={id}
            onClick={() => choose(id)}
            className={`flex flex-col gap-3 p-6 text-left transition-colors hover:!bg-paper-2 ${script === id ? "!bg-paper-2" : ""}`}
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-lg">{label}</span>
              <span lang="ja" className="font-min text-sm text-ink-3">
                {ja}
              </span>
            </span>
            {p ? (
              <>
                <span className="relative h-0.5 bg-line">
                  <span
                    className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-700"
                    style={{ width: `${(p.done / p.total) * 100}%` }}
                  />
                </span>
                <span className="flex justify-between font-mono text-[10px] text-ink-3">
                  <span>
                    {p.done} dominados · {p.started} iniciados
                  </span>
                  <span>{p.total}</span>
                </span>
              </>
            ) : (
              <Skel w="60%" />
            )}
          </button>
        ))}
        {kanaFirst ? (
          <div className="flex flex-col justify-between gap-3 p-6">
            <span className="flex flex-col gap-1">
              <span className="font-mono text-[10px] tracking-[.12em] text-hanko">
                KANA PRIMEIRO · LIGADO
              </span>
              <span className="text-sm text-ink-2">
                As sessões ensinam o kana antes dos kanji, no dobro do ritmo.
              </span>
            </span>
            <span className="flex flex-wrap items-center gap-4">
              <Link
                href="/aprender"
                className="border-b border-ink pb-0.5 text-sm no-underline"
              >
                Continuar estudando →
              </Link>
              <button
                type="button"
                onClick={() => setSettings({ kanaFirst: false })}
                className="text-xs text-ink-3 hover:text-ink"
              >
                Desligar
              </button>
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={start}
            className="press flex items-end justify-between gap-3 !bg-ink p-6 text-left text-paper"
          >
            <span className="flex flex-col gap-1.5">
              <span className="font-mono text-[10px] tracking-[.12em] opacity-70">
                AINDA NÃO LÊ KANA?
              </span>
              <span className="text-[22px]">Começar pelo kana</span>
            </span>
            <IconArrow size={22} />
          </button>
        )}
      </section>

      <fieldset className="-mb-6 flex self-start border border-line">
        <legend className="sr-only">Escrita</legend>
        {(["hiragana", "katakana"] as const).map((s) => (
          <button
            type="button"
            key={s}
            aria-pressed={script === s}
            onClick={() => choose(s)}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] ${script === s ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
          >
            <span lang="ja" className="font-k text-base">
              {s === "hiragana" ? "あ" : "ア"}
            </span>
            {s === "hiragana" ? "Hiragana" : "Katakana"}
          </button>
        ))}
      </fieldset>

      {data ? (
        <>
          <section id={script} className="flex scroll-mt-6 flex-col gap-5">
            <SectionLabel n="01" meta="46">
              Básico · gojūon
            </SectionLabel>
            <Table rows={data.basic} cols={VOWELS} cards={cards} />
          </section>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-[clamp(40px,6cqi,72px)]">
            <section className="flex flex-col gap-5">
              <SectionLabel n="02" meta="25">
                Dakuten · ゛゜
              </SectionLabel>
              <p className="m-0 text-sm leading-relaxed text-pretty text-ink-2">
                Duas marquinhas (゛) deixam o som sonoro: k→g, s→z, t→d, h→b. O
                círculo (゜) transforma h em p.
              </p>
              <Table rows={data.dakuten} cols={VOWELS} cards={cards} />
            </section>
            <section className="flex flex-col gap-5">
              <SectionLabel n="03" meta="33">
                Combinações · yōon
              </SectionLabel>
              <p className="m-0 text-sm leading-relaxed text-pretty text-ink-2">
                Uma sílaba em -i seguida de や, ゆ ou よ pequenos vira um som
                só: き + ゃ = kya. Toque para ouvir.
              </p>
              <Table
                rows={data.combo}
                cols={["ya", "yu", "yo"]}
                cards={cards}
              />
            </section>
          </div>
        </>
      ) : (
        <div className="hairline-grid grid-cols-5">
          {Array.from({ length: 15 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
            <div key={i} className="grid aspect-square place-items-center">
              <Skel w="40%" />
            </div>
          ))}
        </div>
      )}

      <Link
        href="/aprender"
        className={`${btn.secondary} self-start no-underline`}
      >
        Ir para a sessão de estudo
      </Link>
    </div>
  );
}
