import type { Metadata } from "next";
import { Suspense } from "react";
import { StudySession } from "@/features/study/session";

export const metadata: Metadata = { title: "Aprender" };

export default function StudyPage() {
  return (
    <Suspense>
      <StudySession />
    </Suspense>
  );
}
