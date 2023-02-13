import { useRouter } from 'next/router';
import {
  Box,
  Container,
  Stack,
  useColorModeValue,
  Button,
  Flex,
} from '@chakra-ui/react';
import { ArrowRightIcon, ArrowLeftIcon } from '@chakra-ui/icons';

const Pagination = ({ pageNumbers, actualPageNumber }) => {
  const pages = []
  for(let i = 1; i <= pageNumbers; i++) {
    pages.push(i);
  }

  const isDisabled = (selectedPage: number): boolean => 
    selectedPage === actualPageNumber ? true : false;

  const firstPageNumber = 1;
  const lastPageNumber: number = pageNumbers;

  const router = useRouter();

  const nextPage = (): void => {
    router.push(`/?page=${actualPageNumber + 1}`);
  };

  const previousPage = (): void => {
    router.push(`/?page=${actualPageNumber - 1}`);
  };

  const selectedPage = (page: number): void => {
    router.push(`/?page=${page}`);
  };

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

      <Flex align="center" justify="center">
        <Button variant='outline' disabled={isDisabled(firstPageNumber)} onClick={previousPage}>
          <ArrowLeftIcon />
        </Button>

        {pages.slice(actualPageNumber - 1, actualPageNumber + 4)
          .map((page)=> (
            <Button 
              key={page} 
              variant='outline' 
              disabled={isDisabled(page)}
              onClick={() => selectedPage(page)}
            >
              {page}
            </Button>
          ))}

        <Button variant='outline' disabled={isDisabled(lastPageNumber)} onClick={nextPage}>
          <ArrowRightIcon />
        </Button>
      </Flex>    
        
      </Container>
    </Box>
  )
}

export default Pagination;
