"use client";

import { Box, Button, Heading, Text } from "@chakra-ui/react";
import NextLink from "next/link";

const NotFound = () => (
  <Box textAlign="center" py={10} px={6}>
    <Heading
      display="inline-block"
      as="h2"
      size="4xl"
      bgGradient="to-r"
      gradientFrom="teal.400"
      gradientTo="teal.600"
      bgClip="text"
    >
      404
    </Heading>
    <Text fontSize="18px" mt={3} mb={2}>
      Page Not Found
    </Text>
    <Text color="fg.muted" mb={6}>
      The page you&apos;re looking for does not seem to exist
    </Text>
    <Button variant="outline" asChild>
      <NextLink href="/">Go to Home</NextLink>
    </Button>
  </Box>
);

export default NotFound;
