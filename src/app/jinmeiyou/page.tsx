import type { Metadata } from "next";
import { KanjiList } from "@/components";

export const metadata: Metadata = {
  title: "Jinmeiyou",
};

export default function Jinmeiyou() {
  return <KanjiList list="jinmeiyou" />;
}
