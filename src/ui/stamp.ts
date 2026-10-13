import { EASE, isReduced, ms } from "@/lib/motion";

type StampOpts = { size?: string; right?: string; bottom?: string };

let seq = 0;

/**
 * hanko.stamp — the seal slams onto `host` (which must be position:relative):
 * squash & settle, a 1.5px shake of the host and 14 ink particles. Resolves when settled.
 */
export function stamp(
  host: HTMLElement | null,
  { size = "18%", right = "4%", bottom = "4%" }: StampOpts = {},
) {
  return new Promise<void>((resolve) => {
    if (!host) return resolve();
    const R = isReduced();
    for (const e of host.querySelectorAll("[data-stamp-ov]")) e.remove();
    const id = `hkr${++seq}`;
    const el = document.createElement("div");
    el.setAttribute("data-stamp-ov", "1");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `position:absolute;right:${right};bottom:${bottom};width:${size};aspect-ratio:1;pointer-events:none;z-index:5;transform-origin:50% 60%`;
    el.innerHTML = `<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;overflow:visible"><defs><filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter></defs><g style="filter:url(#${id})"><rect x="3" y="3" width="94" height="94" rx="9" style="fill:var(--hanko)"/><rect x="10" y="10" width="80" height="80" rx="4" style="fill:none;stroke:var(--on-hanko);stroke-width:3"/><text x="50" y="70" text-anchor="middle" style="font-family:var(--min);font-weight:800;font-size:56px;fill:var(--on-hanko)">得</text></g></svg>`;
    host.appendChild(el);

    if (R) {
      el.animate(
        [
          { opacity: 0, transform: "rotate(-8deg) scale(.96)" },
          { opacity: 1, transform: "rotate(-8deg) scale(1)" },
        ],
        { duration: 220, easing: "ease-out", fill: "forwards" },
      ).finished.then(() => resolve());
      return;
    }

    const a = el.animate(
      [
        { opacity: 0, transform: "rotate(-18deg) scale(2)" },
        { opacity: 1, offset: 0.5, transform: "rotate(-7deg) scale(.95,.84)" },
        { offset: 0.74, transform: "rotate(-8deg) scale(1.035,1.01)" },
        { opacity: 1, transform: "rotate(-8deg) scale(1)" },
      ],
      { duration: ms(440), easing: EASE.stamp, fill: "forwards" },
    );
    setTimeout(() => {
      host.animate(
        [
          { transform: "translateY(0)" },
          { transform: "translateY(1.5px)" },
          { transform: "translateY(0)" },
        ],
        {
          duration: 120,
          easing: "ease-out",
        },
      );
      const r = el.getBoundingClientRect();
      const hr = host.getBoundingClientRect();
      const cx = r.left - hr.left + r.width / 2;
      const cy = r.top - hr.top + r.height / 2;
      for (let i = 0; i < 14; i++) {
        const p = document.createElement("span");
        const sz = 2 + Math.random() * 5;
        const ang = Math.random() * Math.PI * 2;
        const dist = r.width * (0.55 + Math.random() * 0.6);
        p.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:${sz}px;height:${sz * (0.7 + Math.random() * 0.6)}px;border-radius:50%;background:var(--hanko);pointer-events:none;z-index:4`;
        host.appendChild(p);
        p.animate(
          [
            { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
            {
              transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px),calc(-50% + ${Math.sin(ang) * dist}px)) scale(.2)`,
              opacity: 0,
            },
          ],
          {
            duration: 520 + Math.random() * 240,
            easing: EASE.particles,
            fill: "forwards",
          },
        ).finished.then(() => p.remove());
      }
    }, ms(220));
    a.finished.then(() => resolve());
  });
}

/** Remove a stamp overlay once the static seal has taken its place. */
export const clearStamp = (host: HTMLElement | null) => {
  for (const e of host?.querySelectorAll("[data-stamp-ov]") ?? []) e.remove();
};
