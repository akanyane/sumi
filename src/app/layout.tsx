"use client"

import { ReactNode } from "react";
import { Footer, Header, PageWrapper } from "../components";
import {
  QueryClient,
  QueryClientProvider,
} from 'react-query'
import { Providers } from "./providers";

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
        <Providers>
            <PageWrapper>
            <Header />
            {children}
            <Footer />
            </PageWrapper>
            </Providers>
        </QueryClientProvider>
      </body>
    </html>
  )
}
