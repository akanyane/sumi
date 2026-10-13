"use client";

import { useEffect, useRef } from "react";
import { expoOut, isReduced } from "@/lib/motion";

/** count.up — easeOutExpo from 0 to `to` over 950ms. */
export function CountUp({
  to,
  decimals = 0,
  delay = 0,
}: {
  to: number;
  decimals?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const fmt = (v: number) =>
      decimals
        ? v.toFixed(decimals).replace(".", ",")
        : Math.round(v).toLocaleString("pt-BR");
    const el = ref.current;
    if (!el) return;
    if (isReduced()) {
      el.textContent = fmt(to);
      return;
    }
    const t0 = performance.now() + delay;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.max(0, Math.min(1, (now - t0) / 950));
      el.textContent = fmt(to * expoOut(p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, decimals, delay]);
  return <span ref={ref}>{isReduced() ? to : 0}</span>;
}
