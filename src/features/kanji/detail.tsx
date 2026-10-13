"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, ViewTransition } from "react";
import { KanaDetail } from "@/features/kana/kana-detail";
import {
  collectionOf,
  componentName,
  gradeLabel,
  isKanaString,
  type Kanji,
  meaningOf,
  pad,
  statusLabel,
  useKanjiIndex,
  useRemoteKanji,
  useStrokes,
} from "@/lib/data";
import { db, touchRecent } from "@/lib/db";
import { mnemonicFor } from "@/lib/mnemonics";
import { isReduced } from "@/lib/motion";
import { getNavContext, vtName } from "@/lib/nav-context";
import { setSettings, useSettings } from "@/lib/settings";
import { speak } from "@/lib/speech";
import { addToStudy, setMastered, statusOf, useCards } from "@/lib/srs";
import { IconBack, IconLeft, IconRight, IconSpeaker } from "@/ui/icons";
import { btn, Enso, SectionLabel, Skel } from "@/ui/primitives";
import { KunReading, OnChip } from "@/ui/readings";
import { clearStamp, stamp } from "@/ui/stamp";
import { PlayerControls, useStrokePlayer } from "@/ui/stroke-player";
import { useToast } from "@/ui/toast";

type Ctx = { label: string; href: string; list: string[] };

function useNavList(
  k: Kanji | undefined,
  index: ReturnType<typeof useKanjiIndex>["data"],
): Ctx | null {
  const [stored] = useState(() =>
    typeof window === "undefined" ? null : getNavContext(),
  );
  return useMemo(() => {
    if (!k) return null;
    if (stored) {
      const list = [...stored.list];
      if (list.includes(k.k))
        return { label: stored.label, href: stored.href, list };
    }
    if (!index || k.i < 0) return null;
    const c = collectionOf(k);
    return {
      label: c.label,
      href: `/${c.id}`,
      list: index.list.filter(c.test).map((x) => x.k),
    };
  }, [k, index, stored]);
}

export function KanjiDetail({ character }: { character: string }) {
  if (isKanaString(character)) return <KanaDetail character={character} />;
  return <KanjiDetailInner character={character} />;
}

function KanjiDetailInner({ character }: { character: string }) {
  const { data: index, isPending: indexPending } = useKanjiIndex();
  const local = index?.by.get(character);
  const remote = useRemoteKanji(character, !!index && !local);
  const k = local ?? remote.data;
  const notFound = !!index && !local && remote.isError;

  useEffect(() => {
    if (k) touchRecent(k.k);
  }, [k]);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-[clamp(28px,5cqi,56px)] p-[clamp(16px,4.5cqi,56px)]">
      {notFound ? (
        <NotFoundKanji character={character} />
      ) : (
        <DetailBody
          character={character}
          k={k}
          loading={indexPending || (!local && remote.isPending)}
        />
      )}
    </div>
  );
}

function NotFoundKanji({ character }: { character: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <Enso size={120} />
      <div className="flex flex-col gap-2">
        <span lang="ja" className="font-k text-6xl">
          {character}
        </span>
        <span className="text-lg">Este caractere não está no dicionário.</span>
        <span className="text-sm text-ink-3">
          Talvez seja kana, pontuação ou um kanji muito raro.
        </span>
      </div>
      <Link href="/" className={`${btn.secondary} no-underline`}>
        Voltar a explorar
      </Link>
    </div>
  );
}

