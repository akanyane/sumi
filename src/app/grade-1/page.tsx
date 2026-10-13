import type { Metadata } from "next";
import { CollectionView } from "@/features/explore/home";

export const metadata: Metadata = { title: "Série 1" };

export default function Page() {
  return <CollectionView id="grade-1" />;
}
