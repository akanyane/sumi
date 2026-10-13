import type { ReactNode } from "react";

/** `01  TÍTULO ───────── meta` */
export function SectionLabel({
  n,
  children,
  meta,
  id,
}: {
  n?: string;
  children: ReactNode;
  meta?: ReactNode;
  id?: string;
}) {
  return (
    <div className="label-mono flex items-center gap-3">
      {n && <span>{n}</span>}
      <span id={id}>{children}</span>
      <span className="h-px flex-1 bg-line" />
      {meta !== undefined && (
        <span className="flex items-center gap-2">{meta}</span>
      )}
    </div>
  );
}

/** Static hanko seal with the 得 ("attained") glyph. */
export function Hanko({
  size = 22,
  className = "",
  glyph = "得",
}: {
  size?: number;
  className?: string;
  glyph?: string;
}) {
  const inset = Math.max(1.5, size / 14);
  return (
    <span
      aria-hidden="true"
      lang="ja"
      className={`grid place-items-center bg-hanko font-min font-extrabold leading-none text-on-hanko ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.58,
        borderRadius: size > 40 ? 6 : 2,
        transform: "rotate(-8deg)",
        boxShadow: `inset 0 0 0 ${inset}px var(--hanko), inset 0 0 0 ${inset + 1}px var(--on-hanko)`,
      }}
    >
      {glyph}
    </span>
  );
}

export function ProgressRing({
  value,
  size = 44,
  track = 6,
  stroke = 6,
  children,
  ringRef,
}: {
  /** 0–100 */
  value: number;
  size?: number | string;
  track?: number;
  stroke?: number;
  children?: ReactNode;
  ringRef?: React.Ref<SVGCircleElement>;
}) {
  return (
    <div className="relative aspect-square" style={{ width: size }}>
      <svg viewBox="0 0 100 100" className="block size-full" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--line)"
          strokeWidth={track}
        />
        <circle
          ref={ringRef}
          data-ring={100 - value}
          cx="50"
          cy="50"
          r="42"
          pathLength={100}
          transform="rotate(-90 50 50)"
          fill="none"
          stroke="var(--ink)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={100}
          strokeDashoffset={100 - Math.max(0, Math.min(100, value))}
        />
      </svg>
      {children && (
        <span className="absolute inset-0 grid place-items-center font-mono text-[13px]">
          {children}
        </span>
      )}
    </div>
  );
}

/** Open ensō — the empty state. */
export function Enso({
  size = 96,
  width = 5,
}: {
  size?: number;
  width?: number;
}) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
      <path
        d="M78 20 C 50 10, 18 30, 20 64 C 22 96, 62 108, 88 90 C 104 78, 104 50, 92 36"
        fill="none"
        stroke="var(--ink)"
        strokeWidth={width}
        strokeLinecap="round"
        opacity={0.85}
      />
    </svg>
  );
}

/** Brush-stroke skeleton bar. */
export function Skel({
  w,
  h = 8,
  rot = -3,
  className = "",
}: {
  w: number | string;
  h?: number;
  rot?: number;
  className?: string;
}) {
  return (
    <div
      className={`skel ${className}`}
      style={{
        width: w,
        height: h,
        borderRadius: "60% 40% 50% 50% / 80% 70% 30% 20%",
        rotate: `${rot}deg`,
      }}
    />
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span className="border border-line px-1.5 py-px font-mono text-[10px] text-ink-3">
      {children}
    </span>
  );
}

export const btn = {
  primary:
    "press inline-flex items-center justify-center gap-2 bg-ink px-5 py-[13px] text-sm tracking-[.02em] text-paper",
  secondary:
    "press inline-flex items-center justify-center gap-2 border border-line-2 px-[18px] py-3 text-sm transition-colors hover:border-ink",
  hanko:
    "press inline-flex items-center justify-center gap-2 border border-hanko px-4 py-[13px] text-sm text-hanko transition-colors hover:bg-hanko hover:text-on-hanko",
  ghost:
    "press inline-flex items-center gap-2 text-sm text-ink-2 transition-colors hover:text-ink",
};
