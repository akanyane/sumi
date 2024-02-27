
import {
  useQuery,
} from 'react-query'
import { Characters, LoadingCharacters } from "../../components"

export const metadata = {
  title: 'Jinmeiyo',
};

const Jinmeiyo = () => {
  const { isLoading, isError, data, error } = useQuery('kanji-jinmeiyo', () =>
    fetch('https://kanjiapi.dev/v1/kanji/jinmeiyo').then(res =>
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

export default Jinmeiyo;
