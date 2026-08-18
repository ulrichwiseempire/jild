import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        {/* Chargement de Tailwind CSS via CDN pour appliquer tout le design */}
        <script src="https://cdn.tailwindcss.com"></script>
      </Head>
      <body className="bg-[#090d16] text-slate-100">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}

