import Head from "next/head";
import { GetServerSideProps } from "next";
import { Header, Footer, Characters } from "../components";

const Jinmeiyou = ({ data }) => {
  return (
    <>
      <Head>
        <title>Jinmeiyou</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Characters characters={data} />
      <Footer />
    </>
  );
};

export default Jinmeiyou;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/jinmeiyou');
  const data = await res.json();
  return {
    props: {
      data,
    },
  };
};
