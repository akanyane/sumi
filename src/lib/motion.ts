"use client";

import { useSyncExternalStore } from "react";
import { getSettings, useSettings } from "./settings";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMq(l: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", l);
  return () => mq.removeEventListener("change", l);
}
const systemReduced = () => window.matchMedia(QUERY).matches;

/** Reduced motion = OS preference OR the in-app setting. */
export function useReducedMotion() {
  const os = useSyncExternalStore(subscribeMq, systemReduced, () => false);
  const { reducedMotion } = useSettings();
  return os || reducedMotion;
}

/** Non-hook read for imperative animation code. */
export function isReduced() {
  if (typeof window === "undefined") return false;
  return systemReduced() || getSettings().reducedMotion;
}

/** Global multiplier from the "velocidade das animações" setting (0.5×–2×). */
export const motionSpeed = () =>
  typeof window === "undefined" ? 1 : getSettings().motionSpeed || 1;

/** Duration scaled by the global speed setting. */
export const ms = (d: number) => d / motionSpeed();

export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  return (t: number) => {
    let x = t;
    for (let i = 0; i < 6; i++) {
      const cx =
        3 * x1 * x * (1 - x) ** 2 + 3 * x2 * x * x * (1 - x) + x ** 3 - t;
      const dx =
        3 * x1 * (1 - x) ** 2 +
        6 * (x2 - x1) * x * (1 - x) +
        3 * (1 - x2) * x * x;
      if (Math.abs(dx) < 1e-6) break;
      x -= cx / dx;
    }
    return 3 * y1 * x * (1 - x) ** 2 + 3 * y2 * x * x * (1 - x) + x ** 3;
  };
}

const brushBody = cubicBezier(0.6, 0, 0.25, 1);
/**
 * ink.stroke — the brush curve: covers 96.5% of the stroke in the first 86% of the time,
 * then a slow ease-out "drag" for the remaining 3.5%.
 */
export const brushEase = (p: number) =>
  p < 0.86
    ? brushBody(p / 0.86) * 0.965
    : 0.965 + 0.035 * (1 - (1 - (p - 0.86) / 0.14) ** 2);

/** Simulates a damped spring and returns it as a CSS `linear()` easing + duration. */
export function springEasing(stiffness = 420, damping = 26) {
  let x = 0;
  let v = 0;
  let t = 0;
  const dt = 1 / 120;
  const pts: number[] = [];
  while (t < 2) {
    const a = -stiffness * (x - 1) - damping * v;
    v += a * dt;
    x += v * dt;
    t += dt;
    pts.push(x);
    if (t > 0.2 && Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break;
  }
  const step = Math.max(1, Math.floor(pts.length / 36));
  const s = [0];
  for (let i = step; i < pts.length; i += step) s.push(+pts[i].toFixed(4));
  s.push(1);
  return { easing: `linear(${s.join(",")})`, duration: Math.round(t * 1000) };
}

export const EASE = {
  out: "cubic-bezier(.2,.7,.2,1)",
  fill: "cubic-bezier(.65,0,.35,1)",
  bleed: "cubic-bezier(.16,1,.3,1)",
  stamp: "cubic-bezier(.3,0,.2,1)",
  particles: "cubic-bezier(.1,.8,.3,1)",
} as const;

/** easeOutExpo count-up, used by stats. */
export const expoOut = (p: number) => (p >= 1 ? 1 : 1 - 2 ** (-10 * p));
