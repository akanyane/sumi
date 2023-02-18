import React, { FC } from "react";
import { Skeleton, Flex, Spinner } from "@chakra-ui/react";

const LoadingCharacters: FC = () => {
  return (
    <Flex align="center" justify="center">
      <Spinner
        thickness='4px'
        speed='0.65s'
        emptyColor='gray.200'
        // color='black.300'
        size='xl'
      />
    </Flex>
  )
}

export default LoadingCharacters;
