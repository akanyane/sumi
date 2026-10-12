import type { Metadata } from "next";
import { KanjiList } from "@/components";

export const metadata: Metadata = {
  title: "Jouyou",
};

export default function Jouyou() {
  return <KanjiList list="jouyou" />;
}
