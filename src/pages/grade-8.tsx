import Head from "next/head";
import { GetServerSideProps } from "next";
import { Header, Footer, Characters } from "../components";

const Grade8 = ({ data }) => {
  return (
    <>
      <Head>
        <title>Grade 8</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <Characters characters={data} />
      <Footer />
    </>
  );
};

export default Grade8;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/grade-8');
  const data = await res.json();
  return {
    props: {
      data,
    },
  };
};
