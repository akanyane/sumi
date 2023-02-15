import {
  Box,
  Container,
  Stack,
  Text,
  useColorModeValue,
  Img,
} from '@chakra-ui/react';

const Footer = () => {
  return (
    <Box
      bg={useColorModeValue('gray.50', 'gray.900')}
      color={useColorModeValue('gray.700', 'gray.200')}>
      <Container
        as={Stack}
        maxW={'6xl'}
        py={4}
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        justify={{ base: 'center', md: 'space-between' }}
        align={{ base: 'center', md: 'center' }}>
        <Img src='/logo.png' h={6} cursor="pointer"/>
        <Text>© 2023 Kanji Dictionary. All rights reserved</Text>
      </Container>
    </Box>
  );
};

export default Footer;
