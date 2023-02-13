import Head from "next/head";
import { Header, Footer, Characters } from "../components";
import { GetServerSideProps } from "next";
import Pagination from "../components/pagination";

const Grade1 = ({ data }) => {


  return (
    <>
      <Head>
        <title>Grade 1</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Characters characters={data} />
      {/* <Pagination pageNumbers={pages.length} actualPageNumber={Number(router.query.page)} /> */}
      <Footer />
    </>
  )
}

export default Grade1;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/grade-1');
  const data = await res.json()
  return {
    props: {
      data,
    }
  }
};
