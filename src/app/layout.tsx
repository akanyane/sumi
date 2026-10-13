import type { Metadata, Viewport } from "next";
import {
  IBM_Plex_Mono,
  Jost,
  Shippori_Mincho,
  Yuji_Syuku,
  Zen_Kaku_Gothic_New,
} from "next/font/google";
import type { ReactNode } from "react";
import { settingsBootScript } from "@/lib/settings";
import { AppShell } from "@/ui/shell";
import { Providers } from "./providers";
import "./globals.css";

const shippori = Shippori_Mincho({
  weight: ["400", "600", "800"],
  subsets: ["latin"],
  variable: "--font-shippori",
  display: "swap",
  preload: false,
});
const zenKaku = Zen_Kaku_Gothic_New({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-zen-kaku",
  display: "swap",
  preload: false,
});
const yuji = Yuji_Syuku({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yuji",
  display: "swap",
  preload: false,
});
const jost = Jost({
  weight: ["300", "400", "500"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-jost",
  display: "swap",
});
const plex = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "墨 Sumi — Kanji", template: "%s · Sumi" },
  description:
    "Dicionário e plataforma de estudo de kanji: ordem dos traços animada, repetição espaçada (FSRS), prática de escrita e progresso salvo no seu aparelho.",
  applicationName: "Sumi",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F1EA" },
    { media: "(prefers-color-scheme: dark)", color: "#141412" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${shippori.variable} ${zenKaku.variable} ${yuji.variable} ${jost.variable} ${plex.variable}`}
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static boot script, avoids a flash of the default kanji font */}
        <script dangerouslySetInnerHTML={{ __html: settingsBootScript }} />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
