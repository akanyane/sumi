import type { Metadata } from "next";
import { CollectionView } from "@/features/explore/home";

export const metadata: Metadata = { title: "Secundário" };

export default function Page() {
  return <CollectionView id="grade-8" />;
}
