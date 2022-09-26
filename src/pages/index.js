import { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";

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

const App = () => {
  const[kanji, setKanji] = useState([])
  const[pageNumber, setPageNumber] = useState(1)
  const[amount, setAmount] = useState(0)

  useEffect(()=> {
    axios.get('https://kanjiapi.dev/v1/kanji/all').then((res) => {
      setAmount(res.data.length)
      setKanji((res.data.slice(pageNumber*300, pageNumber*300 + 300)).map(k => k))
    })
  },[pageNumber])

  return (
    <>
      <GlobalStyle/>
      <Container>
        <Pagination previousPage={() => pageNumber < 2 ? null : setPageNumber(pageNumber - 1)}
                    nextPage={() => pageNumber < 43 ? setPageNumber(pageNumber + 1) : null}
                    display={amount} pageNumber={pageNumber} 
                    />
          <Kanji >
            {kanji.map((kanji) => (<Card kanji={kanji} key={kanji} />))}
          </Kanji>
      </Container>
    </>
  );
}

export default App;
