"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { Grade } from "ts-fsrs";
import {
  type Kanji,
  type KanjiIndex,
  meaningOf,
  pad,
  type StrokeData,
  strokesQuery,
  useKanjiIndex,
  useStrokes,
  type Word,
} from "@/lib/data";
import { db, type StudyCard } from "@/lib/db";
import { cleanReading, romaji } from "@/lib/kana";
import { mnemonicFor } from "@/lib/mnemonics";
import { isReduced } from "@/lib/motion";
import { getSettings } from "@/lib/settings";
import { speak } from "@/lib/speech";
import {
  addToStudy,
  buildQueue,
  countNewToday,
  fmtInterval,
  gradeCard,
  previewIntervals,
  RETENTION,
  statusOf,
} from "@/lib/srs";
import { IconClose, IconSpeakerLg } from "@/ui/icons";
import { btn, Enso, Kbd, Skel } from "@/ui/primitives";
import { PlayerControls, useStrokePlayer } from "@/ui/stroke-player";
import { type Item, kindOf, makeItems } from "./items";
import { Summary, type SummaryRow } from "./summary";
import {
  freshWrite,
  type WriteState,
  WritingPad,
  type WritingPadHandle,
  writeScore,
} from "./writing-pad";

type Phase = "ask" | "reveal";

type Prepared = {
  items: Item[];
  cards: Map<string, StudyCard>;
  practice: boolean;
};

async function prepare(
  index: KanjiIndex,
  fetchStrokes: (
    k: string,
    bundled: boolean,
  ) => Promise<StrokeData | undefined>,
  practiceK: string | null,
  extraNew: number,
): Promise<Prepared> {
  const cards = new Map((await db.cards.toArray()).map((c) => [c.k, c]));
  if (practiceK) {
    const k = index.by.get(practiceK);
    await fetchStrokes(practiceK, !!k?.sv);
    return {
      items: [
        {
          type: "write",
          k: practiceK,
          label: "Praticar escrita",
          isNew: false,
        },
      ],
      cards,
      practice: true,
    };
  }
  const reviews = await db.reviews.toArray();
  const s = getSettings();
  const queue = buildQueue(index, cards, {
    dailyGoal: s.dailyGoal,
    newPerDay: s.newPerDay + extraNew,
    newToday: extraNew ? 0 : countNewToday(reviews),
    kanaFirst: s.kanaFirst,
  });
  const strokes = new Map<string, StrokeData | undefined>();
  await Promise.all(
    queue.map(async ({ k }) =>
      strokes.set(
        k,
        // yōon pairs (きゃ) have no stroke file of their own
        index.by.get(k)?.kana && !index.by.get(k)?.sv
          ? undefined
          : await fetchStrokes(k, !!index.by.get(k)?.sv).catch(() => undefined),
      ),
    ),
  );
  return {
    items: makeItems(queue, index, cards, strokes),
    cards,
    practice: false,
  };
}

export function StudySession() {
  const router = useRouter();
  const params = useSearchParams();
  const practiceK = params.get("escrever");
  const qc = useQueryClient();
  const { data: index, isError, refetch } = useKanjiIndex();
  const [prep, setPrep] = useState<Prepared | null>(null);
  const [extra, setExtra] = useState(0);
  const [round, setRound] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new round re-plans the session
  useEffect(() => {
    if (!index) return;
    let alive = true;
    setPrep(null);
    prepare(
      index,
      (k, b) => qc.fetchQuery(strokesQuery(k, b)),
      practiceK,
      extra,
    ).then((p) => alive && setPrep(p));
    return () => {
      alive = false;
    };
  }, [index, practiceK, extra, qc, round]);

  if (isError)
    return (
      <Frame onExit={() => router.push("/")}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <span className="text-ink-2">
            Não foi possível carregar os kanji.
          </span>
          <button
            type="button"
            onClick={() => refetch()}
            className={btn.secondary}
          >
            Tentar de novo
          </button>
        </div>
      </Frame>
    );

  if (!prep || !index)
    return (
      <Frame onExit={() => router.push("/")}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <Skel w={160} h={14} />
          <span className="label-mono">Preparando a sessão</span>
        </div>
      </Frame>
    );

  if (!prep.items.length)
    return (
      <Frame onExit={() => router.push("/")}>
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <Enso size={110} />
          <div className="flex flex-col gap-2">
            <span lang="ja" className="font-min text-4xl font-semibold">
              完了
            </span>
            <span className="text-lg">Tudo em dia por hoje</span>
            <span className="max-w-sm text-sm text-pretty text-ink-3">
              Nenhuma revisão pendente e a cota de kanji novos de hoje já foi.
              Quer ir além?
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              className={btn.primary}
              onClick={() => setExtra((e) => e + 5)}
            >
              Aprender mais 5 kanji
            </button>
            <Link href="/progresso" className={`${btn.secondary} no-underline`}>
              Ver meu progresso
            </Link>
          </div>
        </div>
      </Frame>
    );

  return (
    <Runner
      key={`${round}-${extra}-${practiceK}`}
      prep={prep}
      index={index}
      onExit={() =>
        router.push(practiceK ? `/${encodeURIComponent(practiceK)}` : "/")
      }
      onAgain={() => setRound((r) => r + 1)}
    />
  );
}

