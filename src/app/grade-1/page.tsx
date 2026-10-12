import type { Metadata } from "next";
import { KanjiList } from "@/components";

export const metadata: Metadata = {
  title: "Grade 1",
};

export default function Grade1() {
  return <KanjiList list="grade-1" />;
}
