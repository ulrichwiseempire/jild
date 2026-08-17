import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>
      <body className="bg-slate-950">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

