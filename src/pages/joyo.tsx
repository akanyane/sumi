import Head from "next/head";
import { GetServerSideProps } from "next";
import { Header, Footer, Characters } from "../components";

const Joyo = ({ data }) => {
  return (
    <>
      <Head>
        <title>Joyo</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Characters characters={data} />
      <Footer />
    </>
  );
};

export default Joyo;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/joyo');
  const data = await res.json();
  return {
    props: {
      data,
    },
  };
};
