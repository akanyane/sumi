import type { Metadata } from "next";
import { KanjiList } from "@/components";

export const metadata: Metadata = {
  title: "Grade 5",
};

export default function Grade5() {
  return <KanjiList list="grade-5" />;
}
