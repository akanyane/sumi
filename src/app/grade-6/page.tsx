
import {
  useQuery,
} from 'react-query'
import { Characters, LoadingCharacters } from "../../components"

export const metadata = {
  title: 'Grade 6',
};

const Grade6 = () => {
  const { isLoading, isError, data, error } = useQuery('kanji-grade-6', () =>
    fetch('https://kanjiapi.dev/v1/kanji/grade-6').then(res =>
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

export default Grade6;
