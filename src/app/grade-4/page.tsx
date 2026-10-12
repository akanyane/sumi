import type { Metadata } from "next";
import { KanjiList } from "@/components";

export const metadata: Metadata = {
  title: "Grade 4",
};

export default function Grade4() {
  return <KanjiList list="grade-4" />;
}
