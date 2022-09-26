import { Button, Container, PageNumber } from "./styles";

export const Pagination = (props) => {

  return (
    <Container>

      <Button onClick={props.previousPage}>⥢</Button>

      <PageNumber>{props.pageNumber}</PageNumber>

      <Button onClick={props.nextPage}>⥤</Button>

    </Container>
  )
}