function DetailBody({
  character,
  k,
  loading,
}: {
  character: string;
  k: Kanji | undefined;
  loading: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const { data: index } = useKanjiIndex();
  const cards = useCards();
  const settings = useSettings();
  const strokes = useStrokes(
    k ? character : undefined,
    k ? k.i >= 0 && !!k.sv : true,
  );
  const nav = useNavList(k, index);
  const card = cards?.get(character);
  const status = statusOf(card);
  const stampHost = useRef<HTMLDivElement>(null);
  const glyph = useRef<HTMLSpanElement>(null);
  const [stamping, setStamping] = useState(false);

  // the text glyph flew in via the view transition; hand over to the brush once it lands
  const player = useStrokePlayer(character, strokes.data, {
    autoplay: null,
    onStart: () => {
      const g = glyph.current;
      if (g && g.style.opacity !== "0") {
        g.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: isReduced() ? 120 : 420,
          easing: "ease-out",
          fill: "forwards",
        });
        g.style.opacity = "0";
      }
    },
  });
  const { play } = player;
  useEffect(() => {
    if (!strokes.data?.p.length) return;
    const t = setTimeout(() => play(), isReduced() ? 80 : 560);
    return () => clearTimeout(t);
  }, [strokes.data, play]);

  const pos = nav ? nav.list.indexOf(character) : -1;
  const prev =
    nav && pos >= 0
      ? nav.list[(pos - 1 + nav.list.length) % nav.list.length]
      : null;
  const next = nav && pos >= 0 ? nav.list[(pos + 1) % nav.list.length] : null;
  const go = (c: string | null) =>
    c && router.push(`/${encodeURIComponent(c)}`);
  const back = () => router.push(nav?.href ?? "/");

  const keys = useRef({ prev, next, back, toggle: player.toggle });
  keys.current = { prev, next, back, toggle: player.toggle };
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
      if (document.querySelector('[role="dialog"]')) return;
      const r = keys.current;
      if (e.key === "j") go(r.next);
      else if (e.key === "k") go(r.prev);
      else if (e.key === "p" || (e.key === " " && t.tagName !== "BUTTON")) {
        e.preventDefault();
        r.toggle();
      } else if (e.key === "Escape") r.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const swipe = useRef<[number, number] | null>(null);

  const master = async () => {
    if (status === "mastered") {
      await setMastered(character, false);
      toast("Removido dos dominados");
      return;
    }
    setStamping(true);
    await stamp(stampHost.current);
    await setMastered(character, true);
    setStamping(false);
    clearStamp(stampHost.current);
  };
  const add = async () => {
    if (await addToStudy(character))
      toast("Adicionado aos estudos · primeira revisão hoje");
    else toast("Já está nos seus estudos");
  };

  const meta: [string, string][] = k
    ? [
        ["TRAÇOS", pad(k.s)],
        ["JLPT", k.j ? `N${k.j}` : "—"],
        ["SÉRIE", gradeLabel(k.g)],
        ["FREQ.", k.f ? `#${k.f}` : "—"],
        ["UNICODE", `U+${k.u}`],
        ["PALAVRAS", strokes.data ? String(strokes.data.wt) : "…"],
      ]
    : [];

  return (
    <>
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={back} className={`${btn.ghost} py-2`}>
          <IconBack />
          {nav?.label ?? "Explorar"}
        </button>
        {nav && pos >= 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => go(prev)}
              aria-label="Kanji anterior (K)"
              className="flex items-center gap-2 border border-line px-2.5 py-1.5 transition-colors hover:border-ink"
            >
              <IconLeft size={14} />
              <span lang="ja" className="font-k text-lg">
                {prev}
              </span>
            </button>
            <span className="px-2.5 font-mono text-[11px] text-ink-3 tabular-nums">
              {pad(pos + 1, 3)} / {pad(nav.list.length, 3)}
            </span>
            <button
              type="button"
              onClick={() => go(next)}
              aria-label="Próximo kanji (J)"
              className="flex items-center gap-2 border border-line px-2.5 py-1.5 transition-colors hover:border-ink"
            >
              <span lang="ja" className="font-k text-lg">
                {next}
              </span>
              <IconRight size={14} />
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] items-start gap-[clamp(32px,6cqi,88px)]">
        <div className="flex flex-col gap-5 shell:sticky shell:top-6">
          <div
            ref={stampHost}
            onPointerDown={(e) => {
              swipe.current = [e.clientX, e.clientY];
            }}
            onPointerUp={(e) => {
              if (!swipe.current) return;
              const dx = e.clientX - swipe.current[0];
              const dy = e.clientY - swipe.current[1];
              swipe.current = null;
              if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
                go(dx < 0 ? next : prev);
            }}
            className="@container relative mx-auto aspect-square w-full max-w-[560px] touch-pan-y"
          >
            <div ref={player.ref} className="absolute inset-0" />
            <ViewTransition name={vtName(character)}>
              <span
                ref={glyph}
                lang="ja"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex items-center justify-center font-k text-[84cqi] leading-none"
              >
                {character}
              </span>
            </ViewTransition>
            {status === "mastered" && !stamping && (
              <span
                role="img"
                aria-label="Dominado"
                className="absolute right-[4%] bottom-[4%] grid aspect-square w-[18%]"
              >
                <HankoFluid />
              </span>
            )}
          </div>
          {strokes.data?.p.length ? (
            <div className="flex justify-center">
              <PlayerControls player={player} />
            </div>
          ) : strokes.isPending ? null : (
            <p className="text-center text-xs text-ink-3">
              Ordem dos traços indisponível para este caractere.
            </p>
          )}
          <dl className="hairline-grid m-0 grid-cols-3">
            {(meta.length
              ? meta
              : Array.from(
                  { length: 6 },
                  (_, i) => [String(i), ""] as [string, string],
                )
            ).map(([l, v]) => (
              <div key={l} className="flex flex-col gap-1 px-3.5 py-3">
                <dt className="font-mono text-[10px] tracking-[.1em] text-ink-3">
                  {v ? l : " "}
                </dt>
                <dd className="m-0 font-mono text-[15px]">{v || " "}</dd>
              </div>
            ))}
          </dl>
        </div>

        {k ? (
          <InfoColumn
            key={k.k}
            k={k}
            status={status}
            words={strokes.data?.w}
            wordsState={
              strokes.isError ? "error" : strokes.isPending ? "loading" : "ok"
            }
            retryWords={() => strokes.refetch()}
            romajiOn={settings.romaji}
            actions={
              <div className="sticky bottom-[72px] z-30 -mx-1 flex flex-wrap gap-1.5 border-t border-line bg-paper px-1 py-2.5 shell:static shell:mx-0 shell:gap-2 shell:border-0 shell:bg-transparent shell:px-0 shell:pt-2">
                <button
                  type="button"
                  onClick={add}
                  className={`${btn.primary} flex-auto`}
                >
                  {card ? "Nos seus estudos" : "Adicionar aos estudos"}
                </button>
                <Link
                  href={`/aprender?escrever=${encodeURIComponent(character)}`}
                  className={`${btn.secondary} flex-auto bg-paper no-underline`}
                >
                  Praticar escrita
                </Link>
                <button
                  type="button"
                  onClick={master}
                  aria-pressed={status === "mastered"}
                  className={`${btn.hanko} flex-auto bg-paper`}
                >
                  {status === "mastered" ? "Dominado" : "Marcar como dominado"}
                </button>
              </div>
            }
          />
        ) : (
          loading && (
            <div className="flex flex-col gap-6">
              <Skel w={120} />
              <Skel w="70%" h={20} />
              <Skel w="50%" />
            </div>
          )
        )}
      </div>
    </>
  );
}

