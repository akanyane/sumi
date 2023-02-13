import Head from 'next/head'
import { GetServerSideProps } from 'next';
import { useState, useEffect } from "react";
import { useRouter } from 'next/router'
import { Flex} from "@chakra-ui/react";

import Card from "../components/card";
import Display from '../components/display';
import Pagination from '../components/pagination';
import { Header, Footer, Characters } from "../components";

const Home = ({ data }) => {
  const[page, setPage] = useState([])
  const[pageNumber, setPageNumber] = useState(1)
  
  const pages: [][] = data.reduce((pageArray: any[], character: string, index: number) => {
    const perPage = 50; 
    const pageIndex: number = Math.floor(index/perPage);
  
    if(!pageArray[pageIndex]) {
      pageArray[pageIndex] = [];
    }
  
    pageArray[pageIndex].push(character);
  
    return pageArray;
  }, []);

  const router = useRouter();

  useEffect(() => {
    if(!router.query.page || Number(router.query.page) > pages.length){
      router.push('/?page=1', undefined, { shallow: true })
    }
  }, []);

  useEffect(() => {
    setPageNumber(Number(router.query.page) <= pages.length ? Number(router.query.page) : 1)
  }, [router.query.page]);

  return (
    <>
      <Head>
        <title>Kanji</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Header />
      <Display totalOfCharacters={data.length} />
      <Flex align="center" justify="center" wrap="wrap">
        {pages[pageNumber].map((character: string, index: number) => (<Card character={character} key={character + index} />))}
      </Flex>
      <Pagination pageNumbers={pages.length} actualPageNumber={Number(router.query.page)} />
      <Footer />
    </>
  );
};

export default Home;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/all');
  const data = await res.json();
  return {
    props: {
      data,
    },
  };
};
