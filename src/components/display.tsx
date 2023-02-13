import {
  Box,
  Container,
  Stack,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react';

const Display = ({ totalOfCharacters }) => {
  return (
    <Box
      bg={useColorModeValue('white', 'gray.800')}
      color={useColorModeValue('gray.700', 'gray.200')}
       boxShadow={'1xl'}
      >
      <Container
        as={Stack}
        maxW={'6xl'}
        py={4}
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        justify={{ base: 'center', md: 'center' }}
        align={{ base: 'center', md: 'center' }}
        >
          <Heading fontSize={'2xl'} fontWeight={400} fontFamily={'body'}>
          {totalOfCharacters}
          </Heading>
      </Container>
    </Box>
  );
}

export default Display;
