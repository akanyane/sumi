export default function Head({ params }: { params: { slug: string } }) {
  return (
    <>
      <title>Kanji</title>
      <meta name="description" content="Kanji Dictionary" />
      <meta charSet="utf-8" /> 
      <link rel="icon" href="/favicon.ico" />
    </>
  );
}
