"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useKanjiIndex } from "@/lib/data";
import { exportAll, importAll, resetAll } from "@/lib/db";
import {
  getSettings,
  replaceSettings,
  type Settings,
  setSettings,
  useSettings,
} from "@/lib/settings";
import { SectionLabel } from "@/ui/primitives";
import { useToast } from "@/ui/toast";

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-center gap-3 border-b border-line py-5 sm:grid-cols-[minmax(0,280px)_1fr] sm:gap-8">
      <div className="flex flex-col gap-1">
        <span className="text-[15px]">{label}</span>
        {hint && (
          <span className="text-[13px] text-pretty text-ink-3">{hint}</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Segmented<T extends string | number | boolean>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: [T, ReactNode][];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <fieldset className="flex flex-wrap border border-line">
      <legend className="sr-only">{label}</legend>
      {options.map(([v, l]) => (
        <button
          type="button"
          key={String(v)}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`px-3.5 py-2 text-[13px] transition-colors ${value === v ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </fieldset>
  );
}

export function SettingsView() {
  const s = useSettings();
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: index } = useKanjiIndex();
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => setMounted(true), []);
  const set =
    <K extends keyof Settings>(k: K) =>
    (v: Settings[K]) =>
      setSettings({ [k]: v } as Partial<Settings>);

  const doExport = async () => {
    const data = await exportAll(getSettings());
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sumi-progresso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Backup exportado");
  };
  const doImport = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      await importAll(data);
      if (data.settings) replaceSettings(data.settings);
      toast("Progresso restaurado");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Arquivo inválido");
    }
  };
  const doReset = async () => {
    if (
      !window.confirm(
        "Apagar todo o progresso deste aparelho? Isso não pode ser desfeito.",
      )
    )
      return;
    await resetAll();
    toast("Progresso apagado");
  };

  const btnCls =
    "press border border-line-2 px-4 py-2.5 text-[13px] transition-colors hover:border-ink";

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col gap-[clamp(48px,6cqi,80px)] p-[clamp(20px,4.5cqi,56px)]">
      <header className="flex flex-col gap-2">
        <span className="label-mono">Ajustes</span>
        <h1 className="m-0 text-[clamp(36px,5cqi,56px)] font-light leading-[1.05] tracking-[-.02em]">
          Do seu jeito
        </h1>
      </header>

      <section className="flex flex-col">
        <SectionLabel n="01">Aparência</SectionLabel>
        <Row
          label="Tema"
          hint="Nanquim não é inversão: papel quente vira tinta, tinta vira giz."
        >
          {mounted && (
            <Segmented<string>
              label="Tema"
              value={theme ?? "system"}
              onChange={(v) => setTheme(v)}
              options={[
                ["light", "Papel"],
                ["dark", "Nanquim"],
                ["system", "Sistema"],
              ]}
            />
          )}
        </Row>
        <Row
          label="Fonte do kanji"
          hint="Como o kanji herói é desenhado em toda a interface."
        >
          <Segmented
            label="Fonte do kanji"
            value={s.kanjiFont}
            onChange={set("kanjiFont")}
            options={[
              [
                "mincho",
                <span key="m" className="flex items-center gap-2">
                  <span lang="ja" className="font-min text-lg">
                    字
                  </span>
                  Mincho
                </span>,
              ],
              [
                "gothic",
                <span key="g" className="flex items-center gap-2">
                  <span lang="ja" className="font-goth text-lg">
                    字
                  </span>
                  Gótico
                </span>,
              ],
              [
                "brush",
                <span key="b" className="flex items-center gap-2">
                  <span
                    lang="ja"
                    className="text-lg"
                    style={{ fontFamily: "var(--brush)" }}
                  >
                    字
                  </span>
                  Pincel
                </span>,
              ],
            ]}
          />
        </Row>
        <Row
          label="Romaji"
          hint="Mostrar a transliteração ao lado das leituras."
        >
          <Segmented
            label="Romaji"
            value={s.romaji}
            onChange={set("romaji")}
            options={[
              [true, "Ligado"],
              [false, "Desligado"],
            ]}
          />
        </Row>
      </section>

      <section className="flex flex-col">
        <SectionLabel n="02">Movimento</SectionLabel>
        <Row
          label="Velocidade das animações"
          hint="Multiplica a duração dos traços, do carimbo e das transições."
        >
          <Segmented
            label="Velocidade"
            value={s.motionSpeed}
            onChange={set("motionSpeed")}
            options={[0.5, 0.75, 1, 1.5, 2].map(
              (v) => [v, `${String(v).replace(".", ",")}×`] as [number, string],
            )}
          />
        </Row>
        <Row
          label="Reduzir movimento"
          hint="Troca deslocamentos por fades curtos. Também segue a preferência do sistema."
        >
          <Segmented
            label="Reduzir movimento"
            value={s.reducedMotion}
            onChange={set("reducedMotion")}
            options={[
              [false, "Não"],
              [true, "Sim"],
            ]}
          />
        </Row>
      </section>

      <section className="flex flex-col">
        <SectionLabel n="03">Estudo</SectionLabel>
        <Row
          label="Meta diária"
          hint="Cartões por dia. Aparece no anel da barra lateral."
        >
          <Segmented
            label="Meta diária"
            value={s.dailyGoal}
            onChange={set("dailyGoal")}
            options={[10, 20, 30, 50].map(
              (v) => [v, String(v)] as [number, string],
            )}
          />
        </Row>
        <Row
          label="Kanji novos por dia"
          hint="Seguem a ordem do Jōyō (série escolar, depois frequência), depois os que você adicionar."
        >
          <Segmented
            label="Novos por dia"
            value={s.newPerDay}
            onChange={set("newPerDay")}
            options={[0, 3, 5, 10, 15].map(
              (v) => [v, String(v)] as [number, string],
            )}
          />
        </Row>
        <Row
          label="Guia fantasma na escrita"
          hint="Começar a prática de escrita com os traços-guia visíveis."
        >
          <Segmented
            label="Guia fantasma"
            value={s.ghostGuide}
            onChange={set("ghostGuide")}
            options={[
              [true, "Ligado"],
              [false, "Desligado"],
            ]}
          />
        </Row>
      </section>

      <section className="flex flex-col">
        <SectionLabel n="04">Seus dados</SectionLabel>
        <Row
          label="Progresso neste aparelho"
          hint="Tudo fica salvo localmente (IndexedDB) e funciona sem conexão. Exporte um backup para levar a outro aparelho."
        >
          <button type="button" onClick={doExport} className={btnCls}>
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={() => file.current?.click()}
            className={btnCls}
          >
            Importar JSON
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) doImport(f);
              e.target.value = "";
            }}
          />
        </Row>
        <Row
          label="Apagar progresso"
          hint="Remove cartões, histórico, mnemônicos e selos deste aparelho."
        >
          <button
            type="button"
            onClick={doReset}
            className="press border border-hanko px-4 py-2.5 text-[13px] text-hanko transition-colors hover:bg-hanko hover:text-on-hanko"
          >
            Apagar tudo
          </button>
        </Row>
      </section>

      <section className="flex flex-col gap-4">
        <SectionLabel n="05">Sobre</SectionLabel>
        <p className="m-0 max-w-[620px] text-sm leading-[1.7] text-pretty text-ink-2">
          Metadados e vocabulário:{" "}
          <a href="https://kanjiapi.dev" target="_blank" rel="noreferrer">
            kanjiapi.dev
          </a>{" "}
          (dados do EDRDG, KANJIDIC2 e JMdict). Ordem dos traços:{" "}
          <a
            href="https://kanjivg.tagaini.net"
            target="_blank"
            rel="noreferrer"
          >
            KanjiVG
          </a>{" "}
          {index ? `(${index.kanjivg})` : ""} de Ulrich Apel, sob licença{" "}
          <a
            href="https://creativecommons.org/licenses/by-sa/3.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 3.0
          </a>
          . Agendamento de revisões com o algoritmo FSRS.
        </p>
        <Link
          href="/sistema"
          className="self-start border-b border-ink pb-0.5 text-sm no-underline"
        >
          Design system Sumi &amp; Ma →
        </Link>
      </section>
    </div>
  );
}
