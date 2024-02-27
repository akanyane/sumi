import {
  useQuery,
} from 'react-query'
import { Characters, LoadingCharacters } from "../../components"

export const metadata = {
  title: 'Grade 2',
};

const Grade2 = () => {
  const { isLoading, isError, data, error } = useQuery('kanji', () =>
  fetch('https://kanjiapi.dev/v1/kanji/grade-2').then(res =>
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

export default Grade2;
