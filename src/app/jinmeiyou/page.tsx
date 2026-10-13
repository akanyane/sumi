import type { Metadata } from "next";
import { CollectionView } from "@/features/explore/home";

export const metadata: Metadata = { title: "Jinmeiyō" };

export default function Page() {
  return <CollectionView id="jinmeiyou" />;
}
