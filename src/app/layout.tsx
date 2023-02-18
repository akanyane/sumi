"use client"

import { ReactNode } from "react";
import { Footer, Header, PageWrapper } from "../components";
import {
  QueryClient,
  QueryClientProvider,
} from 'react-query'
import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from '@chakra-ui/react'

const queryClient = new QueryClient()

export default function RootLayout({
  children, 
}: {
  children: ReactNode,
}) {
  return (
    <html lang="en">
      <head />
      <body>
      <QueryClientProvider client={queryClient}>
        <CacheProvider>
          <ChakraProvider>
            <PageWrapper>
            <Header />
            {children}
            <Footer />
            </PageWrapper>
          </ChakraProvider>
        </CacheProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
