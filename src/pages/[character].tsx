import { useRouter } from 'next/router'
import { GetServerSideProps, GetStaticProps } from "next";

import Header from "../components/header";
import CharacterDetails from "../components/character-details";
import Head from "next/head";
import Footer from '../components/footer';

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

  if (!foundCharacter) {
    return {
      props: { hasError: true },
    }
  }

  return {
    props: {
      foundCharacter,
    }
  }
}
