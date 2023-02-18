"use client"
import {
  useQuery,
} from 'react-query'
import { Characters, LoadingCharacters } from "../../components"

export const metadata = {
  title: 'Grade 4',
};

const Grade4 = () => {
  const { isLoading, isError, data, error } = useQuery("kanji-grade-4", () =>
  fetch("https://kanjiapi.dev/v1/kanji/grade-4").then(res =>
    res.json())
  )

  if(isLoading) {
    return <LoadingCharacters />
  }

  return <Characters characters={data} />
}

export default Grade4;
