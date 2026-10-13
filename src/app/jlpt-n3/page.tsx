import type { Metadata } from "next";
import { CollectionView } from "@/features/explore/home";

export const metadata: Metadata = { title: "JLPT N3" };

export default function Page() {
  return <CollectionView id="jlpt-n3" />;
}
