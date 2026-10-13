import type { Metadata } from "next";
import { CollectionView } from "@/features/explore/home";

export const metadata: Metadata = { title: "Jōyō" };

export default function Page() {
  return <CollectionView id="jouyou" />;
}
