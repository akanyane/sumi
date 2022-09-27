const getCharacterInformation: any = async (character: string) => {
  const res = await fetch(`https://kanjiapi.dev/v1/kanji/${character}`);
  const data = await res.json();
  return data;
};

export default getCharacterInformation;
