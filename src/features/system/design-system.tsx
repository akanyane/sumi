"use client";

import { useRef } from "react";
import { useStrokes } from "@/lib/data";
import { usePalette } from "@/ui/command-palette";
import { Enso, Hanko, ProgressRing, SectionLabel, Skel } from "@/ui/primitives";
import { KunReading, OnChip } from "@/ui/readings";
import { stamp } from "@/ui/stamp";
import { PlayerControls, useStrokePlayer } from "@/ui/stroke-player";

const LIGHT = {
  "--paper": "#F4F1EA",
  "--paper-2": "#EBE7DD",
  "--ink": "#1A1A18",
  "--ink-2": "#4F4D46",
  "--ink-3": "#6B675E",
  "--line": "rgba(26,26,24,.13)",
  "--hanko": "#C8372D",
  "--on-hanko": "#F7F3EC",
} as React.CSSProperties;
const DARK = {
  "--paper": "#141412",
  "--paper-2": "#1C1C19",
  "--ink": "#ECE7DC",
  "--ink-2": "#BAB5A9",
  "--ink-3": "#8F8B80",
  "--line": "rgba(236,231,220,.11)",
  "--hanko": "#E0513C",
  "--on-hanko": "#141412",
} as React.CSSProperties;

const MOTION = [
  [
    "ink.stroke",
    "Traço do pincel",
    "220ms + 7,5ms/u",
    "cubic-bezier(.6,0,.25,1) até 86%, depois arrasto ease-out nos últimos 3,5%",
    "fade 260ms por traço",
  ],
  ["ink.lift", "Pausa entre traços", "150ms", "—", "60ms"],
  [
    "vt.shared",
    "Grade → detalhe",
    "540ms",
    "cubic-bezier(.2,.8,.2,1) · View Transitions",
    "corte seco",
  ],
  ["vt.root", "Troca de tela", "240ms", "crossfade", "corte seco"],
  [
    "card.lift",
    "Hover do card",
    "≈420ms",
    "spring k=420 c=26 m=1 → linear()",
    "sem lift",
  ],
  [
    "ink.bleed",
    "Tinta sangrando",
    "640ms in · 280ms out",
    "cubic-bezier(.16,1,.3,1)",
    "desligado",
  ],
  [
    "hanko.stamp",
    "Carimbo",
    "440ms + partículas 520–760ms",
    "cubic-bezier(.3,0,.2,1) · squash .95×.84 a 50%",
    "fade + escala .96→1, 220ms",
  ],
  [
    "grid.stagger",
    "Entrada da grade",
    "460ms · 0,5ms/px (máx 620)",
    "cubic-bezier(.2,.7,.2,1) · a partir do cursor",
    "fade 180ms",
  ],
  [
    "count.up",
    "Números",
    "950ms",
    "easeOutExpo (1−2^−10t)",
    "valor final direto",
  ],
  [
    "ring.fill",
    "Anéis e barras",
    "1100ms · stagger 90ms",
    "cubic-bezier(.65,0,.35,1)",
    "sem animação",
  ],
  ["press", "Toque em botão", "90ms", "scale .97", "scale .97"],
];

const THESIS = [
  "O kanji é o herói; toda a interface recua para que ele seja lido como escultura.",
  "Vazio é estrutura: o espaçamento faz o trabalho que bordas e sombras fariam.",
  "Uma tinta, um papel, um selo. O vermelho só aparece para progresso e recompensa.",
  "Movimento é pedagogia: o traço animado ensina ordem, direção e ritmo.",
  "Metadados como ficha técnica: precisos, monoespaçados, sempre no mesmo lugar.",
];

function Swatches({
  vars,
  title,
  ja,
  note,
}: {
  vars: React.CSSProperties;
  title: string;
  ja: string;
  note: string;
}) {
  return (
    <div
      style={vars}
      className="flex flex-col gap-[18px] border border-line bg-paper p-6 text-ink"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[15px]">{title}</span>
        <span lang="ja" className="font-min text-[13px] text-ink-3">
          {ja}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-px border border-line bg-line">
        {[
          ["paper", "var(--paper)", "var(--ink)"],
          ["paper-2", "var(--paper-2)", "var(--ink)"],
          ["ink", "var(--ink)", "var(--paper)"],
          ["hanko", "var(--hanko)", "var(--on-hanko)"],
        ].map(([n, bg, fg]) => (
          <div
            key={n}
            className="flex flex-col gap-7 p-2.5"
            style={{ background: bg, color: fg }}
          >
            <span className="text-xs">{n}</span>
            <span className="font-mono text-[10px] opacity-75">
              {(vars as Record<string, string>)[`--${n}`]}
            </span>
          </div>
        ))}
      </div>
      <p className="m-0 text-[13px] leading-[1.55] text-ink-2">{note}</p>
    </div>
  );
}

