import type { Metadata } from "next";
import { KanjiList } from "@/components";

export const metadata: Metadata = {
  title: "Grade 8",
};

export default function Grade8() {
  return <KanjiList list="grade-8" />;
}
