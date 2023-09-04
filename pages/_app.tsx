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
import { initializeFirebaseApp } from '../src/utils/firebase';
import Router from 'next/router';

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

initializeFirebaseApp();
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
  React.useEffect(() => {
    if (Object.keys(pageProps).length === 0) {
      Router.reload()
    }
  }, [pageProps]);

  return (
      <CacheProvider value={cache}>
        <Head>
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