function Frame({
  children,
  onExit,
  header,
}: {
  children: React.ReactNode;
  onExit: () => void;
  header?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[880px] flex-col gap-6 p-[clamp(16px,4cqi,40px)]">
      <header className="grid grid-cols-[44px_1fr_auto] items-center gap-4">
        <button
          type="button"
          onClick={onExit}
          aria-label="Sair da sessão (Esc)"
          className="grid size-11 place-items-center border border-line transition-colors hover:border-ink"
        >
          <IconClose />
        </button>
        {header ?? <span />}
      </header>
      {children}
    </div>
  );
}

const startPhase = (x?: Item): Phase =>
  x?.type === "flip" && x.isNew ? "reveal" : "ask";

/** First contact with a kanji: teach it (strokes, meaning, readings, a word) instead of quizzing. */
function NewKanjiIntro({
  k,
  strokes,
  word,
}: {
  k: Kanji;
  strokes: StrokeData | undefined;
  word?: Word;
}) {
  const { data: index } = useKanjiIndex();
  const player = useStrokePlayer(k.k, strokes, { autoplay: 350 });
  const { romaji: showRomaji } = getSettings();
  const kana = k.kana;
  const mn = kana
    ? kana.origin
      ? kana.script === "hiragana"
        ? `Nasceu da escrita cursiva de ${kana.origin}.`
        : `É um pedaço de ${kana.origin}.`
      : `${[...k.k][0]} + ${[...k.k][1]} pequeno: as duas sílabas se fundem em uma só.`
    : mnemonicFor(k, index);
  return (
    <div className="grid w-full max-w-[720px] grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] items-center gap-x-10 gap-y-6 text-left">
      <div className="flex flex-col items-center gap-3">
        <div className="relative aspect-square w-full max-w-[260px]">
          <div ref={player.ref} className="absolute inset-0" />
          {!strokes?.p.length && (
            <span
              lang="ja"
              className={`absolute inset-0 grid place-items-center font-k leading-none ${[...k.k].length > 1 ? "text-[120px]" : "text-[200px]"}`}
            >
              {k.k}
            </span>
          )}
        </div>
        {!!strokes?.p.length && (
          <PlayerControls player={player} speeds={false} />
        )}
      </div>
      <div className="flex flex-col gap-4">
        <span className="label-mono !text-hanko">
          {kana ? `${kana.script} novo · observe` : "Kanji novo · observe"}
        </span>
        <span className="text-[clamp(30px,5cqi,40px)] font-light leading-tight">
          {meaningOf(k)}
        </span>
        <div className="flex flex-col gap-2">
          {kana && (
            <span className="flex items-baseline gap-3">
              <span className="w-9 font-mono text-[10px] tracking-[.12em] text-ink-3">
                PAR
              </span>
              <span lang="ja" className="font-k text-xl">
                {kana.pair}
              </span>
              <span className="font-mono text-xs text-ink-3">
                {kana.script === "hiragana" ? "katakana" : "hiragana"}
              </span>
            </span>
          )}
          {k.on.length > 0 && (
            <span className="flex items-baseline gap-3">
              <span className="w-9 font-mono text-[10px] tracking-[.12em] text-ink-3">
                ON
              </span>
              <span
                lang="ja"
                className="font-goth text-xl font-medium tracking-[.06em]"
              >
                {k.on.slice(0, 3).join("・")}
              </span>
              {showRomaji && (
                <span className="font-mono text-xs text-ink-3">
                  {k.on.slice(0, 3).map(romaji).join(" · ")}
                </span>
              )}
            </span>
          )}
          {k.kun.length > 0 && (
            <span className="flex items-baseline gap-3">
              <span className="w-9 font-mono text-[10px] tracking-[.12em] text-ink-3">
                KUN
              </span>
              <span lang="ja" className="font-min text-xl">
                {k.kun.slice(0, 3).map(cleanReading).join("・")}
              </span>
              {showRomaji && (
                <span className="font-mono text-xs text-ink-3">
                  {k.kun.slice(0, 3).map(romaji).join(" · ")}
                </span>
              )}
            </span>
          )}
        </div>
        {word && (
          <button
            type="button"
            onClick={() => speak(word.r)}
            className="flex items-end gap-4 self-start border-b border-line pb-2 text-left transition-colors hover:border-ink"
          >
            {word.w === word.r ? (
              <span lang="ja" className="font-min text-2xl leading-none">
                {word.w}
              </span>
            ) : (
              <ruby lang="ja" className="font-min text-2xl leading-none">
                {word.w}
                <rt className="pb-1">{word.r}</rt>
              </ruby>
            )}
            <span className="pb-0.5 text-sm text-ink-2">{word.g}</span>
          </button>
        )}
        {mn && (
          <p className="m-0 text-sm leading-relaxed text-pretty text-ink-2">
            {mn}
          </p>
        )}
      </div>
    </div>
  );
}

