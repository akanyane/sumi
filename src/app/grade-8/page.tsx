
import {
  useQuery,
} from 'react-query'
import { Characters, LoadingCharacters } from "../../components"

export const metadata = {
  title: 'Grade 8',
};

const Grade8 = () => {
  const { isLoading, isError, data, error } = useQuery('kanji-grade-8', () =>
    fetch('https://kanjiapi.dev/v1/kanji/grade-8').then(res =>
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

export default Grade8;
