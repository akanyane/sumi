"use client"
import {
  useQuery,
} from 'react-query'
import { Characters, LoadingCharacters } from "../../components"

export const metadata = {
  title: 'Grade 5',
};

const Grade5 = () => {
  const { isLoading, isError, data, error } = useQuery('kanji', () =>
    fetch('https://kanjiapi.dev/v1/kanji/grade-5').then(res =>
      res.json())
  )

  if(isLoading) {
    return <LoadingCharacters />
  }

  return (
    <>
      <Characters characters={data} />
    </>
  )
}

export default Grade5;
