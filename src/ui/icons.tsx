import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const line = (d: string, extra?: React.ReactNode) =>
  function Icon({ size = 16, ...props }: P) {
    return (
      <svg
        viewBox="0 0 20 20"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...props}
      >
        <path d={d} />
        {extra}
      </svg>
    );
  };

export const IconGrid = line(
  "M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z",
);
export const IconBook = line(
  "M3 5h5a2 2 0 012 2v9a2 2 0 00-2-2H3zM17 5h-5a2 2 0 00-2 2v9a2 2 0 012-2h5z",
);
export const IconTrend = line("M3 16l5-6 3 3 6-8M13 5h4v4");
export const IconSearch = line("M13 13l4 4", <circle cx="9" cy="9" r="5.5" />);
export const IconLeft = line("M12.5 5l-5 5 5 5");
export const IconRight = line("M7.5 5l5 5-5 5");
export const IconBack = line("M16 10H4M9 5l-5 5 5 5");
export const IconArrow = line("M4 10h12M11 5l5 5-5 5");
export const IconClose = line("M5 5l10 10M15 5L5 15");
export const IconPlus = line("M10 4v12M4 10h12");
export const IconSpeaker = line(
  "M3 8h3l4-3v10l-4-3H3zM13.5 7.5c1 1.2 1 3.8 0 5",
);
export const IconSpeakerLg = line(
  "M3 8h3l4-3v10l-4-3H3zM13.5 7.5c1 1.2 1 3.8 0 5M15.5 5.5c2 2.4 2 6.6 0 9",
);
export const IconSettings = line(
  "M10 7.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5zM10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4",
);

export function IconPlay({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 4l10 6-10 6z" />
    </svg>
  );
}

export function IconPause({ size = 14 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="5" y="4" width="3" height="12" />
      <rect x="12" y="4" width="3" height="12" />
    </svg>
  );
}
