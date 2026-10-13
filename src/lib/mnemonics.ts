import { componentName, type Kanji, type KanjiIndex } from "./data";

/** Hand-written mnemonics for the highlights; everything else gets one built from its parts. */
export const MNEMONICS: Record<string, string> = {
  日: "Uma janela com o sol no centro. Quatro traços, um dia inteiro.",
  水: "Um traço central forte; gotas que se espalham para os lados.",
  学: "Uma criança (子) sob um teto (冖), com a luz do conhecimento (⺍) caindo sobre ela.",
  語: "Dizer (言) as palavras do “eu” (吾): a língua é como eu falo.",
  愛: "Uma garra (⺤) segura o coração (心) sob um teto, enquanto os passos (夂) hesitam.",
  鬱: "Entre árvores (木), um jarro (缶) tampado de ervas (鬯) fermenta. O bosque pesa sobre o pincel (彡).",
  休: "Uma pessoa (亻) encostada numa árvore (木): descanso.",
  林: "Duas árvores (木木) já são um bosque.",
  森: "Três árvores (木) fazem uma floresta.",
  明: "Sol (日) e lua (月) juntos: claridade.",
  男: "Força (力) no arrozal (田): o homem que trabalha a terra.",
  好: "Mulher (女) e criança (子): gostar, querer bem.",
  山: "Três picos lado a lado.",
  川: "Três linhas de água correndo.",
  口: "Uma boca aberta, quadrada.",
  人: "Duas pernas que caminham.",
  木: "Tronco, galhos e raízes.",
  火: "Chamas subindo dos dois lados.",
  見: "Um olho (目) sobre pernas (儿): ver é ir até lá olhar.",
  聞: "Uma orelha (耳) no portão (門): ouvir.",
  話: "Dizer (言) com a língua (舌): conversar.",
  読: "Dizer (言) o que se vende (売) em voz alta: ler.",
};

export function mnemonicFor(k: Kanji, index?: KanjiIndex): string {
  if (MNEMONICS[k.k]) return MNEMONICS[k.k];
  const parts = k.c
    .map((c) => {
      const n = componentName(c, index, false);
      return n ? `${n} (${c})` : c;
    })
    .filter(Boolean);
  if (parts.length >= 2)
    return `Junte ${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}.`;
  return "";
}
