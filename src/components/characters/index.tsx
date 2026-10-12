"use client";

import { Flex } from "@chakra-ui/react";
import Card from "../card";

const Characters = ({ characters }: { characters: string[] }) => (
  <Flex align="center" justify="center" wrap="wrap" py={3}>
    {characters.map((character) => (
      <Card character={character} key={character} />
    ))}
  </Flex>
);

export default Characters;
