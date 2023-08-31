import * as React from 'react';
import type { ReactElement, ReactNode } from 'react'
import Head from 'next/head';
import { AppProps } from 'next/app';
import { ThemeProvider, createTheme ,responsiveFontSizes} from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import {CssBaseline} from '@mui/material';
import GoogleAnalytics from '../src/components/GoogleAnalytics'
import {useTranslation} from '../src/hooks/useTranslation'
// import { DefaultSeo } from 'next-seo';
import "../src/styles/globals.css"
import { NextPage } from 'next';
import createEmotionCache from '../src/utils/createEmotionCache'

let theme = createTheme({
  palette: {
    primary: {
      main: "#3ea8ff"
    },
    secondary:{
      main: "#64748b"
    },
  },
});
theme = responsiveFontSizes(theme);

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

const cache = createEmotionCache();

export default function MyApp({Component, pageProps }: AppPropsWithLayout) {
  const t = useTranslation();
  const getLayout = Component.getLayout ?? ((page) => page)

  React.useEffect(() => {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement!.removeChild(jssStyles);
    }
  }, []);

  return (
      <CacheProvider value={cache}>
        <Head>
          <meta name="viewport" content="initial-scale=1, width=device-width" />
          <title>CircleHeart</title>
          <meta name="description" content={t["Description"]} />
          <meta property="og:title" content="CircleHeart" />
          <meta property="og:description" content={t["Description"]} />
          <meta property="og:image" content="https://www.circleheart.dev/ogp.png" />
          <meta property="og:url" content="https://www.circleheart.dev/" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@CircleHeart_" />
          <meta name="twitter:creator" content="@CircleHeart_" />
          <meta name="twitter:title" content="CircleHeart" />
          <meta name="twitter:description" content={t["Description"]} />
          <meta name="twitter:image" content="https://www.circleheart.dev/ogp.png" />
        </Head>

        <GoogleAnalytics />
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {getLayout(<Component {...pageProps} />)}
        </ThemeProvider>
      </CacheProvider>
  );
}
