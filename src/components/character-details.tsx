import {
  Box,
  Container,
  Stack,
  Text,
  Heading,
  SimpleGrid,
  StackDivider,
  useColorModeValue,
  List,
  ListItem, Center,
} from '@chakra-ui/react';

const CharacterDetails = ({ character }) => {
  console.log(character)
  return (
    <Container maxW={'7xl'}>
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: 8, md: 10 }}
        py={{ base: 18, md: 24 }}>

          <Center >
            <Box
              w={'full'}
              h={'full'}
              bg={useColorModeValue('white', 'gray.800')}
              boxShadow={'2xl'}
              rounded={'md'}
              overflow={'hidden'}>
              <Box p={6}>
                <Stack spacing={0} align={'center'} mb="auto" mt="auto">
                  <Heading fontSize={'15rem'} fontWeight={400} fontFamily={'body'}>
                    {character.kanji}
                  </Heading>
                </Stack>
              </Box>
            </Box>
          </Center>

        <Stack spacing={{ base: 6, md: 10 }}>

          <Stack
            spacing={{ base: 4, sm: 6 }}
            direction={'column'}
            divider={
              <StackDivider
                borderColor={useColorModeValue('gray.200', 'gray.600')}
              />
            }
            bg={useColorModeValue('white', 'gray.800')}
            boxShadow={'2xl'}
            rounded={'md'}
            >

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} py={5}>
              <Stack align="center">
                <Text
                  fontSize={{ base: '16px', lg: '18px' }}
                  fontWeight={'500'}
                  textTransform={'uppercase'}
                  mb={'4'}>
                  Meanings
                </Text>
                <List spacing={2}>
                  {character.meanings.map((meaning, index) => (<ListItem key={meaning + index}>{meaning}</ListItem>))}
                </List>
              </Stack>

              <Stack align="center">
                <Text
                  fontSize={{ base: '16px', lg: '18px' }}
                  fontWeight={'500'}
                  textTransform={'uppercase'}
                  mb={'4'}>
                  Main Details
                </Text>

                <List spacing={2}>
                  <ListItem>
                    <Text as={'span'} fontWeight={'bold'}>
                      Grade:
                    </Text>{' '}
                    {character.grade}
                  </ListItem>
                  <ListItem>
                    <Text as={'span'} fontWeight={'bold'}>
                      Stroke count:
                    </Text>{' '}
                    {character.stroke_count}
                  </ListItem>
                  <ListItem>
                    <Text as={'span'} fontWeight={'bold'}>
                      JLPT:
                    </Text>{' '}
                    {character.jlpt}
                  </ListItem>
                  <ListItem>
                    <Text as={'span'} fontWeight={'bold'}>
                      Unicode:
                    </Text>{' '}
                    {character.unicode}
                  </ListItem>
                </List>
              </Stack>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} py={5}>
              <Stack align='center' >
                  <Text
                    fontSize={{ base: '16px', lg: '18px' }}
                    fontWeight={'500'}
                    textTransform={'uppercase'}
                    mb={'4'}>
                    Kun Readings
                  </Text>
                  <List spacing={2}>
                    {character.kun_readings.map((meaning, index) => (<ListItem key={meaning + index}>{meaning}</ListItem>))}
                  </List>
              </Stack>
              <Stack align="center">
                <Text
                  fontSize={{ base: '16px', lg: '18px' }}
                  fontWeight={'500'}
                  textTransform={'uppercase'}
                  mb={'4'}>
                  On Readings
                </Text>
                <List spacing={2}>
                  {character.on_readings.map((meaning, index) => (<ListItem key={meaning + index}>{meaning}</ListItem>))}
                </List>
              </Stack>
            </SimpleGrid>

          </Stack>

        </Stack>
      </SimpleGrid>
    </Container>
  )
}

export default CharacterDetails;
