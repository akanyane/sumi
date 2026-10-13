const ROMAJI: Record<string, string> = Object.fromEntries(
  "あa いi うu えe おo かka きki くku けke こko がga ぎgi ぐgu げge ごgo さsa しshi すsu せse そso ざza じji ずzu ぜze ぞzo たta ちchi つtsu てte とto だda ぢji づzu でde どdo なna にni ぬnu ねne のno はha ひhi ふfu へhe ほho ばba びbi ぶbu べbe ぼbo ぱpa ぴpi ぷpu ぺpe ぽpo まma みmi むmu めme もmo やya ゆyu よyo らra りri るru れre ろro わwa ゐi ゑe をwo んn ぁa ぃi ぅu ぇe ぉo ゔvu"
    .split(" ")
    .map((s) => [s[0], s.slice(1)]),
);

/** Katakana → hiragana. */
export const toHira = (s: string) =>
  s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

/** Strip the okurigana dot and affix dashes used by KANJIDIC ("まな.ぶ", "-び"). */
export const cleanReading = (r: string) => r.replace(/[.-]/g, "");

export function romaji(input: string): string {
  const h = toHira(cleanReading(input));
  let o = "";
  for (let i = 0; i < h.length; i++) {
    const c = h[i];
    if (c === "っ") {
      const n = ROMAJI[h[i + 1]];
      if (n) o += n[0] === "c" ? "t" : n[0];
      continue;
    }
    if ("ゃゅょ".includes(c)) {
      const v = { ゃ: "a", ゅ: "u", ょ: "o" }[c as "ゃ"];
      o = /(sh|ch|j)i$/.test(o) ? o.slice(0, -1) + v : `${o.slice(0, -1)}y${v}`;
      continue;
    }
    if (c === "ー") {
      o += o.slice(-1);
      continue;
    }
    o += ROMAJI[c] ?? c;
  }
  return o;
}

/** Split a KANJIDIC kun reading into stem + okurigana, keeping prefix/suffix markers. */
export function splitKun(r: string) {
  const pre = r.startsWith("-") ? "‐" : "";
  const post = r.endsWith("-") ? "‐" : "";
  const core = r.replace(/^-|-$/g, "");
  const [main, oku = ""] = core.split(".");
  return { pre, main, oku, post, plain: main + oku };
}

/** Accent-insensitive lowercase, for matching Portuguese queries. */
export const fold = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
