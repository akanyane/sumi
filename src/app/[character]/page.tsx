"use client";
import {
  useQuery,
} from 'react-query';
import { Character, LoadingCharacters as LoadingCharacter } from "../../components"


const Jouyou= ({ params }) => {
  const { character }= params;

  const { isLoading, isError, data, error } = useQuery(`kanji-${character}`, () =>
    fetch(`https://kanjiapi.dev/v1/kanji/${character}`).then(res =>
      res.json())
  )

  if(isLoading) {
    return <LoadingCharacter />
  }

  return <Character character={data} />
}

export default Jouyou;
