"use client";

import { type Ref, useEffect, useImperativeHandle, useRef } from "react";
import type { StrokeData } from "@/lib/data";
import { EASE, isReduced } from "@/lib/motion";

const NS = "http://www.w3.org/2000/svg";
const SAMPLES = 32;
const TOLERANCE = 14;

export type WriteState = {
  i: number;
  err: number;
  scores: number[];
  msg: string;
  tone: "" | "ok" | "err";
  done: boolean;
};

export const freshWrite = (): WriteState => ({
  i: 0,
  err: 0,
  scores: [],
  msg: "Desenhe o traço 1",
  tone: "",
  done: false,
});

/** Precisão final = média − 4 × erros. */
export const writeScore = (w: WriteState) =>
  w.scores.length
    ? Math.max(
        0,
        Math.round(
          w.scores.reduce((a, b) => a + b, 0) / w.scores.length - w.err * 4,
        ),
      )
    : 0;

export type WritingPadHandle = { hint: () => void };

type Pt = [number, number];

function resample(pts: Pt[], n: number): { out: Pt[]; L: number } {
  let L = 0;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    cum.push(L);
  }
  if (L === 0) return { out: Array(n).fill(pts[0]), L };
  const out: Pt[] = [];
  let j = 1;
  for (let i = 0; i < n; i++) {
    const t = (L * i) / (n - 1);
    while (j < pts.length - 1 && cum[j] < t) j++;
    const a = pts[j - 1];
    const b = pts[j];
    const seg = cum[j] - cum[j - 1] || 1;
    const u = (t - cum[j - 1]) / seg;
    out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]);
  }
  return { out, L };
}

const meanDist = (a: Pt[], b: Pt[]) =>
  a.reduce((s, p, j) => s + Math.hypot(p[0] - b[j][0], p[1] - b[j][1]), 0) /
  a.length;

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

