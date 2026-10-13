import type { Metadata } from "next";
import { KanaPage } from "@/features/kana/kana-page";

export const metadata: Metadata = { title: "Kana" };

export default function Page() {
  return <KanaPage />;
}
