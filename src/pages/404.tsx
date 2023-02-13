import Head from "next/head";
import NotFound from "../components/not-found";
import { Header, Footer } from "../components";


const Grade1 = () => {

  return (
    <>
      <Head>
        <title>Page Not Found</title>
        <meta name="description" content="Page Not Found" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <NotFound />
      <Footer />
    </>
  )
}

export default Grade1;


