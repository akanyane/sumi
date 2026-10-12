import type { Metadata } from "next";
import { KanjiList } from "@/components";

export const metadata: Metadata = {
  title: "Grade 2",
};

export default function Grade2() {
  return <KanjiList list="grade-2" />;
}
