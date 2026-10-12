"use client";

import { Flex, Spinner } from "@chakra-ui/react";

const LoadingCharacters = () => (
  <Flex align="center" justify="center" py={10}>
    <Spinner borderWidth="4px" animationDuration="0.65s" size="xl" />
  </Flex>
);

export default LoadingCharacters;