const WAVE = "M2 8 C 60 5, 120 10, 200 7 S 340 5, 398 8";

function Runner({
  prep,
  index,
  onExit,
  onAgain,
}: {
  prep: Prepared;
  index: KanjiIndex;
  onExit: () => void;
  onAgain: () => void;
}) {
  const { items, cards, practice } = prep;
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>(() => startPhase(items[0]));
  const [pick, setPick] = useState<number | null>(null);
  const [built, setBuilt] = useState<number[]>([]);
  const [w, setW] = useState<WriteState>(freshWrite);
  const [ghost, setGhost] = useState(() => getSettings().ghostGuide);
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [started] = useState(() => Date.now());
  const [ended, setEnded] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const pad_ = useRef<WritingPadHandle>(null);
  const masteredBefore = useMemo(
    () =>
      new Set(
        [...cards.values()]
          .filter((c) => statusOf(c) === "mastered")
          .map((c) => c.k),
      ),
    [cards],
  );

  const it = items[i];
  const k = it ? index.by.get(it.k) : undefined;
  const { data: strokes } = useStrokes(it?.k, !!k?.sv);

  const correct = useMemo(() => {
    if (!it || phase !== "reveal") return null;
    if (it.type === "mc") return pick === it.ans;
    if (it.type === "build")
      return built.map((b) => it.tiles[b]).join("") === it.target.join("");
    if (it.type === "write") return writeScore(w) >= 70;
    return true;
  }, [it, phase, pick, built, w]);

  const ws = writeScore(w);
  const suggested = !it
    ? 2
    : it.type === "flip"
      ? 2
      : it.type === "write"
        ? ws >= 92
          ? 3
          : ws >= 70
            ? 2
            : ws >= 50
              ? 1
              : 0
        : correct
          ? 2
          : 0;
  const intervals = useMemo(
    () => (it ? previewIntervals(cards.get(it.k)) : []),
    [it, cards],
  );

  const answer = useCallback(
    (n: number) => {
      if (phase !== "ask" || it?.type !== "mc") return;
      setPick(n);
      setPhase("reveal");
      if (it.mode !== "reading" && k)
        speak(k.kana ? k.k : (k.on[0] ?? cleanReading(k.kun[0] ?? "")));
    },
    [phase, it, k],
  );
  const flip = useCallback(() => {
    if (it?.type !== "flip" || phase !== "ask") return;
    setPhase("reveal");
    if (k) speak(k.kana ? k.k : cleanReading(k.kun[0] ?? k.on[0] ?? ""));
  }, [it, phase, k]);
  const tap = useCallback(
    (n: number) => {
      if (
        it?.type !== "build" ||
        phase !== "ask" ||
        built.includes(n) ||
        n >= it.tiles.length
      )
        return;
      const b = [...built, n];
      setBuilt(b);
      if (b.length === it.target.length) {
        setTimeout(() => setPhase("reveal"), 260);
        speak(it.reading);
      }
    },
    [it, phase, built],
  );

  const grade = useCallback(
    async (g: number) => {
      if (!it || phase !== "reveal" || busy) return;
      setBusy(true);
      const ok = it.type === "flip" ? g > 0 : !!correct;
      const score = it.type === "write" ? ws : undefined;
      if (!practice || cards.has(it.k)) {
        if (!cards.has(it.k)) await addToStudy(it.k);
        await gradeCard(it.k, (g + 1) as Grade, {
          kind: kindOf(it),
          ok,
          score,
        });
      }
      const row: SummaryRow = { k: it.k, label: it.label, ok, g, score };
      setRows((r) => [...r, row]);
      if (i + 1 >= items.length) {
        setEnded(Date.now());
      } else {
        const advance = () => {
          setI(i + 1);
          setPhase(startPhase(items[i + 1]));
          setPick(null);
          setBuilt([]);
          setW(freshWrite());
        };
        if (document.startViewTransition && !isReduced())
          document.startViewTransition(() => flushSync(advance));
        else advance();
      }
      setBusy(false);
    },
    [it, phase, busy, correct, ws, practice, cards, i, items],
  );

  // keyboard: 1–4 answer/grade, Space flip/apply suggested, H hint, Esc exit
  const keys = useRef({
    answer,
    flip,
    tap,
    grade,
    suggested,
    phase,
    it,
    onExit,
  });
  keys.current = { answer, flip, tap, grade, suggested, phase, it, onExit };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey
      )
        return;
      const r = keys.current;
      if (e.key === "Escape") return r.onExit();
      if (!r.it) return;
      if (r.phase === "ask") {
        if (r.it.type === "mc" && /^[1-4]$/.test(e.key))
          r.answer(Number(e.key) - 1);
        if (r.it.type === "build" && /^[1-6]$/.test(e.key))
          r.tap(Number(e.key) - 1);
        if (r.it.type === "flip" && e.key === " ") {
          e.preventDefault();
          r.flip();
        }
        if (r.it.type === "write" && e.key === "h") pad_.current?.hint();
      } else if (/^[1-4]$/.test(e.key)) r.grade(Number(e.key) - 1);
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        r.grade(r.suggested);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (ended)
    return (
      <Summary
        rows={rows}
        seconds={Math.max(1, Math.round((ended - started) / 1000))}
        masteredBefore={masteredBefore}
        index={index}
        onAgain={onAgain}
      />
    );
  if (!it || !k) return null;

  const pct = Math.round(
    ((i + (phase === "reveal" ? 1 : 0)) / items.length) * 100,
  );
  const reveal = phase === "reveal";
  const glyphOpts =
    it.type === "mc" && (it.mode === "pick" || it.mode === "audio");

  let rTitle = "";
  let rNote = "";
  let rTone = "text-ink";
  if (reveal) {
    if (it.type === "mc") {
      rTitle = correct ? "Correto" : `Resposta: ${it.opts[it.ans].l}`;
      rTone = correct ? "text-ink" : "text-hanko";
      if (!correct && pick !== null) {
        const pk = it.opts[pick];
        rNote = it.kana
          ? it.mode === "sound"
            ? `“${pk.l}” é o som de ${pk.sub}.`
            : `${pk.l} se lê “${pk.sub}”. Compare a forma com ${it.k}.`
          : it.mode === "pick" || it.mode === "audio"
            ? `${pk.l} significa “${pk.sub}”. Repare na diferença de forma com ${it.k}.`
            : it.mode === "meaning"
              ? `“${pk.l}” é o significado de ${pk.sub}.`
              : `${pk.l} é leitura de ${pk.k}.`;
      }
    } else if (it.type === "build") {
      rTitle = correct
        ? "Palavra montada"
        : `Ordem correta: ${it.target.join("")}`;
      rTone = correct ? "text-ink" : "text-hanko";
    } else if (it.type === "write") {
      rTitle = `Precisão ${ws}%${w.err ? ` · ${w.err} correç${w.err > 1 ? "ões" : "ão"}` : " · sem erros"}`;
      rTone = ws >= 70 ? "text-ink" : "text-hanko";
    } else
      rTitle = it.isNew
        ? "Quando tiver absorvido, diga como foi"
        : "Como foi lembrar?";
  }
  const kun = cleanReading(k.kun[0] ?? "");
  const builtChars = built.map((b) => (it.type === "build" ? it.tiles[b] : ""));

  return (
    <Frame
      onExit={onExit}
      header={
        <>
          <svg
            viewBox="0 0 400 14"
            preserveAspectRatio="none"
            className="h-3.5 w-full overflow-visible"
            role="progressbar"
            aria-label="Progresso da sessão"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <path
              d={WAVE}
              pathLength={100}
              fill="none"
              stroke="var(--line)"
              strokeWidth={2}
              strokeLinecap="round"
            />
            <path
              d={WAVE}
              pathLength={100}
              fill="none"
              stroke="var(--ink)"
              strokeWidth={4}
              strokeLinecap="round"
              strokeDasharray={`${pct} 200`}
              strokeOpacity={pct ? 1 : 0}
              style={{
                transition: "stroke-dasharray .7s cubic-bezier(.65,0,.35,1)",
              }}
            />
          </svg>
          <span className="font-mono text-xs tabular-nums">
            {pad(i + 1)} / {pad(items.length)}
          </span>
        </>
      }
    >
      <div className="-mt-2 flex items-center justify-between font-mono text-[10px] tracking-[.12em] text-ink-3 uppercase">
        <span>{it.label}</span>
        <span>{practice ? "PRÁTICA" : it.isNew ? "NOVO" : "REVISÃO"}</span>
      </div>

      <div className="flex min-h-60 flex-1 flex-col items-center justify-center gap-6 text-center">
        {it.type === "mc" &&
          (it.mode === "meaning" ||
            it.mode === "reading" ||
            it.mode === "sound") && (
            <>
              <span
                lang="ja"
                className="font-k text-[clamp(120px,26cqi,220px)] leading-none"
              >
                {it.k}
              </span>
              <span className="text-base text-ink-2">{it.q}</span>
            </>
          )}
        {it.type === "mc" && it.mode === "pick" && (
          <>
            <span className="text-[clamp(44px,8cqi,72px)] font-light leading-none tracking-[-.02em]">
              {it.q}
            </span>
            <span className="text-[15px] text-ink-3">{it.qsub}</span>
          </>
        )}
        {it.type === "mc" && it.mode === "audio" && (
          <>
            <button
              type="button"
              onClick={() => speak(it.q)}
              aria-label="Ouvir palavra"
              className="press grid size-[132px] place-items-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-paper"
            >
              <IconSpeakerLg size={40} strokeWidth={1.2} />
            </button>
            <span className="text-[15px] text-ink-2">
              Ouça e escolha o kanji
            </span>
            {reveal && (
              <span lang="ja" className="font-min text-[22px]">
                {it.q}
              </span>
            )}
          </>
        )}
        {it.type === "flip" && it.isNew && (
          <NewKanjiIntro k={k} strokes={strokes} word={it.word} />
        )}
        {it.type === "flip" && !it.isNew && (
          <div className="flex flex-col items-center gap-5">
            <span
              lang="ja"
              className="font-k text-[clamp(120px,26cqi,220px)] leading-none"
            >
              {it.k}
            </span>
            {reveal ? (
              <div className="flex flex-col items-center gap-2.5">
                <span className="text-[32px] font-light">{meaningOf(k)}</span>
                <span
                  lang="ja"
                  className="flex flex-wrap justify-center gap-4 text-xl"
                >
                  <span className="font-goth font-medium tracking-[.06em]">
                    {k.on.join("・")}
                  </span>
                  <span className="font-min">
                    {k.kun.slice(0, 3).map(cleanReading).join("・")}
                  </span>
                </span>
                {it.word && (
                  <span className="mt-2 flex flex-col items-center gap-1">
                    <ruby lang="ja" className="font-min text-[22px]">
                      {it.word.w}
                      <rt>{it.word.r}</rt>
                    </ruby>
                    <span className="text-xs text-ink-3">{it.word.g}</span>
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span className="text-[15px] text-ink-2">
                  Lembre o significado e a leitura, depois confira.
                </span>
                <button
                  type="button"
                  onClick={flip}
                  className={`${btn.secondary} gap-3`}
                >
                  Mostrar resposta
                  <Kbd>ESPAÇO</Kbd>
                </button>
              </div>
            )}
          </div>
        )}
        {it.type === "build" && (
          <div className="flex flex-col items-center gap-7">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-[clamp(30px,6cqi,44px)] font-light">
                {it.gloss}
              </span>
              <span
                lang="ja"
                className="min-h-[22px] font-min text-base text-ink-3"
              >
                {reveal ? it.reading : ""}
              </span>
            </div>
            <div className="flex gap-2">
              {it.target.map((_, n) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed slots
                  key={n}
                  lang="ja"
                  className="grid size-[76px] place-items-center border-b-2 font-k text-[46px]"
                  style={{
                    borderColor: builtChars[n]
                      ? reveal && !correct
                        ? "var(--hanko)"
                        : "var(--ink)"
                      : "var(--line-2)",
                    color: reveal && !correct ? "var(--hanko)" : "var(--ink)",
                  }}
                >
                  {builtChars[n]}
                </span>
              ))}
            </div>
          </div>
        )}
        {it.type === "write" && strokes && (
          <div className="flex w-full flex-col items-center gap-3.5">
            <div className="flex items-baseline gap-4">
              <span lang="ja" className="font-k text-[28px]">
                {it.k}
              </span>
              <span className="text-[15px] text-ink-2">{meaningOf(k)}</span>
              <span className="font-mono text-[11px] text-ink-3">
                TRAÇO {pad(Math.min(w.i + 1, strokes.p.length))} /{" "}
                {pad(strokes.p.length)}
              </span>
            </div>
            <WritingPad
              ref={pad_}
              kanji={it.k}
              data={strokes}
              ghost={ghost}
              state={w}
              onChange={(s) => {
                setW(s);
                if (s.done) {
                  setPhase("reveal");
                  speak(k.kana ? k.k : cleanReading(k.kun[0] ?? k.on[0] ?? ""));
                }
              }}
            />
            <span
              role="status"
              className={`min-h-5 text-sm ${w.tone === "err" ? "text-hanko" : w.tone === "ok" ? "text-ink" : "text-ink-3"}`}
            >
              {w.msg}
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              <button
                type="button"
                aria-pressed={ghost}
                onClick={() => setGhost((g) => !g)}
                className="border border-line-2 px-3.5 py-[9px] text-[13px] transition-colors hover:border-ink"
              >
                Guia fantasma: {ghost ? "on" : "off"}
              </button>
              <button
                type="button"
                onClick={() => pad_.current?.hint()}
                className="flex items-center gap-2 border border-line-2 px-3.5 py-[9px] text-[13px] transition-colors hover:border-ink"
              >
                Dica <span className="font-mono text-[10px] text-ink-3">H</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setW(freshWrite());
                  setPhase("ask");
                }}
                className="border border-line-2 px-3.5 py-[9px] text-[13px] transition-colors hover:border-ink"
              >
                Recomeçar
              </button>
            </div>
          </div>
        )}
      </div>

      {reveal && (
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className={`text-[17px] ${rTone}`}>{rTitle}</span>
          <span
            lang="ja"
            className={`text-sm text-ink-2 ${it.type === "flip" && it.isNew ? "hidden" : ""}`}
          >
            {k.kana
              ? `${k.k} · ${k.kana.r} · par ${k.kana.pair}`
              : `${k.k} · ${k.on[0] ?? ""} ${kun && `· ${kun}`} — ${meaningOf(k)}`}
          </span>
          {rNote && (
            <span className="max-w-[480px] text-[13px] text-pretty text-ink-3">
              {rNote}
            </span>
          )}
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-2.5">
        {it.type === "mc" && !glyphOpts && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-2">
            {it.opts.map((o, n) => {
              const isAns = n === it.ans;
              const isPick = n === pick;
              return (
                <button
                  type="button"
                  key={o.l}
                  onClick={() => answer(n)}
                  disabled={reveal}
                  className="press grid min-h-6 grid-cols-[24px_1fr_auto] items-center gap-3.5 border px-[18px] py-4 text-left transition-[border-color,opacity] hover:border-ink disabled:cursor-default"
                  style={{
                    borderColor: reveal
                      ? isAns
                        ? "var(--ink)"
                        : isPick
                          ? "var(--hanko)"
                          : "var(--line)"
                      : "var(--line-2)",
                    background:
                      reveal && isAns ? "var(--ghost)" : "var(--paper)",
                    opacity: reveal && !isAns && !isPick ? 0.4 : 1,
                  }}
                >
                  <span className="font-mono text-[11px] text-ink-3">
                    {n + 1}
                  </span>
                  <span
                    lang={it.mode === "reading" ? "ja" : "pt"}
                    className={`text-[19px] ${it.mode === "reading" ? "font-goth" : it.mode === "sound" ? "font-mono" : ""}`}
                    style={{
                      color:
                        reveal && isPick && !isAns ? "var(--hanko)" : undefined,
                    }}
                  >
                    {o.l}
                  </span>
                  <span lang="ja" className="font-mono text-[11px] text-ink-3">
                    {reveal ? o.sub : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        {it.type === "mc" && glyphOpts && (
          <div className="grid grid-cols-4 gap-2">
            {it.opts.map((o, n) => {
              const isAns = n === it.ans;
              const isPick = n === pick;
              return (
                <button
                  type="button"
                  key={o.l}
                  onClick={() => answer(n)}
                  disabled={reveal}
                  aria-label={`${n + 1}: ${o.l}`}
                  className="press relative grid aspect-square place-items-center border transition-[border-color,opacity] hover:border-ink disabled:cursor-default"
                  style={{
                    borderColor: reveal
                      ? isAns
                        ? "var(--ink)"
                        : isPick
                          ? "var(--hanko)"
                          : "var(--line)"
                      : "var(--line-2)",
                    background:
                      reveal && isAns ? "var(--ghost)" : "var(--paper)",
                    opacity: reveal && !isAns && !isPick ? 0.4 : 1,
                  }}
                >
                  <span className="absolute top-1.5 left-2 font-mono text-[10px] text-ink-3">
                    {n + 1}
                  </span>
                  <span
                    lang="ja"
                    className="font-k text-[clamp(40px,9cqi,64px)] leading-none"
                    style={{
                      color:
                        reveal && isPick && !isAns ? "var(--hanko)" : undefined,
                    }}
                  >
                    {o.l}
                  </span>
                  {reveal && (
                    <span className="absolute bottom-1.5 px-1 text-[11px] leading-tight text-ink-3">
                      {o.sub}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {it.type === "build" && !reveal && (
          <>
            <div className="grid grid-cols-6 gap-1.5">
              {it.tiles.map((c, n) => (
                <button
                  type="button"
                  // biome-ignore lint/suspicious/noArrayIndexKey: tiles may repeat glyphs
                  key={n}
                  onClick={() => tap(n)}
                  className="press relative grid aspect-square place-items-center border border-line-2 transition-[border-color,opacity] hover:border-ink"
                  style={{ opacity: built.includes(n) ? 0.25 : 1 }}
                >
                  <span className="absolute top-1 left-1.5 font-mono text-[9px] text-ink-3">
                    {n + 1}
                  </span>
                  <span
                    lang="ja"
                    className="font-k text-[clamp(26px,6cqi,40px)]"
                  >
                    {c}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setBuilt((b) => b.slice(0, -1))}
              className="self-center p-2 text-[13px] text-ink-3 hover:text-ink"
            >
              Desfazer
            </button>
          </>
        )}
        {reveal && (
          <>
            <div className="grid grid-cols-4 gap-1.5">
              {["Errei", "Difícil", "Bom", "Fácil"].map((l, n) => {
                const on = n === suggested;
                return (
                  <button
                    type="button"
                    key={l}
                    onClick={() => grade(n)}
                    disabled={busy}
                    className="press flex min-h-11 flex-col items-center gap-1 border px-1 py-3"
                    style={{
                      borderColor: on ? "var(--ink)" : "var(--line-2)",
                      background: on ? "var(--ink)" : "var(--paper)",
                      color: on
                        ? "var(--paper)"
                        : n === 0
                          ? "var(--hanko)"
                          : "var(--ink)",
                    }}
                  >
                    <span className="text-[15px]">{l}</span>
                    <span className="font-mono text-[11px] opacity-75">
                      {fmtInterval(intervals[n] ?? 0)}
                    </span>
                    <span className="font-mono text-[9px] opacity-50">
                      {n + 1}
                    </span>
                  </button>
                );
              })}
            </div>
            <span className="text-center font-mono text-[10px] tracking-[.06em] text-ink-3">
              FSRS · RETENÇÃO-ALVO {Math.round(RETENTION * 100)}% · ESPAÇO =
              SUGERIDO
            </span>
          </>
        )}
      </div>
    </Frame>
  );
}
