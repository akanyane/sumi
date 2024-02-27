
import {
  useQuery,
} from 'react-query'
import { Characters, LoadingCharacters } from "../../components"

export const metadata = {
  title: 'Jouyou',
};

const Jouyou= () => {
  const { isLoading, isError, data, error } = useQuery('kanji-jouyou', () =>
    fetch('https://kanjiapi.dev/v1/kanji/jouyou').then(res =>
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

export default Jouyou;
