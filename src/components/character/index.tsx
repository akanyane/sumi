"use client";

import {
  Box,
  Container,
  Heading,
  List,
  SimpleGrid,
  Stack,
  StackSeparator,
  Text,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { Kanji } from "@/lib/kanji-api";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Stack align="center">
    <Text
      fontSize={{ base: "16px", lg: "18px" }}
      fontWeight="500"
      textTransform="uppercase"
      mb={4}
    >
      {title}
    </Text>
    {children}
  </Stack>
);

const Items = ({ items }: { items: string[] }) => (
  <List.Root gap={2} variant="plain" alignItems="center">
    {items.map((item) => (
      <List.Item key={item}>{item}</List.Item>
    ))}
  </List.Root>
);

const Detail = ({ label, value }: { label: string; value: ReactNode }) => (
  <List.Item>
    <Text as="span" fontWeight="bold">
      {label}:
    </Text>{" "}
    {value ?? "—"}
  </List.Item>
);

const Character = ({ character }: { character: Kanji }) => (
  <Container maxW="7xl">
    <SimpleGrid
      columns={{ base: 1, lg: 2 }}
      gap={{ base: 8, md: 10 }}
      py={{ base: 18, md: 24 }}
    >
      <Box
        w="full"
        h="full"
        bg="bg.panel"
        shadow="2xl"
        rounded="md"
        display="flex"
        justifyContent="center"
        alignItems="center"
        overflow="hidden"
        p={6}
      >
        <Heading as="h1" fontSize="15rem" fontWeight={400} lineHeight="1">
          {character.kanji}
        </Heading>
      </Box>

      <Stack
        gap={{ base: 4, sm: 6 }}
        separator={<StackSeparator />}
        bg="bg.panel"
        shadow="2xl"
        rounded="md"
      >
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={10} py={5}>
          <Section title="Meanings">
            <Items items={character.meanings} />
          </Section>
          <Section title="Main Details">
            <List.Root gap={2} variant="plain">
              <Detail label="Grade" value={character.grade} />
              <Detail label="Stroke count" value={character.stroke_count} />
              <Detail label="JLPT" value={character.jlpt} />
              <Detail label="Unicode" value={character.unicode} />
            </List.Root>
          </Section>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={10} py={5}>
          <Section title="Kun Readings">
            <Items items={character.kun_readings} />
          </Section>
          <Section title="On Readings">
            <Items items={character.on_readings} />
          </Section>
        </SimpleGrid>
      </Stack>
    </SimpleGrid>
  </Container>
);

export default Character;
