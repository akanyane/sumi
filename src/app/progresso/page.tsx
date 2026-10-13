import type { Metadata } from "next";
import { Progress } from "@/features/progress/progress";

export const metadata: Metadata = { title: "Progresso" };

export default function ProgressPage() {
  return <Progress />;
}
