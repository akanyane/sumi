import Head from "next/head";
import { GetServerSideProps } from "next";
import { Header, Footer, Characters } from "../components";

const Grade3 = ({ data }) => {

  return (
    <>
      <Head>
        <title>Grade 3</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Characters characters={data} />
      <Footer />
    </>
  )
}

export default Grade3;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/grade-3');
  const data = await res.json()
  return {
    props: {
      data,
    }
  }
};
