import Head from "next/head";
import Header from "../components/header";
import { Flex } from "@chakra-ui/react";
import Card from "../components/card";
import {GetServerSideProps} from "next";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import Footer from "../components/footer";

const Jinmeiyou = ({ data }) => {
  return (
    <>
      <Head>
        <title>Jinmeiyou</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <Flex align="center" justify="center" wrap="wrap">
        {data.map((kanji) => (<Card character={kanji} key={kanji} />))}
      </Flex>
      <Footer />
    </>
  )
}

export default Jinmeiyou;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/jinmeiyou');
  const data = await res.json()
  return {
    props: {
      data,
    }
  }
};
