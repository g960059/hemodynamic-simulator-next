import * as React from 'react';
import type {  ReactNode } from 'react'
import { Metadata } from 'next';
import './globals.css'
import ThemeRegistry from './ThemeRegistry';
import GoogleAnalytics from '../src/components/GoogleAnalytics'
import "../src/styles/globals.css"
import { initializeFirebaseApp } from '../src/utils/firebase';

initializeFirebaseApp();

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
  description: 'CircleHeart is a community space about hemodynamics.',
  
  openGraph: {
    url: 'https://www.circleheart.dev/',
    title: 'CircleHeart',
    description: 'CircleHeart is a community space about hemodynamics.',
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: 'https://www.circleheart.dev/favicons/favicon_256x256.png',
        width: 256,
        height: 256,
        alt: 'CircleHeart',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CircleHeart',
    description: 'CircleHeart is a community space about hemodynamics.',
    site: '@CircleHeart_dev',
    creator: '@0xYusuke',
  },  
};


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
