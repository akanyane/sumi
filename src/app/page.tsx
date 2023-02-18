"use client";
import {
  useQuery,
} from 'react-query';
import { Skeleton, Stack, Flex } from '@chakra-ui/react';
import {Characters, LoadingCharacters} from "../components";


export default function Home() {
    const { isLoading, isError, data, error } = useQuery('kanji', () =>
      fetch('https://kanjiapi.dev/v1/kanji/all').then(res =>
        res.json())
    )

    if(isLoading) {
      return <LoadingCharacters />
    }
  return (
    <Characters characters={data.slice(0, 100)} />
  );
}
