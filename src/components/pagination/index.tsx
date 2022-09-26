import { Button, Container, PageNumber } from "./styles";

export const Pagination = (props) => {

  return (
    <Container>
      <h1>{props.display}</h1>
      <Button onClick={props.previousPage}>⥢</Button>

      <PageNumber>{props.pageNumber}</PageNumber>

      <Button onClick={props.nextPage}>⥤</Button>

    </Container>
  )
}
