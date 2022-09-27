import Head from 'next/head'
import { GetServerSideProps } from 'next';
import { useState, useEffect } from "react";
import { useRouter } from 'next/router'
import { Box, Flex} from "@chakra-ui/react";

import Card from "../components/card";
import Header from "../components/header";
import Display from '../components/display';

const Home = ({ data }) => {
  const[kanji, setKanji] = useState([])
  const[pageNumber, setPageNumber] = useState(1)

  useEffect(()=> {
    setKanji((data.slice(pageNumber*300, pageNumber*300 + 300)).map(k => k))
  },[pageNumber])

  const router = useRouter()

  useEffect(() => {
    // Always do navigations after the first render
    router.push('/?page=1', undefined, { shallow: true })
  }, [])
  console.log(typeof Number(router.query.page))
  useEffect(() => {
    // The counter changed!
    setKanji((data.slice(Number(router.query.page)*300, Number(router.query.page)*300 + 300)).map(k => k))
  }, [router.query.page])

  return (
    <>
      <Head>
        <title>Kanji</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
        {/*<Pagination previousPage={() => pageNumber < 2 ? null : setPageNumber(pageNumber - 1)}*/}
        {/*            nextPage={() => pageNumber < 43 ? setPageNumber(pageNumber + 1) : null}*/}
        {/*            display={data.length} pageNumber={pageNumber} */}
        {/*            />*/}
      <Header />
      <Display totalOfCharacters={data.length} />
      <Flex align="center" justify="center" wrap="wrap">
        {kanji.map((character: string, index: number) => (<Card character={character} key={character + index} />))}
      </Flex>

    </>
  );
}

export default Home;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/all');
  const data = await res.json()
  return {
    props: {
      data,
    }
  }
};
