"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchKanji, KanjiApiError } from "@/lib/kanji-api";
import Character from "../character";
import ErrorMessage from "../error-message";
import LoadingCharacters from "../loading-characters";
import NotFound from "../not-found";

const KanjiDetail = ({ character }: { character: string }) => {
  const { isPending, isError, error, data, refetch } = useQuery({
    queryKey: ["kanji", character],
    queryFn: () => fetchKanji(character),
    retry: (failureCount, err) =>
      !(err instanceof KanjiApiError && err.status === 404) && failureCount < 3,
  });

  if (isPending) return <LoadingCharacters />;
  if (isError) {
    if (error instanceof KanjiApiError && error.status === 404)
      return <NotFound />;
    return <ErrorMessage onRetry={() => refetch()} />;
  }

  return <Character character={data} />;
};

export default KanjiDetail;
