import type { Metadata } from "next";
import { DesignSystem } from "@/features/system/design-system";

export const metadata: Metadata = { title: "Design system" };

export default function SystemPage() {
  return <DesignSystem />;
}
