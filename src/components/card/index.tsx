import {Container, Kanji} from "./styles";

export const Card = (props) => {

  return (
    <Container >
      <Kanji>
        {props.kanji}
      </Kanji>
    </Container>
  )
}


