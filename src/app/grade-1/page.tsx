
import {
  useQuery,
} from "react-query";
import { 
  Characters, 
  LoadingCharacters, 
} from "../../components";

export const metadata = {
  title: "Grade 1",
};

export default function Grade1 () {
  const { isLoading, isError, data, error } = useQuery('kanji', () =>
  fetch('https://kanjiapi.dev/v1/kanji/grade-1').then(response =>
    response.json())
  );

  if(isLoading) return <LoadingCharacters />;

  return <Characters characters={data} />;
}
