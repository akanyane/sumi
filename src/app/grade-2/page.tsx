import type { Metadata } from "next";
import { CollectionView } from "@/features/explore/home";

export const metadata: Metadata = { title: "Série 2" };

export default function Page() {
  return <CollectionView id="grade-2" />;
}
