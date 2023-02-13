import Head from "next/head";
import { GetServerSideProps } from "next";
import { Header, Footer, Characters } from "../components";

const Grade2 = ({ data }) => {
  return (
    <>
      <Head>
        <title>Grade 2</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <Characters characters={data} />
      <Footer />
    </>
  )
}

export default Grade2;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/grade-2');
  const data = await res.json()
  return {
    props: {
      data,
    }
  }
};
