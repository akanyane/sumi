import type { Metadata } from "next";
import { KanjiList } from "@/components";

export const metadata: Metadata = {
  title: "Grade 3",
};

export default function Grade3() {
  return <KanjiList list="grade-3" />;
}
