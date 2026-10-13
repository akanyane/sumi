import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KanjiDetail } from "@/features/kanji/detail";

type Props = {
  params: Promise<{ character: string }>;
};

// Next sometimes hands over the segment still encoded and sometimes already decoded
const decode = async (params: Props["params"]) => {
  const { character } = await params;
  try {
    return decodeURIComponent(character);
  } catch {
    return character;
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: await decode(params) };
}

export default async function KanjiPage({ params }: Props) {
  const character = await decode(params);

  // Anything that isn't a single character can't be a kanji
  if ([...character].length !== 1) notFound();

  return <KanjiDetail character={character} />;
}