export function DesignSystem() {
  const palette = usePalette();
  const { data } = useStrokes("語");
  const player = useStrokePlayer("語", data, { autoplay: 400 });
  const stampHost = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-[clamp(64px,8cqi,112px)] p-[clamp(20px,4.5cqi,56px)]">
      <header className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-end gap-12">
        <div className="flex flex-col gap-4">
          <span className="label-mono">
            Sumi &amp; Ma · Design system · v1.0
          </span>
          <span
            lang="ja"
            className="font-min text-[clamp(96px,16cqi,180px)] font-extrabold leading-[.9]"
          >
            墨と間
          </span>
        </div>
        <p className="m-0 text-[17px] leading-[1.65] text-pretty text-ink-2">
          Sumi &amp; Ma trata a tela como uma folha de washi: o kanji é a única
          coisa com peso, e o espaço vazio (間) em volta é o que deixa o olho
          ler a estrutura dos traços. Tinta quase preta sobre papel quente reduz
          o ruído visual e aproxima o estudo do gesto da caligrafia; o vermelho
          do hanko aparece só quando há algo a celebrar, então ele passa a
          significar progresso. O movimento segue o pincel: cada traço é
          desenhado na ordem e na direção corretas, e é assim que a memória
          motora se forma.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 border-t border-ink pt-5 sm:grid-cols-[120px_1fr]">
        <span className="label-mono">Tese</span>
        <ol className="m-0 flex list-none flex-col p-0">
          {THESIS.map((t, i) => (
            <li
              key={t}
              className="grid grid-cols-[32px_1fr] border-b border-line py-3 text-lg leading-[1.4]"
            >
              <span className="pt-[5px] font-mono text-[11px] text-ink-3">
                0{i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel n="01">Cor</SectionLabel>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-4">
          <Swatches
            vars={LIGHT}
            title="Papel · claro"
            ja="和紙"
            note="ink-2 7,9:1 · ink-3 5,0:1 · hanko 4,9:1 — o vermelho é só para progresso."
          />
          <Swatches
            vars={DARK}
            title="Nanquim · escuro"
            ja="墨と白墨"
            note="Não é inversão: fundo de nanquim quente, giz levemente amarelado, vermelho com mais luminância para manter 5:1, e o ruído troca multiply por screen, como pó de giz."
          />
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel n="02">Tipografia</SectionLabel>
        <div className="flex flex-col">
          {[
            [
              "Kanji · herói",
              "Shippori Mincho 400 · 84cqi",
              <span
                key="a"
                lang="ja"
                className="font-k text-[96px] leading-none"
              >
                語 愛 鬱
              </span>,
            ],
            [
              "Display latino",
              "Jost 300 · 56/1.02 · −2%",
              <span
                key="b"
                className="text-5xl font-light leading-[1.02] tracking-[-.02em]"
              >
                palavra, língua
              </span>,
            ],
            [
              "On'yomi · katakana",
              "Zen Kaku Gothic 500 · +8%",
              <span
                key="c"
                lang="ja"
                className="font-goth text-[28px] font-medium tracking-[.08em]"
              >
                ゴ・ガク・アイ
              </span>,
            ],
            [
              "Kun'yomi · hiragana",
              "Shippori Mincho · okurigana em ink-3",
              <span key="d" lang="ja" className="font-min text-[28px]">
                かた<span className="text-ink-3">る</span>　まな
                <span className="text-ink-3">ぶ</span>
              </span>,
            ],
            [
              "Texto UI",
              "Jost 400 · 15/1.6",
              <span key="e" className="max-w-[520px] text-[15px] leading-[1.6]">
                Dizer (言) as palavras do “eu” (吾): a língua é como eu falo.
              </span>,
            ],
            [
              "Metadados",
              "IBM Plex Mono 400 · 10–12 · +12%",
              <span key="f" className="font-mono text-xs tracking-[.12em]">
                14 TRAÇOS · N5 · U+8A9E · #301
              </span>,
            ],
          ].map(([l, spec, sample]) => (
            <div
              key={String(l)}
              className="grid grid-cols-1 items-baseline gap-3 border-b border-line py-4 sm:grid-cols-[180px_1fr] sm:gap-6"
            >
              <span className="flex flex-col gap-1">
                <span className="text-[13px]">{l}</span>
                <span className="font-mono text-[10px] text-ink-3">{spec}</span>
              </span>
              {sample}
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-12">
        <div className="flex flex-col gap-5">
          <SectionLabel n="03">Espaço · 4/8</SectionLabel>
          <div className="flex flex-col gap-2">
            {[4, 8, 12, 16, 24, 32, 48, 64, 96, 128].map((n) => (
              <div
                key={n}
                className="grid grid-cols-[56px_1fr] items-center gap-3"
              >
                <span className="font-mono text-[11px] text-ink-3">{n}px</span>
                <span
                  className="h-2 bg-ink"
                  style={{ width: Math.min(n * 2, 256) }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <SectionLabel n="04">Raio · elevação</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["0 · padrão", "0"],
              ["2 · chips, foco", "2px"],
              ["full · anéis", "50%"],
            ].map(([l, r]) => (
              <div key={l} className="flex flex-col gap-2">
                <span
                  className="aspect-square border border-ink"
                  style={{ borderRadius: r }}
                />
                <span className="font-mono text-[11px]">{l}</span>
              </div>
            ))}
          </div>
          <p className="m-0 text-sm leading-[1.6] text-ink-2">
            Sem sombras. O papel é plano: hierarquia vem de linhas de 1px e de
            grades com gap de 1px sobre a cor da linha. Overlays usam desfoque
            do papel, não sombra.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel n="05">Movimento</SectionLabel>
        <div className="overflow-x-auto">
          <div className="flex min-w-[760px] flex-col">
            <div className="grid grid-cols-[150px_150px_1fr_1fr] gap-4 border-b border-ink py-2 font-mono text-[10px] tracking-[.1em] text-ink-3">
              <span>TOKEN</span>
              <span>DURAÇÃO</span>
              <span>CURVA</span>
              <span>REDUZIDO</span>
            </div>
            {MOTION.map(([t, u, d, e, r]) => (
              <div
                key={t}
                className="grid grid-cols-[150px_150px_1fr_1fr] items-baseline gap-4 border-b border-line py-3 text-[13px]"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs">{t}</span>
                  <span className="text-xs text-ink-3">{u}</span>
                </span>
                <span className="font-mono text-xs">{d}</span>
                <span className="font-mono text-[11px] text-ink-2">{e}</span>
                <span className="text-xs text-ink-3">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionLabel n="06">Componentes</SectionLabel>
        <div className="hairline-grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))]">
          <div className="row-span-2 flex flex-col gap-4 p-6">
            <span className="font-mono text-[11px]">StrokePlayer</span>
            <div className="relative aspect-square w-full max-w-[320px] self-center">
              <div ref={player.ref} className="absolute inset-0" />
            </div>
            <div className="self-center">
              <PlayerControls player={player} speeds={false} />
            </div>
            <p className="m-0 text-[13px] leading-[1.55] text-ink-3">
              Cada path do KanjiVG anima stroke-dashoffset com a curva “pincel”.
              O traço ativo fica em hanko e o número aparece junto. A largura
              varia 0,78→1,08 para simular pressão.
            </p>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <span className="font-mono text-[11px]">Card · 4 estados</span>
            <div className="hairline-grid grid-cols-4">
              <div className="relative grid aspect-[4/5] place-items-center">
                <span className="absolute top-1.5 right-1.5 font-mono text-[9px] text-ink-3">
                  novo
                </span>
                <span lang="ja" className="font-k text-[34px]">
                  鬱
                </span>
              </div>
              <div className="relative grid aspect-[4/5] place-items-center">
                <span lang="ja" className="font-k text-[34px]">
                  学
                </span>
                <span className="absolute right-2 bottom-0 left-2 h-0.5 bg-line">
                  <span className="absolute inset-y-0 left-0 w-[55%] bg-ink" />
                </span>
              </div>
              <div className="relative grid aspect-[4/5] place-items-center">
                <span className="absolute top-2 right-2 size-[5px] rounded-full bg-hanko" />
                <span lang="ja" className="font-k text-[34px]">
                  愛
                </span>
              </div>
              <div className="relative grid aspect-[4/5] place-items-center">
                <span lang="ja" className="font-k text-[34px]">
                  日
                </span>
                <span className="absolute right-1.5 bottom-1.5">
                  <Hanko size={18} />
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 font-mono text-[10px] text-ink-3">
              <span>novo</span>
              <span>aprendendo</span>
              <span>revisar</span>
              <span>dominado</span>
            </div>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <span className="font-mono text-[11px]">
              ReadingChip · on / kun
            </span>
            <div className="flex flex-wrap items-center gap-3.5">
              <OnChip r="ゴ" showRomaji />
              <KunReading r="かた.る" showRomaji />
            </div>
            <p className="m-0 text-[13px] leading-normal text-ink-3">
              On: gótico em caixa (som chinês, “emprestado”). Kun: mincho
              sublinhado, okurigana em tom secundário. Toque para ouvir.
            </p>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <span className="font-mono text-[11px]">
              ProgressRing · ReviewButton
            </span>
            <div className="flex flex-wrap items-center gap-5">
              <ProgressRing value={77} size={80} track={5} stroke={7}>
                77%
              </ProgressRing>
              <div className="grid min-w-[220px] flex-1 grid-cols-4 gap-1">
                {[
                  ["Errei", "10 min", "text-hanko border border-line-2"],
                  ["Difícil", "2 d", "border border-line-2"],
                  ["Bom", "4 d", "bg-ink text-paper"],
                  ["Fácil", "9 d", "border border-line-2"],
                ].map(([l, iv, c]) => (
                  <span
                    key={l}
                    className={`flex flex-col items-center gap-0.5 px-0.5 py-2.5 text-[13px] ${c}`}
                  >
                    {l}
                    <span className="font-mono text-[10px] opacity-75">
                      {iv}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <span className="font-mono text-[11px]">HankoStamp</span>
            <div
              ref={stampHost}
              className="relative grid h-40 place-items-center border border-line"
            >
              <span lang="ja" className="font-k text-[96px] leading-none">
                愛
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                stamp(stampHost.current, {
                  size: "34%",
                  right: "10%",
                  bottom: "10%",
                })
              }
              className="press self-start border border-hanko px-4 py-2.5 text-[13px] text-hanko transition-colors hover:bg-hanko hover:text-on-hanko"
            >
              Carimbar
            </button>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <span className="font-mono text-[11px]">CommandPalette</span>
            <button
              type="button"
              onClick={palette.open}
              className="flex items-center justify-between gap-2.5 border border-line-2 px-3.5 py-3 text-sm text-ink-2 transition-colors hover:border-ink"
            >
              <span>Experimente: “ai”, “água”, ガク</span>
              <span className="font-mono text-[11px] text-ink-3">⌘K</span>
            </button>
            <p className="m-0 text-[13px] leading-normal text-ink-3">
              Resultados agrupados por kanji, significado (PT/EN, sem acento) e
              leitura (kana ou romaji).
            </p>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <span className="font-mono text-[11px]">Estados</span>
            <div className="hairline-grid grid-cols-2">
              <div className="flex min-h-[110px] flex-col gap-2.5 p-4">
                <span className="font-mono text-[10px] text-ink-3">
                  CARREGANDO
                </span>
                <Skel w="70%" h={10} rot={-2} />
                <Skel w="45%" h={6} rot={0} />
              </div>
              <div className="flex flex-col items-start gap-2.5 p-4">
                <span className="font-mono text-[10px] text-ink-3">VAZIO</span>
                <Enso size={44} width={6} />
                <span className="text-xs text-ink-2">
                  Ensō aberto: nada aqui ainda
                </span>
              </div>
              <div className="flex flex-col items-start gap-2.5 p-4">
                <span className="font-mono text-[10px] text-hanko">ERRO</span>
                <span className="text-xs text-ink-2">
                  Não foi possível carregar.
                </span>
                <span className="border-b border-ink text-xs">
                  Tentar de novo
                </span>
              </div>
              <div className="flex flex-col items-start gap-2.5 p-4">
                <span className="font-mono text-[10px] text-ink-3">
                  OFFLINE
                </span>
                <span className="text-xs text-ink-2">
                  Sem conexão. Seu progresso fica salvo neste aparelho.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