/** Static seal sized to its container (container query units). */
function HankoFluid() {
  return (
    <span
      lang="ja"
      aria-hidden="true"
      className="grid size-full place-items-center rounded-[4px] bg-hanko font-min text-[9cqi] font-extrabold text-on-hanko"
      style={{
        transform: "rotate(-8deg)",
        boxShadow:
          "inset 0 0 0 3px var(--hanko), inset 0 0 0 5px var(--on-hanko)",
      }}
    >
      得
    </span>
  );
}

function InfoColumn({
  k,
  status,
  words,
  wordsState,
  retryWords,
  romajiOn,
  actions,
}: {
  k: Kanji;
  status: ReturnType<typeof statusOf>;
  words: { w: string; r: string; g: string }[] | undefined;
  wordsState: "loading" | "error" | "ok";
  retryWords: () => void;
  romajiOn: boolean;
  actions: React.ReactNode;
}) {
  const { data: index } = useKanjiIndex();
  const note = useLiveQuery(() => db.notes.get(k.k), [k.k]);
  const [draft, setDraft] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onNote = (text: string) => {
    setDraft(text);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (text.trim()) db.notes.put({ k: k.k, text, updatedAt: new Date() });
      else db.notes.delete(k.k);
    }, 400);
  };
  const defaultMn = mnemonicFor(k, index);

  const sib = (s: string) => [...s].filter((c) => c !== k.k);
  const sibs = [
    {
      t: "Mesma leitura",
      why: k.on.slice(0, 2).join("・") || "—",
      items: sib(k.so),
    },
    {
      t: "Mesmo radical",
      why: k.r ? `${k.r} ${componentName(k.r, index)}`.trim() : "—",
      items: sib(k.sr),
    },
    { t: "Fáceis de confundir", why: "forma parecida", items: sib(k.lk) },
  ].filter((g) => g.items.length);

  return (
    <div className="flex min-w-0 flex-col gap-12">
      <div className="flex flex-col gap-2.5">
        <span
          className={`label-mono ${status === "review" || status === "mastered" ? "!text-hanko" : ""}`}
        >
          {statusLabel[status]}
        </span>
        <h1 className="m-0 text-[clamp(34px,4.6cqi,56px)] font-light leading-[1.04] tracking-[-.02em] text-balance">
          {meaningOf(k)}
        </h1>
        <span className="text-[15px] text-ink-3">{k.m.join(" · ")}</span>
      </div>

      <section aria-label="Leituras" className="flex flex-col gap-5">
        <SectionLabel
          n="01"
          meta={
            <button
              type="button"
              onClick={() => setSettings({ romaji: !romajiOn })}
              aria-pressed={romajiOn}
              className="text-[11px] tracking-[.06em] text-ink-2 normal-case hover:text-ink"
            >
              romaji {romajiOn ? "on" : "off"}
            </button>
          }
        >
          Leituras
        </SectionLabel>
        <div className="grid grid-cols-[72px_1fr] items-start gap-4">
          {k.on.length > 0 && (
            <>
              <span className="flex flex-col gap-0.5 pt-1.5">
                <span className="text-[13px]">On&apos;yomi</span>
                <span lang="ja" className="font-goth text-[11px] text-ink-3">
                  音読み
                </span>
              </span>
              <div className="flex flex-wrap gap-2">
                {k.on.map((r) => (
                  <OnChip key={r} r={r} showRomaji={romajiOn} />
                ))}
              </div>
            </>
          )}
          {k.kun.length > 0 && (
            <>
              <span className="flex flex-col gap-0.5 pt-1.5">
                <span className="text-[13px]">Kun&apos;yomi</span>
                <span lang="ja" className="font-min text-[11px] text-ink-3">
                  訓読み
                </span>
              </span>
              <div className="flex flex-wrap gap-x-[18px] gap-y-1">
                {k.kun.map((r) => (
                  <KunReading key={r} r={r} showRomaji={romajiOn} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section aria-label="Vocabulário" className="flex flex-col gap-3">
        <SectionLabel
          n="02"
          meta={words?.length ? pad(words.length) : undefined}
        >
          Vocabulário
        </SectionLabel>
        {wordsState === "loading" && (
          <div className="flex flex-col gap-[18px] py-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-5">
                <Skel w={84} h={14} rot={-2} />
                <Skel w="40%" h={6} rot={0} />
              </div>
            ))}
          </div>
        )}
        {wordsState === "error" && (
          <div className="flex flex-wrap items-center justify-between gap-4 border border-line p-5">
            <span className="text-sm text-ink-2">
              Não foi possível carregar as palavras. Verifique a conexão.
            </span>
            <button
              type="button"
              onClick={retryWords}
              className="border border-ink px-3.5 py-2 text-[13px]"
            >
              Tentar de novo
            </button>
          </div>
        )}
        {wordsState === "ok" && !words?.length && (
          <p className="text-sm text-ink-3">
            Nenhuma palavra comum registrada com este kanji.
          </p>
        )}
        <div className="flex flex-col">
          {words?.map((w) => (
            <button
              type="button"
              key={w.w + w.r}
              onClick={() => speak(w.r)}
              className="grid grid-cols-[minmax(96px,auto)_1fr_auto] items-end gap-5 border-b border-line py-3.5 text-left transition-colors hover:bg-ghost"
            >
              <ruby lang="ja" className="font-min text-2xl leading-none">
                {w.w}
                <rt className="pb-1">{w.r}</rt>
              </ruby>
              <span className="pb-0.5 text-sm text-pretty text-ink-2">
                {w.g}
              </span>
              <IconSpeaker size={14} className="mb-1 text-ink-3" />
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Decomposição" className="flex flex-col gap-4">
        <SectionLabel n="03">Componentes e mnemônico</SectionLabel>
        {k.c.length > 0 && (
          <div className="hairline-grid flex flex-wrap self-start">
            {k.c.map((c) => {
              const inner = (
                <>
                  <span lang="ja" className="font-k text-[34px] leading-none">
                    {c}
                  </span>
                  <span className="text-center text-xs text-ink-3">
                    {componentName(c, index) || "—"}
                  </span>
                </>
              );
              const cls =
                "flex min-w-[84px] flex-col items-center gap-1.5 px-[18px] py-3.5 no-underline";
              return index?.by.has(c) ? (
                <Link
                  key={c}
                  href={`/${encodeURIComponent(c)}`}
                  className={`${cls} transition-colors hover:!bg-paper-2`}
                >
                  {inner}
                </Link>
              ) : (
                <div key={c} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        )}
        <label className="flex flex-col gap-2">
          <span className="text-xs text-ink-3">Seu mnemônico</span>
          <textarea
            value={draft ?? note?.text ?? ""}
            onChange={(e) => onNote(e.target.value)}
            rows={3}
            placeholder={defaultMn || "Escreva uma imagem que ajude a lembrar…"}
            className="resize-y border-0 border-b border-line-2 bg-transparent px-0 pt-1 pb-2.5 text-base leading-[1.55] text-ink outline-none focus:border-ink"
          />
        </label>
      </section>

      {sibs.length > 0 && (
        <section aria-label="Kanji irmãos" className="flex flex-col gap-4">
          <SectionLabel n="04">Kanji irmãos</SectionLabel>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6">
            {sibs.map((g) => (
              <div key={g.t} className="flex flex-col gap-2.5">
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px]">{g.t}</span>
                  <span lang="ja" className="text-xs text-ink-3">
                    {g.why}
                  </span>
                </span>
                <div className="flex flex-wrap gap-1">
                  {g.items.map((s) => {
                    const sk = index?.by.get(s);
                    return (
                      <Link
                        key={s}
                        href={`/${encodeURIComponent(s)}`}
                        title={sk ? meaningOf(sk) : undefined}
                        lang="ja"
                        className="grid size-12 place-items-center border border-line font-k text-[26px] no-underline transition-colors hover:border-ink"
                      >
                        {s}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {actions}
    </div>
  );
}
