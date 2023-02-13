import React, { FC } from "react";
import { Flex } from '@chakra-ui/react';
import { Card } from "../index";

const Characters: FC<any> = ({ characters }) => {
  return (
    <Flex align="center" justify="center" wrap="wrap">
      {characters.map((character: string, index: number) => (<Card character={character} key={`${character}-${index}`} />))}
    </Flex>
  );
};

export default Characters;
