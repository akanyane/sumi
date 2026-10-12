const BASE_URL = "https://kanjiapi.dev/v1";

export type KanjiList =
  | "all"
  | "grade-1"
  | "grade-2"
  | "grade-3"
  | "grade-4"
  | "grade-5"
  | "grade-6"
  | "grade-8"
  | "jouyou"
  | "jinmeiyou";

export type Kanji = {
  kanji: string;
  grade: number | null;
  stroke_count: number;
  meanings: string[];
  kun_readings: string[];
  on_readings: string[];
  jlpt: number | null;
  unicode: string;
};

export class KanjiApiError extends Error {
  constructor(public status: number) {
    super(`kanjiapi.dev responded with ${status}`);
  }
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) throw new KanjiApiError(response.status);
  return response.json();
}

export const fetchKanjiList = (list: KanjiList) =>
  get<string[]>(`/kanji/${list}`);

export const fetchKanji = (character: string) =>
  get<Kanji>(`/kanji/${encodeURIComponent(character)}`);
