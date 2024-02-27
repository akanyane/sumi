
import {
  useQuery,
} from 'react-query'
import { Characters, LoadingCharacters } from "../../components"

export const metadata = {
  title: 'Grade 3',
};

const Grade3 = () => {
  const { isLoading, isError, data, error } = useQuery('kanji-grade-3', () =>
  fetch('https://kanjiapi.dev/v1/kanji/grade-3').then(res =>
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

export default Grade3;
