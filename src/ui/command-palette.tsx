"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { type Kanji, meaningOf, useKanjiIndex } from "@/lib/data";
import { db } from "@/lib/db";
import { cleanReading, fold, romaji, toHira } from "@/lib/kana";
import { PT } from "@/lib/pt";
import { IconSearch } from "./icons";

type Ctx = { open: () => void; close: () => void; isOpen: boolean };
const PaletteContext = createContext<Ctx>({
  open: () => {},
  close: () => {},
  isOpen: false,
});
export const usePalette = () => useContext(PaletteContext);

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement &&
  (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (
        e.key === "/" &&
        !isTyping(e.target) &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);
  return (
    <PaletteContext value={value}>
      {children}
      {isOpen && <Palette onClose={close} />}
    </PaletteContext>
  );
}

type Group = { t: string; list: Kanji[] };

/** Short queries match word starts only ("ka" shouldn't hit "katakana radical"); longer ones match anywhere. */
const matches = (text: string, q: string) =>
  q.length < 4
    ? fold(text)
        .split(/[\s,;()/-]+/)
        .some((w) => w.startsWith(q))
    : fold(text).includes(q);

function search(q: string, list: Kanji[], kana: Kanji[]): Group[] {
  const query = q.trim();
  if (!query) return [];
  const ql = fold(query);
  const seen = new Set<string>();
  const take = (arr: Kanji[]) =>
    arr.filter((d) => !seen.has(d.k) && seen.add(d.k)).slice(0, 6);
  const chars = new Set([...query]);
  const g1 = take(list.filter((d) => chars.has(d.k)));
  const g2 =
    ql.length < 2
      ? []
      : take(
          list
            .filter(
              (d) =>
                d.m.some((m) => matches(m, ql)) ||
                (PT[d.k] ? matches(PT[d.k], ql) : false),
            )
            .sort((a, b) => {
              // exact word matches first
              const ex = (d: Kanji) =>
                [...d.m, ...(PT[d.k]?.split(", ") ?? [])].some(
                  (m) => fold(m) === ql,
                )
                  ? 0
                  : 1;
              return ex(a) - ex(b) || a.i - b.i;
            }),
        );
  const hq = toHira(query);
  const isRomaji = /^[a-z]+$/.test(ql);
  const isKana = /^[぀-ヿ]+$/.test(query);
  const g3 =
    isRomaji || isKana
      ? take(
          list.filter((d) =>
            [...d.on, ...d.kun].some((r) => {
              const c = cleanReading(r);
              return isKana
                ? toHira(c).startsWith(hq)
                : romaji(c).startsWith(ql);
            }),
          ),
        )
      : [];
  const gk = kana
    .filter(
      (d) =>
        [...d.k].length === 1 &&
        (chars.has(d.k) || d.kana?.r === ql || d.kana?.pair === query),
    )
    .slice(0, 6);
  return [
    { t: "KANA", list: gk },
    { t: "KANJI", list: g1 },
    { t: "SIGNIFICADO", list: g2 },
    { t: "LEITURA", list: g3 },
  ].filter((g) => g.list.length);
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { data: index } = useKanjiIndex();
  const recents = useLiveQuery(
    () => db.recents.orderBy("at").reverse().limit(8).toArray(),
    [],
  );
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  const groups: Group[] = useMemo(() => {
    if (!index) return [];
    if (!q.trim()) {
      const list = (recents ?? [])
        .map((r) => index.by.get(r.k))
        .filter(Boolean) as Kanji[];
      return list.length ? [{ t: "RECENTES", list }] : [];
    }
    return search(q, index.list, index.kana);
  }, [q, index, recents]);
  const flat = groups.flatMap((g) => g.list);

  const go = (k: string) => {
    onClose();
    router.push(`/${encodeURIComponent(k)}`);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      const hit = flat[active];
      if (hit) go(hit.k);
      else if ([...q.trim()].length === 1) go(q.trim());
    }
  };

  let idx = 0;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click closes; keyboard handled on the input
    // biome-ignore lint/a11y/useKeyWithClickEvents: Esc is handled on the input
    <div
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[min(14vh,120px)] pb-4 backdrop-blur-[6px]"
      style={{
        background: "color-mix(in oklab, var(--paper) 55%, transparent)",
      }}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: only stops propagation */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Busca"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[70vh] w-full max-w-[620px] flex-col border border-line-2 bg-paper"
      >
        <div className="flex items-center gap-3 border-b border-line px-[18px] py-4">
          <IconSearch size={18} className="flex-none text-ink-3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKey}
            placeholder="学, estudo, gaku, まなぶ…"
            aria-label="Buscar"
            role="combobox"
            aria-expanded={flat.length > 0}
            aria-controls="palette-results"
            aria-activedescendant={
              flat[active] ? `pal-${flat[active].k}` : undefined
            }
            className="flex-1 bg-transparent font-sans text-lg outline-none"
          />
          <span className="border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-3">
            ESC
          </span>
        </div>
        <div id="palette-results" role="listbox" className="overflow-auto py-2">
          {groups.map((g) => (
            <div key={g.t} className="flex flex-col py-1.5">
              <span className="label-mono px-[18px] py-1.5 text-[10px]">
                {g.t}
              </span>
              {g.list.map((d) => {
                const i = idx++;
                const on = i === active;
                return (
                  <button
                    type="button"
                    id={`pal-${d.k}`}
                    role="option"
                    aria-selected={on}
                    key={d.k}
                    onClick={() => go(d.k)}
                    onMouseMove={() => setActive(i)}
                    className="grid grid-cols-[44px_1fr_auto] items-center gap-3.5 border-l-2 px-[18px] py-2 text-left"
                    style={{
                      background: on ? "var(--ghost)" : "transparent",
                      borderColor: on ? "var(--hanko)" : "transparent",
                    }}
                  >
                    <span
                      lang="ja"
                      className="text-center font-k text-[28px] leading-none"
                    >
                      {d.k}
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[15px]">{meaningOf(d)}</span>
                      <span className="truncate text-xs text-ink-3">
                        {d.kana ? d.kana.script : d.m.join(", ")}
                      </span>
                    </span>
                    <span
                      lang="ja"
                      className="font-goth text-[13px] text-ink-2"
                    >
                      {(d.kana
                        ? [d.kana.pair]
                        : [d.on[0], d.kun[0] && cleanReading(d.kun[0])]
                      )
                        .filter(Boolean)
                        .join("・")}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          {q.trim() && !flat.length && (
            <div className="px-[18px] py-8 text-center text-sm text-ink-3">
              Nenhum resultado para “{q}”.
              {[...q.trim()].length === 1 && (
                <button
                  type="button"
                  onClick={() => go(q.trim())}
                  className="ml-2 border-b border-ink text-ink"
                >
                  Abrir {q.trim()} mesmo assim
                </button>
              )}
            </div>
          )}
          {!q.trim() && !flat.length && (
            <div className="px-[18px] py-8 text-center text-sm text-ink-3">
              Experimente: “ai”, “água”, ガク, 学
            </div>
          )}
        </div>
        <div className="flex gap-4 border-t border-line px-[18px] py-2.5 font-mono text-[10px] text-ink-3">
          <span>↑↓ navegar</span>
          <span>↵ abrir</span>
          <span className="hidden sm:inline">
            kanji · significado PT/EN · kana · romaji
          </span>
        </div>
      </div>
    </div>
  );
}
