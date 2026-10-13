# 墨 Sumi — Kanji

Dicionário e plataforma de estudo de kanji com a direção visual “Sumi & Ma”: ordem dos traços animada, repetição espaçada (FSRS), prática de escrita com verificação traço a traço e progresso salvo no aparelho (IndexedDB).

```bash
bun install
bun run dev      # http://localhost:3000
bun run lint     # Biome
bun run data     # regenera public/data a partir da kanjiapi.dev e do KanjiVG
```

- `public/data/kanji.json` — índice dos 3.003 kanji Jōyō + Jinmeiyō (metadados, componentes, irmãos).
- `public/data/k/{codepoint}.json` — traços, posições dos números e vocabulário de cada kanji.
- Kanji fora desse conjunto são buscados na kanjiapi.dev e no KanjiVG (jsDelivr) em tempo real.

Dados: [kanjiapi.dev](https://kanjiapi.dev) (EDRDG — KANJIDIC2/JMdict). Ordem dos traços: [KanjiVG](https://kanjivg.tagaini.net), © Ulrich Apel, CC BY-SA 3.0.
