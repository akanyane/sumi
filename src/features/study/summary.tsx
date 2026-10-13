"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { type KanjiIndex, meaningOf, pad } from "@/lib/data";
import { db } from "@/lib/db";
import { isReduced } from "@/lib/motion";
import { statusOf } from "@/lib/srs";
import { CountUp } from "@/ui/count-up";
import { btn } from "@/ui/primitives";
import { stamp } from "@/ui/stamp";

export type SummaryRow = {
  k: string;
  label: string;
  ok: boolean;
  g: number;
  score?: number;
};

const GRADES = ["Errei", "Difícil", "Bom", "Fácil"];

export function Summary({
  rows,
  seconds,
  masteredBefore,
  index,
  onAgain,
}: {
  rows: SummaryRow[];
  seconds: number;
  masteredBefore: Set<string>;
  index: KanjiIndex;
  onAgain: () => void;
}) {
  const [newlyMastered, setNewlyMastered] = useState<string[] | null>(null);
  useEffect(() => {
    db.cards.bulkGet(rows.map((r) => r.k)).then((cs) => {
      setNewlyMastered(
        cs
          .filter(
            (c) => c && statusOf(c) === "mastered" && !masteredBefore.has(c.k),
          )
          .map((c) => c?.k as string),
      );
    });
  }, [rows, masteredBefore]);

  const hero = newlyMastered?.[0] ?? rows[rows.length - 1]?.k;
  const hk = hero ? index.by.get(hero) : undefined;
  const ok = rows.filter((r) => r.ok).length;
  const writes = rows.filter((r) => r.score !== undefined);
  const acc = writes.length
    ? Math.round(writes.reduce((a, r) => a + (r.score ?? 0), 0) / writes.length)
    : null;
  const host = useRef<HTMLDivElement>(null);
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    if (!newlyMastered?.length) return;
    const t = setTimeout(
      () =>
        stamp(host.current, { size: "30%", right: "8%", bottom: "8%" }).then(
          () => setStamped(true),
        ),
      isReduced() ? 200 : 900,
    );
    return () => clearTimeout(t);
  }, [newlyMastered]);

  const sentence = useMemo(() => {
    const n = newlyMastered?.length ?? 0;
    const base = `Bom trabalho. Você revisou ${rows.length} cart${rows.length === 1 ? "ão" : "ões"}`;
    if (n === 1) return `${base} e um kanji novo foi para a parede.`;
    if (n > 1) return `${base} e ${n} kanji foram para a parede.`;
    return `${base}. A tinta seca com o tempo — volte amanhã.`;
  }, [rows.length, newlyMastered]);

  const m = Math.floor(seconds / 60);
  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-col gap-[clamp(40px,6cqi,72px)] px-[clamp(16px,4.5cqi,56px)] py-[clamp(24px,6cqi,80px)]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] items-center gap-10">
        <div className="flex flex-col gap-3.5">
          <span className="label-mono">Sessão concluída</span>
          <span
            lang="ja"
            className="whitespace-nowrap font-min text-[clamp(44px,7cqi,80px)] font-semibold leading-none tracking-[.02em]"
          >
            お疲れさま
          </span>
          <span className="text-base text-pretty text-ink-2">{sentence}</span>
        </div>
        {hk && (
          <div
            ref={host}
            className="@container relative grid aspect-square w-full max-w-[300px] place-items-center justify-self-center border border-line bg-paper"
          >
            <span
              lang="ja"
              className="font-k text-[min(180px,60cqi)] leading-none"
            >
              {hk.k}
            </span>
            <span className="absolute top-3 left-3.5 font-mono text-[10px] text-ink-3 uppercase">
              {pad(hk.i + 1, 3)} · {meaningOf(hk).split(",")[0]}
            </span>
            {stamped && (
              <span
                lang="ja"
                role="img"
                aria-label="Dominado"
                className="absolute right-[8%] bottom-[8%] grid aspect-square w-[30%] place-items-center rounded-md bg-hanko font-min text-[15cqi] font-extrabold text-on-hanko"
                style={{
                  transform: "rotate(-8deg)",
                  boxShadow:
                    "inset 0 0 0 4px var(--hanko), inset 0 0 0 6px var(--on-hanko)",
                }}
              >
                得
              </span>
            )}
          </div>
        )}
      </div>

      <dl className="hairline-grid m-0 grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
        <div className="flex flex-col gap-2 p-5">
          <dt className="font-mono text-[10px] tracking-[.12em] text-ink-3">
            ACERTOS
          </dt>
          <dd className="m-0 font-mono text-4xl">
            <CountUp to={ok} />
            <span className="text-xl text-ink-3"> / {rows.length}</span>
          </dd>
        </div>
        <div className="flex flex-col gap-2 p-5">
          <dt className="font-mono text-[10px] tracking-[.12em] text-ink-3">
            TEMPO
          </dt>
          <dd className="m-0 font-mono text-4xl">
            {m}:{pad(seconds % 60)}
          </dd>
        </div>
        <div className="flex flex-col gap-2 p-5">
          <dt className="font-mono text-[10px] tracking-[.12em] text-ink-3">
            PRECISÃO DA ESCRITA
          </dt>
          <dd className="m-0 font-mono text-4xl">
            {acc === null ? (
              <span className="text-ink-3">—</span>
            ) : (
              <>
                <CountUp to={acc} delay={80} />
                <span className="text-xl text-ink-3">%</span>
              </>
            )}
          </dd>
        </div>
        <div className="flex flex-col gap-2 p-5">
          <dt className="font-mono text-[10px] tracking-[.12em] text-hanko">
            DOMINADOS
          </dt>
          <dd className="m-0 font-mono text-4xl text-hanko">
            +<CountUp to={newlyMastered?.length ?? 0} delay={160} />
          </dd>
        </div>
      </dl>

      <div className="flex flex-col">
        {rows.map((r, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: a kanji may appear twice
            key={i}
            className="grid grid-cols-[48px_1fr_auto_auto] items-center gap-4 border-b border-line py-3"
          >
            <Link
              href={`/${encodeURIComponent(r.k)}`}
              lang="ja"
              className="font-k text-[28px] leading-none no-underline"
            >
              {r.k}
            </Link>
            <span className="text-sm text-ink-2">{r.label}</span>
            <span
              className={`font-mono text-[11px] ${r.ok ? "text-ink-2" : "text-hanko"}`}
            >
              {r.ok ? "CERTO" : "ERRO"}
            </span>
            <span className="min-w-[52px] text-right font-mono text-[11px] text-ink-3">
              {GRADES[r.g]}
              {r.score !== undefined ? ` · ${r.score}%` : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/progresso" className={`${btn.primary} no-underline`}>
          Ver meu progresso
        </Link>
        <button type="button" onClick={onAgain} className={btn.secondary}>
          Continuar estudando
        </button>
        <Link href="/" className={`${btn.secondary} no-underline`}>
          Voltar a explorar
        </Link>
      </div>
    </div>
  );
}
