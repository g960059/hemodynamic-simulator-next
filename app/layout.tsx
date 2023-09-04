import * as React from 'react';
import type {  ReactNode } from 'react'
import { Metadata } from 'next';
import './globals.css'
import ThemeRegistry from './ThemeRegistry';
import GoogleAnalytics from '../src/components/GoogleAnalytics'
import "../src/styles/globals.css"



export default function MyApp({children} : {children: ReactNode}) {
  return (
    <html lang="ja">
      <body>
        <main>
          <GoogleAnalytics />
          <ThemeRegistry options={{ key: 'mui' }}>{children}</ThemeRegistry>
        </main>
      </body>
    </html>
  );
}

export const metadata : Metadata = {
  title: 'CircleHeart',
  description: 'CircleHeart is a blog about software development and other things.',
  openGraph: {
    url: 'https://www.circleheart.dev/',
    title: 'CircleHeart',
    description: 'CircleHeart is a blog about software development and other things.',
    images: [
      {
        url: 'https://www.circleheart.dev/favicons/favicon_256x256.png',
        width: 256,
        height: 256,
        alt: 'CircleHeart',
      },
    ],
  },
};

{/* <Head>
  <meta name="viewport" content="initial-scale=1, width=device-width" />
  <title>CircleHeart</title>
  <meta name="description" content={t["Description"]} key="description"/>
  <meta property="og:title" content="CircleHeart" key="og:title"/>
  <meta property="og:description" content={t["Description"]} key="og:description"/>
  <meta property="og:url" content="https://www.circleheart.dev/" key="og:url"/>
  <meta name="twitter:site" content="@CircleHeart_dev" />
  <meta name="twitter:creator" content="@CircleHeart_dev" key="twitter:creator"/>
  <meta name="twitter:title" content="CircleHeart" key="twitter:title"/>
  <meta name="twitter:description" content={t["Description"]} key="twitter:description"/>
</Head> */}


// export  function MyDocument({ emotionStyleTags }: MyDocumentProps) {
//     return (
//       <Html lang="en">
//         <Head>
//           {/* PWA primary color */}
//           <meta name="theme-color" content={theme.palette.primary.main} />
//           <link
//             rel="stylesheet"
//             href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
//           />
//           <link rel="apple-touch-icon" sizes="180x180" href="/favicons/favicon_256x256.png"/>
//           <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon_32x32.png"/>
//           <link rel="manifest" href="/favicons/site.webmanifest"/>
//           <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#5bbad5"/>
//           <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@500&display=swap" rel="stylesheet"/>
//           <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.css"></link>
//           <meta name="msapplication-TileColor" content="#da532c"/>
//           <meta name="google-site-verification" content="SzBIz_Loe5i-JB3a5HoVwH9yjOdFw0u19apoC54k_Nc" />
//           {emotionStyleTags}
//         </Head>
//         <body id='root'>
//           <Main />
//           <NextScript />
//         </body>
//       </Html>
//     );
// }

// interface MyDocumentProps extends DocumentProps {
//   emotionStyleTags: JSX.Element[];
// }

// MyDocument.getInitialProps = async (ctx: DocumentContext) => {

//   const cache = createEmotionCache();
//   const { extractCriticalToChunks } = createEmotionServer(cache);


//   const initialProps = await Document.getInitialProps(ctx);


//   const emotionStyles = extractCriticalToChunks(initialProps.html);
//   const emotionStyleTags = emotionStyles.styles.map((style) => (
//     <style
//       data-emotion={`${style.key} ${style.ids.join(' ')}`}
//       key={style.key}
//       // eslint-disable-next-line react/no-danger
//       dangerouslySetInnerHTML={{ __html: style.css }}
//     />
//   ));



//   return {
//     ...initialProps,
//     styles: [
//       ...emotionStyleTags,
//       <style
//         id="jss-server-side"
//         key="jss-server-side"
//       />,
//       ...React.Children.toArray(initialProps.styles),
//     ],
//   };
// };
