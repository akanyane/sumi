"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { db } from "@/lib/db";
import { useSettings } from "@/lib/settings";
import { startOfDay, statusOf, useCards } from "@/lib/srs";
import { usePalette } from "./command-palette";
import {
  IconBook,
  IconGrid,
  IconSearch,
  IconSettings,
  IconTrend,
} from "./icons";
import { ProgressRing } from "./primitives";

const NAV = [
  { href: "/", label: "Explorar", num: "01", Icon: IconGrid },
  { href: "/aprender", label: "Aprender", num: "02", Icon: IconBook },
  { href: "/progresso", label: "Progresso", num: "03", Icon: IconTrend },
] as const;

function useActiveTab() {
  const path = usePathname();
  if (path.startsWith("/aprender")) return "/aprender";
  if (path.startsWith("/progresso")) return "/progresso";
  if (path.startsWith("/ajustes") || path.startsWith("/sistema"))
    return "/ajustes";
  return "/";
}

function useDueCount() {
  const cards = useCards();
  if (!cards) return 0;
  const now = new Date();
  return [...cards.values()].filter((c) => statusOf(c, now) === "review")
    .length;
}

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const mounted = useMounted();
  const cls =
    "press flex-1 border border-line p-2 text-center text-xs text-ink-2 transition-colors hover:border-line-2";
  return (
    <div className="flex gap-1.5 px-1">
      <button
        type="button"
        className={cls}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {mounted ? (resolvedTheme === "dark" ? "Claro" : "Escuro") : "Tema"}
      </button>
      <button
        type="button"
        className={cls}
        aria-pressed={mounted && theme === "system"}
        onClick={() => setTheme("system")}
        style={
          mounted && theme === "system"
            ? { borderColor: "var(--line-2)", color: "var(--ink)" }
            : undefined
        }
      >
        Sistema
      </button>
    </div>
  );
}

function Sidebar() {
  const active = useActiveTab();
  const palette = usePalette();
  const due = useDueCount();
  const { dailyGoal } = useSettings();
  const recents = useLiveQuery(
    () => db.recents.orderBy("at").reverse().limit(6).toArray(),
    [],
  );
  const today = useLiveQuery(
    () => db.reviews.where("at").aboveOrEqual(startOfDay()).count(),
    [],
    0,
  );
  return (
    <aside className="sticky top-0 hidden h-dvh w-56 flex-none flex-col gap-7 self-start border-r border-line bg-paper px-4 pt-7 pb-5 shell:flex">
      <Link
        href="/"
        className="flex items-baseline gap-2.5 px-2 pt-1 no-underline"
      >
        <span
          lang="ja"
          className="font-min text-[28px] font-extrabold leading-none"
        >
          墨
        </span>
        <span className="text-[15px] font-medium uppercase tracking-[.18em]">
          Sumi
        </span>
      </Link>
      <nav aria-label="Principal" className="flex flex-col gap-0.5">
        {NAV.map((n) => {
          const on = active === n.href;
          return (
            <Link
              key={n.href}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={`grid grid-cols-[28px_1fr_auto] items-center rounded-[2px] px-2 py-2.5 text-[15px] no-underline transition-colors hover:bg-ghost ${on ? "bg-ghost text-ink" : "text-ink-2"}`}
            >
              <span className="font-mono text-[10px] text-ink-3">{n.num}</span>
              <span>{n.label}</span>
              <span className="font-mono text-[11px] text-hanko">
                {n.href === "/aprender" && due ? due : ""}
              </span>
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={palette.open}
        className="flex items-center justify-between gap-2 border border-line px-3 py-2.5 text-[13px] text-ink-2 transition-colors hover:border-line-2"
      >
        <span className="flex items-center gap-2">
          <IconSearch size={15} />
          Buscar
        </span>
        <span className="font-mono text-[11px] text-ink-3">⌘K</span>
      </button>
      {!!recents?.length && (
        <div className="flex flex-col gap-2.5">
          <span className="label-mono px-2 text-[10px]">Recentes</span>
          <div className="flex flex-wrap gap-1 px-1">
            {recents.map((r) => (
              <Link
                key={r.k}
                href={`/${encodeURIComponent(r.k)}`}
                lang="ja"
                aria-label={r.k}
                className="grid size-9 place-items-center border border-line font-k text-xl no-underline transition-colors hover:border-ink"
              >
                {r.k}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="flex-1" />
      <div className="grid grid-cols-[44px_1fr] items-center gap-3 border-t border-line px-2 pt-3">
        <ProgressRing
          value={Math.min(100, (today / dailyGoal) * 100)}
          size={44}
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px]">Meta diária</span>
          <span className="font-mono text-[11px] text-ink-3">
            {today} de {dailyGoal} cartões
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <ThemeToggle />
        <Link
          href="/ajustes"
          aria-current={active === "/ajustes" ? "page" : undefined}
          className={`mx-1 flex items-center justify-center gap-2 border border-line p-2 text-xs no-underline transition-colors hover:border-line-2 ${active === "/ajustes" ? "text-ink" : "text-ink-2"}`}
        >
          <IconSettings size={14} />
          Ajustes
        </Link>
      </div>
    </aside>
  );
}

function BottomNav() {
  const active = useActiveTab();
  const palette = usePalette();
  const due = useDueCount();
  const items = [
    { ...NAV[0] },
    { href: "#buscar", label: "Buscar", Icon: IconSearch },
    { ...NAV[1] },
    { ...NAV[2] },
  ];
  return (
    <nav
      aria-label="Principal"
      className="sticky bottom-0 z-40 grid grid-cols-4 border-t border-line bg-paper px-1.5 pt-1.5 shell:hidden"
      style={{ paddingBottom: "calc(6px + env(safe-area-inset-bottom))" }}
    >
      {items.map((n) => {
        const on = active === n.href;
        const inner = (
          <>
            <n.Icon size={22} />
            <span>{n.label}</span>
            {n.href === "/aprender" && due > 0 && (
              <span className="absolute top-1.5 left-[calc(50%+8px)] size-[5px] rounded-full bg-hanko" />
            )}
          </>
        );
        const cls = `relative flex min-h-[52px] flex-col items-center justify-center gap-1 text-[11px] no-underline ${on ? "text-ink" : "text-ink-3"}`;
        return n.href === "#buscar" ? (
          <button
            key={n.href}
            type="button"
            onClick={palette.open}
            className={cls}
          >
            {inner}
          </button>
        ) : (
          <Link
            key={n.href}
            href={n.href}
            aria-current={on ? "page" : undefined}
            className={cls}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const focus = path.startsWith("/aprender");
  return (
    <>
      <div aria-hidden="true" className="noise" />
      <div className="flex min-h-dvh items-stretch">
        {!focus && <Sidebar />}
        <main className="@container flex min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
      {!focus && <BottomNav />}
    </>
  );
}
