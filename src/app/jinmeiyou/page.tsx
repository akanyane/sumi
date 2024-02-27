
import {
  useQuery,
} from 'react-query'
import { Characters, LoadingCharacters } from "../../components"

export const metadata = {
  title: 'Jinmeiyou',
};

const Jinmeiyou = () => {
  const { isLoading, isError, data, error } = useQuery('kanji-jinmeiyou', () =>
    fetch('https://kanjiapi.dev/v1/kanji/jinmeiyou').then(res =>
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

export default Jinmeiyou;
