import * as React from 'react';
import createEmotionCache from '../src/utils/createEmotionCache';
import createEmotionServer from '@emotion/server/create-instance';
import theme from '../src/styles/theme';
import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentProps,
  DocumentContext,
} from 'next/document';



export default function MyDocument({ emotionStyleTags }: MyDocumentProps) {
    return (
      <Html lang="en">
        <Head>
          {/* PWA primary color */}
          <meta name="theme-color" content={theme.palette.primary.main} />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
          />
          <link rel="apple-touch-icon" sizes="180x180" href="/favicons/favicon_256x256.png"/>
          <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon_32x32.png"/>
          <link rel="manifest" href="/favicons/site.webmanifest"/>
          <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#5bbad5"/>
          <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@500&display=swap" rel="stylesheet"/>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.css"></link>
          <meta name="msapplication-TileColor" content="#da532c"/>
          <meta name="google-site-verification" content="SzBIz_Loe5i-JB3a5HoVwH9yjOdFw0u19apoC54k_Nc" />
          {emotionStyleTags}
        </Head>
        <body id='root'>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
}
interface MyDocumentProps extends DocumentProps {
  emotionStyleTags: JSX.Element[];
}

let prefixer: any;
let cleanCSS: any;
if (process.env.NODE_ENV === 'production') {
  /* eslint-disable global-require */
  const postcss = require('postcss');
  const autoprefixer = require('autoprefixer');
  const CleanCSS = require('clean-css');
  /* eslint-enable global-require */

  prefixer = postcss([autoprefixer]);
  cleanCSS = new CleanCSS();
}


// `getInitialProps` belongs to `_document` (instead of `_app`),
// it's compatible with static-site generation (SSG).
MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  // Resolution order
  //
  // On the server:
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. document.getInitialProps
  // 4. app.render
  // 5. page.render
  // 6. document.render
  //
  // On the server with error:
  // 1. document.getInitialProps
  // 2. app.render
  // 3. page.render
  // 4. document.render
  //
  // On the client
  // 1. app.getInitialProps
  // 2. page.getInitialProps
  // 3. app.render
  // 4. page.render



  // You can consider sharing the same emotion cache between all the SSR requests to speed up performance.
  // However, be aware that it can have global side effects.
  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);


  const initialProps = await Document.getInitialProps(ctx);

  // Generate style tags for the styles coming from Emotion
  // This is important. It prevents Emotion from rendering invalid HTML.
  // See https://github.com/mui/material-ui/issues/26561#issuecomment-855286153
  const emotionStyles = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionStyles.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));



  return {
    ...initialProps,
    styles: [
      ...emotionStyleTags,
      <style
        id="jss-server-side"
        key="jss-server-side"
      />,
      ...React.Children.toArray(initialProps.styles),
    ],
  };
};