export function WritingPad({
  kanji,
  data,
  ghost,
  state,
  onChange,
  ref,
}: {
  kanji: string;
  data: StrokeData;
  ghost: boolean;
  state: WriteState;
  onChange: (s: WriteState) => void;
  ref?: Ref<WritingPadHandle>;
}) {
  const host = useRef<HTMLDivElement>(null);
  const parts = useRef<{
    ghost: SVGGElement;
    done: SVGGElement;
    hint: SVGGElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    samples: Pt[][];
    scale: number;
  } | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const showHint = (i = stateRef.current.i) => {
    const P = parts.current;
    if (!P || i >= data.p.length) return;
    P.hint.innerHTML = "";
    const e = mk(
      "path",
      { d: data.p[i] },
      "stroke:var(--hanko);stroke-width:3.6;opacity:.55",
    );
    P.hint.appendChild(e);
    const L = e.getTotalLength();
    e.style.strokeDasharray = String(L);
    const [sx, sy] = P.samples[i][0];
    const c = mk(
      "circle",
      { cx: sx, cy: sy, r: 3.2 },
      "fill:var(--hanko);stroke:none",
    );
    P.hint.appendChild(c);
    const R = isReduced();
    e.animate(
      R
        ? [{ opacity: 0 }, { opacity: 0.55 }]
        : [{ strokeDashoffset: L }, { strokeDashoffset: 0 }],
      {
        duration: 250 + L * 9,
        easing: "linear",
        fill: "both",
      },
    ).finished.then(() =>
      e.animate([{ opacity: 0.55 }, { opacity: 0.25 }], {
        duration: 900,
        fill: "forwards",
      }),
    );
    if (!R)
      c.animate(
        [
          { transform: "scale(1)", transformOrigin: `${sx}px ${sy}px` },
          {
            transform: "scale(1.6)",
            transformOrigin: `${sx}px ${sy}px`,
            opacity: 0.4,
          },
        ],
        { duration: 700, iterations: 3, direction: "alternate" },
      );
  };

  useImperativeHandle(ref, () => ({ hint: () => showHint() }));

  // biome-ignore lint/correctness/useExhaustiveDependencies: rebuild only when the kanji changes
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = "";
    const svg = mk(
      "svg",
      { viewBox: "0 0 109 109" },
      "position:absolute;inset:0;width:100%;height:100%;overflow:visible",
    );
    const guides = mk("g", {}, "stroke:var(--line);fill:none");
    ["M54.5 0V109", "M0 54.5H109", "M0 0L109 109", "M109 0L0 109"].forEach(
      (d, i) => {
        guides.appendChild(
          mk("path", {
            d,
            "vector-effect": "non-scaling-stroke",
            "stroke-dasharray": i > 1 ? "1 5" : "3 4",
          }),
        );
      },
    );
    const ghostG = mk(
      "g",
      {},
      "fill:none;stroke:var(--ghost);stroke-width:3.6;stroke-linecap:round;stroke-linejoin:round;transition:opacity .3s",
    );
    const doneG = mk(
      "g",
      {},
      "fill:none;stroke:var(--ink);stroke-width:3.6;stroke-linecap:round;stroke-linejoin:round",
    );
    const hintG = mk("g", {}, "fill:none;stroke-linecap:round");
    svg.append(guides, ghostG, doneG, hintG);
    const canvas = document.createElement("canvas");
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair";
    canvas.setAttribute("aria-label", `Área de escrita para ${kanji}`);
    canvas.setAttribute("role", "img");
    el.append(svg, canvas);
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const samples = data.p.map((d) => {
      const p = mk("path", { d });
      ghostG.appendChild(p);
      const L = p.getTotalLength();
      return Array.from({ length: SAMPLES }, (_, j) => {
        const q = p.getPointAtLength((L * j) / (SAMPLES - 1));
        return [q.x, q.y] as Pt;
      });
    });
    const P = {
      ghost: ghostG,
      done: doneG,
      hint: hintG,
      canvas,
      ctx,
      samples,
      scale: 1,
    };
    parts.current = P;
    // redraw strokes already completed (e.g. after a re-render)
    for (let i = 0; i < stateRef.current.i; i++)
      doneG.appendChild(mk("path", { d: data.p[i] }));

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      P.scale = r.width / 109;
    };
    fit();

    type Raw = [number, number, number, number];
    let pts: Raw[] | null = null;
    let lw = 0;
    let lwPrev: number | null = null;
    const toU = (e: PointerEvent): Raw => {
      const r = canvas.getBoundingClientRect();
      return [
        ((e.clientX - r.left) / r.width) * 109,
        ((e.clientY - r.top) / r.height) * 109,
        e.pressure || 0.5,
        performance.now(),
      ];
    };
    const clearInk = (fade: boolean) => {
      if (!fade) return ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas
        .animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: 320,
          easing: "ease-out",
        })
        .finished.then(() => ctx.clearRect(0, 0, canvas.width, canvas.height));
    };

    const evaluate = (raw: Raw[]) => {
      const w = stateRef.current;
      const i = w.i;
      if (w.done) return;
      const { out: u, L } = resample(
        raw.map((p) => [p[0], p[1]] as Pt),
        SAMPLES,
      );
      if (!u || L < 3) return clearInk(false);
      const exp = samples[i];
      const dd = meanDist(u, exp);
      const dr = meanDist(u, [...exp].reverse());
      let best = -1;
      let bd = 1e9;
      samples.forEach((sm, j) => {
        if (j <= i) return;
        const x = meanDist(u, sm);
        if (x < bd) {
          bd = x;
          best = j;
        }
      });
      if (dd < TOLERANCE && dd <= dr) {
        const sc = Math.round(Math.max(55, Math.min(100, 106 - dd * 4.2)));
        const e = mk("path", { d: data.p[i] });
        doneG.appendChild(e);
        const Lp = e.getTotalLength();
        e.style.strokeDasharray = String(Lp);
        e.animate(
          [
            { strokeDashoffset: Lp * 0.25, opacity: 0.4 },
            { strokeDashoffset: 0, opacity: 1 },
          ],
          { duration: isReduced() ? 1 : 220, easing: EASE.out },
        );
        hintG.innerHTML = "";
        clearInk(true);
        const fin = i + 1 >= data.p.length;
        onChangeRef.current({
          ...w,
          i: i + 1,
          scores: [...w.scores, sc],
          msg: fin
            ? "Escrita completa"
            : `Traço ${i + 1} · ${sc}% — agora o ${i + 2}`,
          tone: "ok",
          done: fin,
        });
        return;
      }
      const msg =
        dr < TOLERANCE
          ? "Direção invertida. Comece pelo ponto vermelho."
          : bd < TOLERANCE
            ? `Ordem: esse é o traço ${best + 1}. Agora é o ${i + 1}.`
            : "Forma imprecisa. Siga o guia.";
      clearInk(true);
      onChangeRef.current({ ...w, err: w.err + 1, msg, tone: "err" });
      showHint(i);
      el.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-4px)" },
          { transform: "translateX(3px)" },
          { transform: "translateX(0)" },
        ],
        { duration: isReduced() ? 1 : 260, easing: "ease-out" },
      );
    };

    canvas.onpointerdown = (e) => {
      if (stateRef.current.done) return;
      canvas.setPointerCapture(e.pointerId);
      fit();
      pts = [toU(e)];
      const ink = getComputedStyle(document.documentElement)
        .getPropertyValue("--ink")
        .trim();
      ctx.strokeStyle = ink;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      lw = 3.6 * P.scale;
      canvas.style.opacity = "1";
    };
    canvas.onpointermove = (e) => {
      if (!pts) return;
      const p = toU(e);
      const q = pts[pts.length - 1];
      const dist = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (dist < 0.4) return;
      const v = dist / Math.max(1, p[3] - q[3]);
      // pen: pressure; mouse/finger: faster = thinner
      const pr =
        e.pointerType === "pen"
          ? 0.55 + p[2] * 0.8
          : Math.max(0.62, Math.min(1.2, 1.25 - v * 0.35));
      const target = lw * pr;
      lwPrev = lwPrev ? lwPrev * 0.6 + target * 0.4 : target;
      ctx.lineWidth = lwPrev;
      ctx.beginPath();
      ctx.moveTo(q[0] * P.scale, q[1] * P.scale);
      ctx.lineTo(p[0] * P.scale, p[1] * P.scale);
      ctx.stroke();
      pts.push(p);
    };
    canvas.onpointerup = canvas.onpointercancel = () => {
      if (!pts) return;
      const p = pts;
      pts = null;
      lwPrev = null;
      evaluate(p);
    };
    return () => {
      canvas.onpointerdown =
        canvas.onpointermove =
        canvas.onpointerup =
        canvas.onpointercancel =
          null;
    };
  }, [kanji, data]);

  // reset (state went back to the first stroke)
  useEffect(() => {
    const P = parts.current;
    if (P && state.i === 0 && state.scores.length === 0 && state.err === 0) {
      P.done.innerHTML = "";
      P.hint.innerHTML = "";
      P.ctx.clearRect(0, 0, P.canvas.width, P.canvas.height);
    }
  }, [state]);

  useEffect(() => {
    if (parts.current) parts.current.ghost.style.opacity = ghost ? "1" : "0";
  }, [ghost]);

  return (
    <div
      ref={host}
      className="relative aspect-square w-[min(100%,400px)] select-none bg-paper-2"
    />
  );
}
