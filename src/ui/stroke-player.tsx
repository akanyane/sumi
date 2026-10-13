"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pad, type StrokeData } from "@/lib/data";
import { brushEase, isReduced, motionSpeed } from "@/lib/motion";
import { IconLeft, IconPause, IconPlay, IconRight } from "./icons";

const NS = "http://www.w3.org/2000/svg";

type Options = {
  guides?: boolean;
  numbers?: boolean;
  accent?: boolean;
  strokeWidth?: number;
  numSize?: number;
  /** ms before autoplay; null = don't autoplay */
  autoplay?: number | null;
  onStart?: () => void;
};

export type PlayerUI = {
  i: number;
  n: number;
  playing: boolean;
  speed: number;
};

type Engine = {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  replay: () => void;
  step: (dir: 1 | -1) => void;
  setSpeed: (s: number) => void;
  destroy: () => void;
};

function mk<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
  css = "",
) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  if (css) e.style.cssText = css;
  return e;
}

function buildEngine(
  el: HTMLElement,
  kanji: string,
  data: StrokeData,
  opts: Options,
  onUI: (u: PlayerUI) => void,
): Engine {
  const R = isReduced();
  el.innerHTML = "";
  const svg = mk(
    "svg",
    {
      viewBox: "0 0 109 109",
      role: "img",
      "aria-label": `Ordem dos traços de ${kanji}, ${data.p.length} traços`,
    },
    "width:100%;height:100%;display:block;overflow:visible",
  );
  el.appendChild(svg);
  if (opts.guides !== false) {
    const g = mk("g", {}, "stroke:var(--line);fill:none");
    for (const d of ["M54.5 2V107", "M2 54.5H107"])
      g.appendChild(
        mk("path", {
          d,
          "vector-effect": "non-scaling-stroke",
          "stroke-dasharray": "2 4",
        }),
      );
    g.appendChild(
      mk("rect", {
        x: 1,
        y: 1,
        width: 107,
        height: 107,
        "vector-effect": "non-scaling-stroke",
      }),
    );
    svg.appendChild(g);
  }
  const sw = opts.strokeWidth ?? 3.4;
  const ghost = mk(
    "g",
    {},
    `fill:none;stroke:var(--ghost);stroke-width:${sw};stroke-linecap:round;stroke-linejoin:round`,
  );
  const ink = mk(
    "g",
    {},
    "fill:none;stroke-linecap:round;stroke-linejoin:round",
  );
  const numG = mk(
    "g",
    {},
    `font-family:var(--mono);font-size:${opts.numSize ?? 4.6}px`,
  );
  svg.append(ghost, ink, numG);

  const paths = data.p.map((d) => {
    ghost.appendChild(mk("path", { d }));
    const e = mk("path", { d });
    ink.appendChild(e);
    const L = e.getTotalLength();
    e.style.strokeDasharray = `${L} ${L + 2}`;
    e.style.strokeDashoffset = String(L);
    e.style.stroke = "var(--ink)";
    e.style.strokeWidth = String(sw);
    return { e, L };
  });
  const nums = (opts.numbers === false ? [] : data.n).map(([x, y], i) => {
    const t = mk("text", { x, y });
    t.textContent = String(i + 1);
    t.style.fill = "var(--ink-3)";
    t.style.opacity = "0";
    t.style.transition = "fill .3s, opacity .25s";
    numG.appendChild(t);
    return t;
  });

  let acc = 0;
  const seg = paths.map((p) => {
    const dur = R ? 260 : 220 + p.L * 7.5;
    const s = { start: acc, dur };
    acc += dur + (R ? 60 : 150);
    return s;
  });
  const total = acc;
  const S = {
    t: 0,
    playing: false,
    speed: 1,
    stopAt: null as number | null,
    raf: 0,
    last: 0,
  };
  let lastUI = "";

  const render = () => {
    let done = 0;
    paths.forEach((p, i) => {
      const s = seg[i];
      const lp = Math.max(0, Math.min(1, (S.t - s.start) / s.dur));
      if (lp >= 1) done = i + 1;
      if (R) {
        p.e.style.strokeDashoffset = "0";
        p.e.style.opacity = String(lp);
      } else {
        p.e.style.strokeDashoffset = String(p.L * (1 - brushEase(lp)));
        p.e.style.strokeWidth = String(
          lp > 0 && lp < 1 ? sw * (0.78 + 0.3 * Math.min(1, lp * 1.8)) : sw,
        );
      }
      p.e.style.stroke =
        lp > 0 && lp < 1 && opts.accent !== false
          ? "var(--hanko)"
          : "var(--ink)";
      const num = nums[i];
      if (num) {
        num.style.opacity = lp > 0 ? "1" : "0";
        num.style.fill = lp > 0 && lp < 1 ? "var(--hanko)" : "var(--ink-3)";
      }
    });
    const started = seg.filter((x) => S.t > x.start).length;
    const ui = {
      i: Math.max(done, started),
      n: paths.length,
      playing: S.playing,
      speed: S.speed,
    };
    const key = JSON.stringify(ui);
    if (key !== lastUI) {
      lastUI = key;
      onUI(ui);
    }
  };

  const tick = (now: number) => {
    const dt = Math.min(64, now - S.last);
    S.last = now;
    S.t += dt * S.speed * motionSpeed();
    const end = S.stopAt ?? total;
    if (S.t >= end) {
      S.t = end;
      S.playing = false;
      S.stopAt = null;
      render();
      return;
    }
    render();
    S.raf = requestAnimationFrame(tick);
  };

  const engine: Engine = {
    play() {
      if (S.t >= total) S.t = 0;
      S.playing = true;
      S.last = performance.now();
      cancelAnimationFrame(S.raf);
      S.raf = requestAnimationFrame(tick);
      render();
      opts.onStart?.();
    },
    pause() {
      S.playing = false;
      S.stopAt = null;
      cancelAnimationFrame(S.raf);
      render();
    },
    toggle() {
      if (S.playing) engine.pause();
      else engine.play();
    },
    replay() {
      S.t = 0;
      S.stopAt = null;
      engine.play();
    },
    step(dir) {
      cancelAnimationFrame(S.raf);
      S.playing = false;
      const idx = seg.findIndex((s) => S.t < s.start + s.dur);
      const c = idx === -1 ? paths.length : idx;
      if (dir > 0) {
        if (c >= paths.length) return render();
        if (S.t < seg[c].start) S.t = seg[c].start;
        S.stopAt = seg[c].start + seg[c].dur;
        S.playing = true;
        S.last = performance.now();
        S.raf = requestAnimationFrame(tick);
        opts.onStart?.();
      } else {
        const target = c - 1;
        S.t = target <= 0 ? 0 : seg[target - 1].start + seg[target - 1].dur;
        S.stopAt = null;
        render();
      }
    },
    setSpeed(s) {
      S.speed = s;
      render();
    },
    destroy() {
      cancelAnimationFrame(S.raf);
    },
  };
  render();
  return engine;
}

