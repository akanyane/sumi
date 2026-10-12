"use client";

import { Box, Heading } from "@chakra-ui/react";
import NextLink from "next/link";

const Card = ({ character }: { character: string }) => (
  <Box asChild m={3}>
    <NextLink href={`/${character}`}>
      <Box
        w="full"
        maxW="270px"
        p={6}
        bg="bg.panel"
        shadow="lg"
        rounded="md"
        textAlign="center"
        transition="background 0.2s"
        _hover={{ bg: "bg.muted" }}
      >
        <Heading as="span" fontSize="7xl" fontWeight={400} lineHeight="1.1">
          {character}
        </Heading>
      </Box>
    </NextLink>
  </Box>
);

export default Card;
