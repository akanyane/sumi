import type { Metadata } from "next";
import { CollectionView } from "@/features/explore/home";

export const metadata: Metadata = { title: "Série 6" };

export default function Page() {
  return <CollectionView id="grade-6" />;
}
