"use client";
import {
  Heading,
  Box,
  Center,
  Stack,
  useColorModeValue,
  useColorMode,
} from "@chakra-ui/react";
import NextLink from "next/link";

const Card = ({ character }) => {
  const { colorMode } = useColorMode();

  return (
    <NextLink href={`/${character}`} passHref>
        <Center py={3} margin={3} >
          <Box
            maxW={'270px'}
            w={'full'}
            bg={useColorModeValue('white', 'gray.800')}
            boxShadow={'2xl'}
            rounded={'md'}
            overflow={'hidden'}
            _hover={{
              cursor: "pointer",
              bg: colorMode === 'light' ? 'gray.100' : 'gray.900'
            }}
            >
            <Box p={6}>
              <Stack spacing={0} align={'center'} >
                <Heading fontSize={'7xl'} fontWeight={400} fontFamily={'body'}>
                {character}
                </Heading>
              </Stack>
            </Box>
          </Box>
        </Center>
    </NextLink>
  );
}

export default Card
