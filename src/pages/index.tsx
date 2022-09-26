import Head from 'next/head'
import { GetServerSideProps } from 'next';
import { useState, useEffect } from "react";
import styled from "styled-components";

import { GlobalStyle } from "../globalStyles";
import { Card } from "../components/card";
import { Pagination } from "../components/pagination";

const Container = styled.main`
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
`;

const Kanji = styled.section`
  height: 80vh;
  width: 100vw;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  overflow-y: auto;
`;

const App = ({ data }) => {
  const[kanji, setKanji] = useState([])
  const[pageNumber, setPageNumber] = useState(1)

  useEffect(()=> {
    setKanji((data.slice(pageNumber*300, pageNumber*300 + 300)).map(k => k))
  },[pageNumber])

  return (
    <>
      <Head>
        <title>Kanji</title>
        <meta name="description" content="Kanji Dictionary" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <GlobalStyle/>
      <Container>
        <Pagination previousPage={() => pageNumber < 2 ? null : setPageNumber(pageNumber - 1)}
                    nextPage={() => pageNumber < 43 ? setPageNumber(pageNumber + 1) : null}
                    display={data.length} pageNumber={pageNumber} 
                    />
          <Kanji >
            {kanji.map((kanji) => (<Card kanji={kanji} key={kanji} />))}
          </Kanji>
      </Container>
    </>
  );
}

export default App;

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch('https://kanjiapi.dev/v1/kanji/all');
  const data = await res.json()
  return {
    props: {
      data,
    }
  }
};
