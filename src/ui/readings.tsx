"use client";

import { romaji, splitKun } from "@/lib/kana";
import { speak } from "@/lib/speech";
import { IconSpeaker } from "./icons";

/** On'yomi: gothic katakana in a box (the "borrowed" Chinese sound). */
export function OnChip({ r, showRomaji }: { r: string; showRomaji: boolean }) {
  return (
    <button
      type="button"
      onClick={() => speak(r)}
      aria-label={`Ouvir ${r}`}
      className="press flex items-center gap-2.5 rounded-[2px] border border-ink px-3 py-2 transition-colors hover:bg-ink hover:text-paper"
    >
      <span
        lang="ja"
        className="font-goth text-xl font-medium tracking-[.08em]"
      >
        {r}
      </span>
      {showRomaji && (
        <span className="font-mono text-[11px] opacity-70">{romaji(r)}</span>
      )}
      <IconSpeaker size={14} className="opacity-60" />
    </button>
  );
}

/** Kun'yomi: mincho, underlined, okurigana in a secondary tone. */
export function KunReading({
  r,
  showRomaji,
}: {
  r: string;
  showRomaji: boolean;
}) {
  const { pre, main, oku, post, plain } = splitKun(r);
  return (
    <button
      type="button"
      onClick={() => speak(plain)}
      aria-label={`Ouvir ${plain}`}
      className="flex items-baseline gap-2 border-b border-line-2 px-0.5 py-2 transition-colors hover:border-ink"
    >
      <span lang="ja" className="font-min text-[21px]">
        {pre}
        {main}
        <span className="text-ink-3">{oku}</span>
        {post}
      </span>
      {showRomaji && (
        <span className="font-mono text-[11px] text-ink-3">
          {romaji(plain)}
        </span>
      )}
    </button>
  );
}

/** Compact reading line for the kanji of the day. */
export function ReadingRow({
  label,
  value,
  kind,
}: {
  label: string;
  value: string;
  kind: "on" | "kun";
}) {
  const { main, oku, plain } = splitKun(value);
  return (
    <>
      <dt className="font-mono text-[10px] tracking-[.12em] text-ink-3">
        {label}
      </dt>
      <dd className="m-0 flex items-baseline gap-2">
        {kind === "on" ? (
          <span
            lang="ja"
            className="font-goth text-[22px] font-medium tracking-[.06em]"
          >
            {value}
          </span>
        ) : (
          <span lang="ja" className="font-min text-[22px]">
            {main}
            <span className="text-ink-3">{oku}</span>
          </span>
        )}
        <span className="font-mono text-xs text-ink-3">
          {romaji(kind === "on" ? value : plain)}
        </span>
      </dd>
    </>
  );
}
