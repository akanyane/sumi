"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchKanjiList, type KanjiList as List } from "@/lib/kanji-api";
import Characters from "../characters";
import ErrorMessage from "../error-message";
import LoadingCharacters from "../loading-characters";

type KanjiListProps = {
  list: List;
  limit?: number;
};

const KanjiList = ({ list, limit }: KanjiListProps) => {
  const { isPending, isError, data, refetch } = useQuery({
    queryKey: ["kanji-list", list],
    queryFn: () => fetchKanjiList(list),
  });

  if (isPending) return <LoadingCharacters />;
  if (isError) return <ErrorMessage onRetry={() => refetch()} />;

  return <Characters characters={limit ? data.slice(0, limit) : data} />;
};

export default KanjiList;
