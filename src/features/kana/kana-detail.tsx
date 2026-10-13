"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, ViewTransition } from "react";
import {
  type Kanji,
  meaningOf,
  pad,
  statusLabel,
  useKanjiIndex,
  useStrokes,
} from "@/lib/data";
import { touchRecent } from "@/lib/db";
import { isReduced } from "@/lib/motion";
import { getNavContext, vtName } from "@/lib/nav-context";
import { speak } from "@/lib/speech";
import { addToStudy, setMastered, statusOf, useCards } from "@/lib/srs";
import {
  IconBack,
  IconLeft,
  IconRight,
  IconSpeaker,
  IconSpeakerLg,
} from "@/ui/icons";
import { btn, SectionLabel, Skel } from "@/ui/primitives";
import { clearStamp, stamp } from "@/ui/stamp";
import { PlayerControls, useStrokePlayer } from "@/ui/stroke-player";
import { useToast } from "@/ui/toast";

const GROUP_LABEL = {
  basic: "básico",
  dakuten: "dakuten",
  combo: "yōon",
} as const;

export function KanaDetail({ character }: { character: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data: index } = useKanjiIndex();
  const cards = useCards();
  const k = index?.by.get(character);
  const info = k?.kana;
  const strokes = useStrokes(k?.sv ? character : undefined, true);
  const card = cards?.get(character);
  const status = statusOf(card);
  const host = useRef<HTMLDivElement>(null);
  const glyph = useRef<HTMLSpanElement>(null);
  const [stamping, setStamping] = useState(false);

  useEffect(() => {
    if (k) touchRecent(k.k);
  }, [k]);

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

  // walk through the list the user came from, or this script's table
  const [stored] = useState(() =>
    typeof window === "undefined" ? null : getNavContext(),
  );
  const nav = useMemo(() => {
    if (!index || !info) return null;
    if (stored && [...stored.list].includes(character))
      return { ...stored, list: [...stored.list] };
    const list = index.kana
      .filter(
        (x) =>
          x.kana?.script === info.script &&
          x.kana.group === info.group &&
          [...x.k].length === 1,
      )
      .map((x) => x.k);
    return {
      label: info.script === "hiragana" ? "Hiragana" : "Katakana",
      href: `/kana#${info.script}`,
      list,
    };
  }, [index, info, stored, character]);
  const pos = nav ? nav.list.indexOf(character) : -1;
  const prev =
    nav && pos >= 0
      ? nav.list[(pos - 1 + nav.list.length) % nav.list.length]
      : null;
  const next = nav && pos >= 0 ? nav.list[(pos + 1) % nav.list.length] : null;
  const go = (c: string | null) =>
    c && router.push(`/${encodeURIComponent(c)}`);
  const back = () => router.push(nav?.href ?? "/kana");

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
      else if (e.key === "p") r.toggle();
      else if (e.key === "Escape") r.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const master = async () => {
    if (status === "mastered") {
      await setMastered(character, false);
      toast("Removido dos dominados");
      return;
    }
    setStamping(true);
    await stamp(host.current);
    await setMastered(character, true);
    setStamping(false);
    clearStamp(host.current);
  };

  const row = useMemo(
    () =>
      index && info
        ? index.kana.filter(
            (x) =>
              x.kana?.script === info.script &&
              x.kana.group === info.group &&
              x.kana.row === info.row &&
              x.k !== character,
          )
        : [],
    [index, info, character],
  );
  const look = k
    ? ([...k.lk].map((c) => index?.by.get(c)).filter(Boolean) as Kanji[])
    : [];
  const origin = info?.origin ? index?.by.get(info.origin) : undefined;

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-[clamp(28px,5cqi,56px)] p-[clamp(16px,4.5cqi,56px)]">
      <header className="flex items-center justify-between gap-3">
        <button type="button" onClick={back} className={`${btn.ghost} py-2`}>
          <IconBack />
          {nav?.label ?? "Kana"}
        </button>
        {nav && pos >= 0 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => go(prev)}
              aria-label="Anterior (K)"
              className="flex items-center gap-2 border border-line px-2.5 py-1.5 transition-colors hover:border-ink"
            >
              <IconLeft size={14} />
              <span lang="ja" className="font-k text-lg">
                {prev}
              </span>
            </button>
            <span className="px-2.5 font-mono text-[11px] text-ink-3 tabular-nums">
              {pad(pos + 1)} / {pad(nav.list.length)}
            </span>
            <button
              type="button"
              onClick={() => go(next)}
              aria-label="Próximo (J)"
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
            ref={host}
            className="@container relative mx-auto aspect-square w-full max-w-[560px]"
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
              </span>
            )}
          </div>
          {!!strokes.data?.p.length && (
            <div className="flex justify-center">
              <PlayerControls player={player} />
            </div>
          )}
          {info && k && (
            <dl className="hairline-grid m-0 grid-cols-3">
              {(
                [
                  ["TRAÇOS", pad(k.s)],
                  ["ESCRITA", info.script],
                  ["LINHA", `${info.row}-`],
                  ["GRUPO", GROUP_LABEL[info.group]],
                  ["UNICODE", `U+${k.u}`],
                  ["ORIGEM", info.origin ?? "—"],
                ] as const
              ).map(([l, v]) => (
                <div key={l} className="flex flex-col gap-1 px-3.5 py-3">
                  <dt className="font-mono text-[10px] tracking-[.1em] text-ink-3">
                    {l}
                  </dt>
                  <dd
                    lang={l === "ORIGEM" ? "ja" : undefined}
                    className="m-0 font-mono text-[15px]"
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {info && k ? (
          <div className="flex min-w-0 flex-col gap-12">
            <div className="flex flex-col gap-2.5">
              <span
                className={`label-mono ${status === "review" || status === "mastered" ? "!text-hanko" : ""}`}
              >
                {info.script} · {statusLabel[status]}
              </span>
              <div className="flex items-end gap-5">
                <h1 className="m-0 font-mono text-[clamp(56px,8cqi,96px)] font-normal leading-none tracking-[-.02em]">
                  {info.r}
                </h1>
                <button
                  type="button"
                  onClick={() => speak(character)}
                  aria-label={`Ouvir ${character}`}
                  className="press mb-2 grid size-14 place-items-center rounded-full border border-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  <IconSpeakerLg size={22} />
                </button>
              </div>
              <span className="text-[15px] text-ink-3">
                Lê-se “{info.r}”
                {info.group === "dakuten"
                  ? " — o sinal ゛ ou ゜ muda o som da sílaba base"
                  : ""}
                .
              </span>
            </div>

            <section className="flex flex-col gap-4">
              <SectionLabel n="01">
                Par em {info.script === "hiragana" ? "katakana" : "hiragana"}
              </SectionLabel>
              <Link
                href={`/${encodeURIComponent(info.pair)}`}
                className="flex items-center gap-5 self-start border border-line px-5 py-4 no-underline transition-colors hover:border-ink"
              >
                <span lang="ja" className="font-k text-5xl leading-none">
                  {info.pair}
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="text-[15px]">Mesmo som, outra escrita</span>
                  <span className="text-xs text-ink-3">
                    {info.script === "hiragana"
                      ? "Katakana: palavras estrangeiras e ênfase"
                      : "Hiragana: palavras nativas e gramática"}
                  </span>
                </span>
              </Link>
            </section>

            {info.ex && (
              <section className="flex flex-col gap-3">
                <SectionLabel n="02">Exemplo</SectionLabel>
                <button
                  type="button"
                  onClick={() => speak(info.ex?.r ?? "")}
                  className="grid grid-cols-[auto_1fr_auto] items-end gap-5 border-b border-line py-3.5 text-left transition-colors hover:bg-ghost"
                >
                  <span lang="ja" className="font-min text-[28px] leading-none">
                    {info.ex.w}
                  </span>
                  <span className="pb-0.5 text-sm text-ink-2">{info.ex.g}</span>
                  <IconSpeaker size={14} className="mb-1 text-ink-3" />
                </button>
              </section>
            )}

            {info.origin && (
              <section className="flex flex-col gap-4">
                <SectionLabel n="03">Origem</SectionLabel>
                <div className="flex items-center gap-5">
                  {origin ? (
                    <Link
                      href={`/${encodeURIComponent(info.origin)}`}
                      lang="ja"
                      className="grid size-20 place-items-center border border-line font-k text-5xl no-underline transition-colors hover:border-ink"
                    >
                      {info.origin}
                    </Link>
                  ) : (
                    <span
                      lang="ja"
                      className="grid size-20 place-items-center border border-line font-k text-5xl"
                    >
                      {info.origin}
                    </span>
                  )}
                  <p className="m-0 max-w-sm text-sm leading-relaxed text-pretty text-ink-2">
                    {info.script === "hiragana"
                      ? `O hiragana ${character} nasceu da escrita cursiva, em pincel, do kanji ${info.origin}${origin ? ` (${meaningOf(origin)})` : ""}.`
                      : `O katakana ${character} é um pedaço do kanji ${info.origin}${origin ? ` (${meaningOf(origin)})` : ""}, usado por monges para anotar a leitura dos textos.`}
                  </p>
                </div>
              </section>
            )}

            {(look.length > 0 || row.length > 0) && (
              <section className="flex flex-col gap-4">
                <SectionLabel n="04">Vizinhos</SectionLabel>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-6">
                  {[
                    {
                      t: "Fáceis de confundir",
                      why: "forma parecida",
                      items: look,
                    },
                    {
                      t: `Linha ${info.row}-`,
                      why: "mesma consoante",
                      items: row,
                    },
                  ]
                    .filter((g) => g.items.length)
                    .map((g) => (
                      <div key={g.t} className="flex flex-col gap-2.5">
                        <span className="flex flex-col gap-0.5">
                          <span className="text-[13px]">{g.t}</span>
                          <span className="text-xs text-ink-3">{g.why}</span>
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {g.items.map((x) => (
                            <Link
                              key={x.k}
                              href={`/${encodeURIComponent(x.k)}`}
                              title={meaningOf(x)}
                              className="flex size-12 flex-col items-center justify-center border border-line no-underline transition-colors hover:border-ink"
                            >
                              <span
                                lang="ja"
                                className="font-k text-[22px] leading-none"
                              >
                                {x.k}
                              </span>
                              <span className="font-mono text-[9px] text-ink-3">
                                {meaningOf(x)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </section>
            )}

            <div className="sticky bottom-[72px] z-30 -mx-1 flex flex-wrap gap-1.5 border-t border-line bg-paper px-1 py-2.5 shell:static shell:mx-0 shell:gap-2 shell:border-0 shell:bg-transparent shell:px-0 shell:pt-2">
              <button
                type="button"
                onClick={async () =>
                  toast(
                    (await addToStudy(character))
                      ? "Adicionado aos estudos · primeira revisão hoje"
                      : "Já está nos seus estudos",
                  )
                }
                className={`${btn.primary} flex-auto`}
              >
                {card ? "Nos seus estudos" : "Adicionar aos estudos"}
              </button>
              {!!k.sv && (
                <Link
                  href={`/aprender?escrever=${encodeURIComponent(character)}`}
                  className={`${btn.secondary} flex-auto bg-paper no-underline`}
                >
                  Praticar escrita
                </Link>
              )}
              <button
                type="button"
                onClick={master}
                aria-pressed={status === "mastered"}
                className={`${btn.hanko} flex-auto bg-paper`}
              >
                {status === "mastered" ? "Dominado" : "Marcar como dominado"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <Skel w={120} />
            <Skel w="70%" h={20} />
          </div>
        )}
      </div>
    </div>
  );
}
