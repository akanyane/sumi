"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  COLLECTIONS,
  collectionById,
  hasPt,
  type Kanji,
  meaningOf,
  pad,
  useKanjiIndex,
  useStrokes,
} from "@/lib/data";
import { dateJa, datePt, dayNumber } from "@/lib/dates";
import { db } from "@/lib/db";
import { mnemonicFor } from "@/lib/mnemonics";
import { useSettings } from "@/lib/settings";
import { buildQueue, countNewToday, statusOf, useCards } from "@/lib/srs";
import { countsByDay, streak, useFreezes, useReviews } from "@/lib/stats";
import { usePalette } from "@/ui/command-palette";
import { IconArrow, IconSearch } from "@/ui/icons";
import { btn, Kbd, SectionLabel, Skel } from "@/ui/primitives";
import { ReadingRow } from "@/ui/readings";
import { PlayerControls, useStrokePlayer } from "@/ui/stroke-player";
import { KanjiGrid } from "./kanji-grid";

export function useToday() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  return now;
}

function kanjiOfTheDay(list: Kanji[], day: number) {
  // rotate through kanji we have Portuguese meanings for, so the hero is fully translated
  const school = list.filter((k) => hasPt(k) && k.sv);
  return school[(day * 7919) % school.length];
}

export function HomeHeader() {
  const palette = usePalette();
  const now = useToday();
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex min-h-[38px] flex-col gap-0.5">
        {now && (
          <>
            <span className="label-mono">{datePt(now)}</span>
            <span lang="ja" className="font-min text-[13px] text-ink-2">
              {dateJa(now)}
            </span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={palette.open}
        className="flex min-w-0 items-center gap-2.5 border border-line px-3.5 py-2.5 text-sm text-ink-2 transition-colors hover:border-ink"
      >
        <IconSearch className="flex-none" />
        <span className="hidden truncate sm:inline">
          Kanji, significado, leitura
        </span>
        <span className="sm:hidden">Buscar</span>
        <Kbd>⌘K</Kbd>
      </button>
    </header>
  );
}

function KanjiOfTheDay({ k }: { k: Kanji }) {
  const router = useRouter();
  const { data: index } = useKanjiIndex();
  const { data: strokes } = useStrokes(k.k);
  const player = useStrokePlayer(k.k, strokes, { autoplay: 500 });
  const note = useLiveQuery(() => db.notes.get(k.k), [k.k]);
  const mn = note?.text || mnemonicFor(k, index);
  return (
    <section
      aria-labelledby="kdd"
      className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-center gap-[clamp(24px,5cqi,72px)]"
    >
      <div className="flex flex-col gap-4">
        <div className="relative mx-auto aspect-square w-full max-w-[520px]">
          <div ref={player.ref} className="absolute inset-0" />
          {!strokes && (
            <span
              lang="ja"
              className="absolute inset-0 grid place-items-center font-k text-[clamp(160px,30cqi,420px)] leading-none text-ghost"
            >
              {k.k}
            </span>
          )}
        </div>
        <div className="flex justify-center">
          <PlayerControls player={player} />
        </div>
      </div>
      <div className="flex max-w-[440px] flex-col gap-7">
        <SectionLabel meta={`Nº ${pad(k.i + 1, 3)}`} id="kdd">
          Kanji do dia
        </SectionLabel>
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[clamp(36px,5cqi,56px)] font-light leading-[1.02] tracking-[-.02em]">
            {meaningOf(k)}
          </h1>
          <span className="text-[15px] text-ink-3">
            {k.m.slice(0, 3).join(" · ")}
          </span>
        </div>
        <dl className="m-0 grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-3">
          {k.on[0] && <ReadingRow label="ON" value={k.on[0]} kind="on" />}
          {k.kun[0] && <ReadingRow label="KUN" value={k.kun[0]} kind="kun" />}
        </dl>
        {mn && (
          <p className="m-0 text-[15px] leading-[1.6] text-pretty text-ink-2">
            {mn}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btn.primary}
            onClick={() => router.push(`/${encodeURIComponent(k.k)}`)}
          >
            Abrir ficha
          </button>
          <button
            type="button"
            className={btn.secondary}
            onClick={() => player.replay()}
          >
            Desenhar de novo
          </button>
        </div>
      </div>
    </section>
  );
}

function TodayStrip() {
  const { data: index } = useKanjiIndex();
  const cards = useCards();
  const reviews = useReviews();
  const freezes = useFreezes();
  const s = useSettings();
  const stats = useMemo(() => {
    if (!index || !cards || !reviews) return null;
    const q = buildQueue(index, cards, {
      ...s,
      newToday: countNewToday(reviews),
    });
    const fresh = q.filter((x) => x.isNew).length;
    return {
      due: q.length - fresh,
      fresh,
      minutes: Math.max(1, Math.round((q.length * 25) / 60)),
      streak: streak(countsByDay(reviews), freezes.days),
    };
  }, [index, cards, reviews, freezes, s]);
  const num = "font-mono text-2xl";
  return (
    <section className="hairline-grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]">
      <div className="flex flex-col gap-1.5 p-6">
        <span className="font-mono text-[10px] tracking-[.12em] text-ink-3">
          HOJE
        </span>
        {stats ? (
          <>
            <span className="text-[26px] font-light">
              <span className={num}>{stats.due}</span> revis
              {stats.due === 1 ? "ão" : "ões"} ·{" "}
              <span className={num}>{stats.fresh}</span> novo
              {stats.fresh === 1 ? "" : "s"}
            </span>
            <span className="text-[13px] text-ink-3">
              {stats.due + stats.fresh
                ? `cerca de ${stats.minutes} minuto${stats.minutes > 1 ? "s" : ""}`
                : "tudo em dia"}
            </span>
          </>
        ) : (
          <Skel w="60%" h={12} />
        )}
      </div>
      <div className="flex flex-col gap-1.5 p-6">
        <span className="font-mono text-[10px] tracking-[.12em] text-ink-3">
          SEQUÊNCIA
        </span>
        {stats ? (
          <>
            <span className="text-[26px] font-light">
              <span className={num}>{stats.streak}</span> dia
              {stats.streak === 1 ? "" : "s"}
            </span>
            <span className="text-[13px] text-ink-3">
              {freezes.available} congelamento
              {freezes.available === 1 ? "" : "s"} disponíve
              {freezes.available === 1 ? "l" : "is"}
            </span>
          </>
        ) : (
          <Skel w="40%" h={12} />
        )}
      </div>
      <Link
        href="/aprender"
        className="press flex items-end justify-between gap-3 !bg-ink p-6 text-paper no-underline active:opacity-90"
      >
        <span className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] tracking-[.12em] opacity-70">
            SESSÃO
          </span>
          <span className="text-[22px]">Começar a estudar</span>
        </span>
        <IconArrow size={22} />
      </Link>
    </section>
  );
}

function Collections({ active }: { active?: string }) {
  const { data: index } = useKanjiIndex();
  const cards = useCards();
  const rows = useMemo(() => {
    if (!index) return null;
    const now = new Date();
    return COLLECTIONS.map((c) => {
      const members = index.list.filter(c.test);
      const done = cards
        ? members.filter((k) => statusOf(cards.get(k.k), now) === "mastered")
            .length
        : 0;
      return { ...c, total: members.length, done };
    });
  }, [index, cards]);
  return (
    <section aria-labelledby="col" className="flex flex-col gap-5">
      <SectionLabel n="01" id="col">
        Coleções
      </SectionLabel>
      <div className="hairline-grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
        {(rows ?? COLLECTIONS.map((c) => ({ ...c, total: 0, done: 0 }))).map(
          (c) => (
            <Link
              key={c.id}
              href={`/${c.id}`}
              className={`flex min-h-24 flex-col gap-3.5 p-4 no-underline transition-colors hover:!bg-paper-2 ${active === c.id ? "!bg-paper-2" : ""}`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[15px]">{c.label}</span>
                <span lang="ja" className="font-min text-[13px] text-ink-3">
                  {c.ja}
                </span>
              </span>
              <span className="flex-1" />
              <span className="flex flex-col gap-1.5">
                <span className="relative h-0.5 bg-line">
                  <span
                    className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-700"
                    style={{
                      width: c.total ? `${(c.done / c.total) * 100}%` : 0,
                    }}
                  />
                </span>
                <span className="flex justify-between font-mono text-[10px] text-ink-3">
                  <span>{c.done} dominados</span>
                  <span>{c.total ? c.total.toLocaleString("pt-BR") : "—"}</span>
                </span>
              </span>
            </Link>
          ),
        )}
      </div>
    </section>
  );
}

export function GridSkeleton() {
  return (
    <div className="hairline-grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))]">
      {Array.from({ length: 12 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <div key={i} className="flex aspect-[4/5] items-center justify-center">
          <Skel w="46%" rot={-4} />
        </div>
      ))}
    </div>
  );
}

const HOME_CONTEXT = { label: "Série 1", href: "/" };

export function Home() {
  const { data: index, isError, refetch } = useKanjiIndex();
  const cards = useCards();
  const now = useToday();
  const day = index && now ? kanjiOfTheDay(index.list, dayNumber(now)) : null;
  const serie1 = collectionById("grade-1");
  const list = useMemo(
    () => (index && serie1 ? index.list.filter(serie1.test) : []),
    [index, serie1],
  );

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-[clamp(56px,8cqi,104px)] p-[clamp(20px,4.5cqi,56px)]">
      <HomeHeader />
      {isError && <LoadError onRetry={() => refetch()} />}
      {day ? (
        <KanjiOfTheDay key={day.k} k={day} />
      ) : (
        <div className="grid min-h-[420px] grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] items-center gap-12">
          <div className="mx-auto grid aspect-square w-full max-w-[420px] place-items-center">
            <Skel w="50%" h={14} />
          </div>
          <div className="flex flex-col gap-5">
            <Skel w="40%" />
            <Skel w="80%" h={18} />
            <Skel w="60%" />
          </div>
        </div>
      )}
      <TodayStrip />
      <Collections />
      {index ? (
        <KanjiGrid
          list={list}
          cards={cards}
          context={HOME_CONTEXT}
          title="Série 1"
          n="02"
        />
      ) : (
        <GridSkeleton />
      )}
    </div>
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border border-line p-5">
      <span className="text-sm text-ink-2">
        Não foi possível carregar os kanji. Verifique a conexão.
      </span>
      <button
        type="button"
        onClick={onRetry}
        className="border border-ink px-3.5 py-2 text-[13px]"
      >
        Tentar de novo
      </button>
    </div>
  );
}

export function CollectionView({ id }: { id: string }) {
  const { data: index, isError, refetch } = useKanjiIndex();
  const cards = useCards();
  const c = collectionById(id);
  const list = useMemo(
    () => (index && c ? index.list.filter(c.test) : []),
    [index, c],
  );
  const ctx = useMemo(
    () => ({ label: c?.label ?? "", href: `/${id}` }),
    [c, id],
  );
  if (!c) return null;
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-[clamp(40px,6cqi,80px)] p-[clamp(20px,4.5cqi,56px)]">
      <HomeHeader />
      <header className="flex flex-col gap-3">
        <Link href="/" className={`${btn.ghost} self-start no-underline`}>
          ← Explorar
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <h1 className="m-0 text-[clamp(36px,5cqi,56px)] font-light leading-[1.05] tracking-[-.02em]">
            {c.label}
          </h1>
          <span
            lang="ja"
            className="font-min text-[clamp(24px,3cqi,32px)] text-ink-3"
          >
            {c.ja}
          </span>
        </div>
      </header>
      {isError && <LoadError onRetry={() => refetch()} />}
      {index ? (
        <KanjiGrid
          list={list}
          cards={cards}
          context={ctx}
          title={c.label}
          n="01"
        />
      ) : (
        <GridSkeleton />
      )}
      <Collections active={id} />
    </div>
  );
}
