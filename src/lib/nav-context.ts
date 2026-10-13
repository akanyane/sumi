/** The list the user came from, so J/K on the detail page walks through it. */
export type NavContext = { label: string; href: string; list: string };

const KEY = "sumi:nav";

export function setNavContext(ctx: NavContext) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {}
}

export function getNavContext(): NavContext | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NavContext) : null;
  } catch {
    return null;
  }
}

/** CSS-safe view-transition name for a kanji's shared glyph. */
export const vtName = (k: string) =>
  `k-${(k.codePointAt(0) ?? 0).toString(16)}`;

/** Last pointer position, used as the origin of the grid stagger. */
export const pointer = { x: -1, y: -1 };
if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    },
    { passive: true },
  );
}
