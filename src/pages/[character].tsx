import { GetServerSideProps } from "next";
import Head from "next/head";
// import { Index, Footer, CharacterDetails } from "@components"
import { Header, Footer, CharacterDetails } from "../components"
const Character = ({ foundCharacter }) => {
  console.log(foundCharacter)
  return (
    <>
      <Head>
        <title>{foundCharacter.kanji}</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <CharacterDetails character={foundCharacter} />
      <Footer />
    </>
  )
}

export default Character;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { params, req, res } = context;
  const { character } = params;
  const response = await fetch(`https://kanjiapi.dev/v1/kanji/${character}`);
  const foundCharacter = await response.json()

  if (foundCharacter?.error) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      foundCharacter,
    }
  }
}
