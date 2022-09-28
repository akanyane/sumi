import Head from "next/head";
import Header from "../components/header";
import { Flex } from "@chakra-ui/react";
import Card from "../components/card";
import { GetServerSideProps } from "next";

const Jouyou = ({ data }) => {
  return (
    <>
      <Head>
        <title>Jouyou</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Flex align="center" justify="center" wrap="wrap">
        {data.map((kanji) => (<Card character={kanji} key={kanji} />))}
      </Flex>
    </>
  )
}

export default Jouyou;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/jouyou');
  const data = await res.json()
  return {
    props: {
      data,
    }
  }
};
