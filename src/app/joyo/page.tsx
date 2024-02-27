
import {
  useQuery,
} from 'react-query'
import { Characters, LoadingCharacters } from "../../components"

export const metadata = {
  title: 'Joyo',
};

const Joyo= () => {
  const { isLoading, isError, data, error } = useQuery('kanji-joyo', () =>
    fetch('https://kanjiapi.dev/v1/kanji/joyo').then(res =>
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

export default Joyo;
