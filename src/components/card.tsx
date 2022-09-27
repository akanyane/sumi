import {
  Heading,
  Avatar,
  Box,
  Center,
  Image,
  Flex,
  Text,
  Stack,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import getCharacterInformation from "../utils/getCharacterInformation";
import {useEffect, useState} from "react";
import NextLink from "next/link"

const Card = ({ character }) => {
  const [data, setData] = useState<any>()
  useEffect(() => {
    const fetchData = async () => {
      const response = await getCharacterInformation(character)
      setData(response);
    }

    fetchData()
      .catch(console.error);
  }, [])

  // const { kanji, grade, stroke_count, meanings } = data;

  return (data ?
    <NextLink href={`/${data.kanji}`} passHref>
      <Center py={3} margin={3}>
        <Box
          maxW={'270px'}
          w={'full'}
          bg={useColorModeValue('white', 'gray.800')}
          boxShadow={'2xl'}
          rounded={'md'}
          overflow={'hidden'}
          alignContent="center"
          justifyContent={"center"}
          alignItems="center"
          >
          
          <Box p={6}>
            <Stack spacing={0} align={'center'} mb={5}>
              <Heading fontSize={'7xl'} fontWeight={400} fontFamily={'body'}>
              {data.kanji}
              </Heading>
            </Stack>

          </Box>
        </Box>
      </Center>
    </NextLink>
     : null
  );
}

export default Card
