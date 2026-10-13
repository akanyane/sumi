import Link from "next/link";
import { btn, Enso } from "@/ui/primitives";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 p-6 text-center">
      <Enso size={120} />
      <div className="flex flex-col gap-2">
        <span lang="ja" className="font-min text-5xl font-semibold">
          迷子
        </span>
        <span className="text-lg">Página não encontrada</span>
        <span className="text-sm text-ink-3">
          O caminho se perdeu no papel.
        </span>
      </div>
      <Link href="/" className={`${btn.secondary} no-underline`}>
        Voltar a explorar
      </Link>
    </div>
  );
}
