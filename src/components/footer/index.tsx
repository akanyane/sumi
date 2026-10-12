"use client";

import { Box, Container, Image, Stack, Text } from "@chakra-ui/react";

const Footer = () => (
  <Box bg="bg.subtle" color="fg">
    <Container maxW="6xl" py={4}>
      <Stack
        direction={{ base: "column", md: "row" }}
        gap={4}
        justify={{ base: "center", md: "space-between" }}
        align="center"
      >
        <Image src="/logo.png" alt="Kanji Dictionary" h={6} />
        <Text>
          © {new Date().getFullYear()} Kanji Dictionary. All rights reserved
        </Text>
      </Stack>
    </Container>
  </Box>
);

export default Footer;
