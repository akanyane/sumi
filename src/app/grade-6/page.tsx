import type { Metadata } from "next";
import { KanjiList } from "@/components";

export const metadata: Metadata = {
  title: "Grade 6",
};

export default function Grade6() {
  return <KanjiList list="grade-6" />;
}