export function useStrokePlayer(
  kanji: string,
  data: StrokeData | undefined,
  opts: Options = {},
) {
  const ref = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);
  const [ui, setUI] = useState<PlayerUI>({
    i: 0,
    n: data?.p.length ?? 0,
    playing: false,
    speed: 1,
  });
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    const el = ref.current;
    if (!el || !data?.p.length) return;
    const o = optsRef.current;
    const e = buildEngine(
      el,
      kanji,
      data,
      { ...o, onStart: () => optsRef.current.onStart?.() },
      setUI,
    );
    engine.current = e;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (o.autoplay != null) timer = setTimeout(() => e.play(), o.autoplay);
    return () => {
      clearTimeout(timer);
      e.destroy();
      engine.current = null;
    };
  }, [kanji, data]);

  const call = useCallback(
    <K extends keyof Engine>(k: K) =>
      (...a: Parameters<Engine[K]>) => {
        // biome-ignore lint/suspicious/noExplicitAny: forwarding variadic engine calls
        (engine.current?.[k] as any)?.(...a);
      },
    [],
  );

  return {
    ref,
    ui,
    play: call("play"),
    pause: call("pause"),
    toggle: call("toggle"),
    replay: call("replay"),
    step: call("step"),
    setSpeed: call("setSpeed"),
  };
}

export type StrokePlayerHandle = ReturnType<typeof useStrokePlayer>;

export function PlayerControls({
  player,
  speeds = true,
}: {
  player: StrokePlayerHandle;
  speeds?: boolean;
}) {
  const { ui } = player;
  const iconBtn =
    "grid size-9 place-items-center transition-colors hover:bg-ghost";
  return (
    <div className="flex items-center gap-1 border border-line p-1">
      <button
        type="button"
        onClick={() => player.step(-1)}
        aria-label="Traço anterior"
        className={iconBtn}
      >
        <IconLeft />
      </button>
      <button
        type="button"
        onClick={() => player.toggle()}
        aria-label={ui.playing ? "Pausar" : "Reproduzir"}
        className="press grid h-9 w-11 place-items-center bg-ink text-paper"
      >
        {ui.playing ? <IconPause /> : <IconPlay />}
      </button>
      <button
        type="button"
        onClick={() => player.step(1)}
        aria-label="Próximo traço"
        className={iconBtn}
      >
        <IconRight />
      </button>
      <span className="min-w-16 px-2.5 text-center font-mono text-xs tabular-nums">
        {pad(ui.i)} / {pad(ui.n)}
      </span>
      {speeds &&
        [0.5, 1, 2].map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => player.setSpeed(s)}
            aria-pressed={ui.speed === s}
            className={`px-[7px] py-2 font-mono text-[11px] ${ui.speed === s ? "text-ink" : "text-ink-3 hover:text-ink-2"}`}
          >
            {s}×
          </button>
        ))}
    </div>
  );
}
