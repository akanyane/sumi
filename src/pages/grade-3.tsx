import Head from "next/head";
import Header from "../components/header";
import { Flex } from "@chakra-ui/react";
import Card from "../components/card";
import {GetServerSideProps} from "next";
import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import Footer from "../components/footer";

const Grade3 = ({ data }) => {

  return (
    <>
      <Head>
        <title>Grade 3</title>
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
