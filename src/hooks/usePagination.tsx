import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
const usePagination = (characters: string[], charactersPerPage: number) => {
  const[page, setPage] = useState([])
  const[pageNumber, setPageNumber] = useState(1)

  const pages: [][] = characters.reduce((pageArray: any[], character: string, index: number) => {
    const perPage = 50;
    const pageIndex: number = Math.floor(index/perPage);

    if(!pageArray[pageIndex]) {
      pageArray[pageIndex] = [];
    }

    pageArray[pageIndex].push(character);

    return pageArray;
  }, []);

  const router = useRouter();

  useEffect(() => {
    if(!router.query.page || Number(router.query.page) > pages.length){
      router.push('/?page=1', undefined, { shallow: true })
    }
  }, []);

  useEffect(() => {
    setPageNumber(Number(router.query.page) <= pages.length ? Number(router.query.page) : 1)
  }, [router.query.page]);


  return {

  }
}
