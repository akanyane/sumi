import {
  Box,
  Container,
  Stack,
  Heading,
  useColorModeValue,
  StackDivider,
} from '@chakra-ui/react';

const Display = ({ totalOfCharacters }) => {
  return (
    <Box
      bg={useColorModeValue('white', 'gray.800')}
      color={useColorModeValue('gray.700', 'gray.200')}
      boxShadow={'2xl'}
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
          <Heading fontSize={'5xl'} fontWeight={400} fontFamily={'body'}>
          {totalOfCharacters}
          </Heading>
      </Container>
      <StackDivider borderColor={useColorModeValue('gray.200', 'gray.600')}/>
    </Box>
  );
}

export default Display;
