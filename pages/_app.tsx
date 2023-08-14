import * as React from 'react';
import type { ReactElement, ReactNode } from 'react'
import Head from 'next/head';
import { AppProps } from 'next/app';
import { ThemeProvider, createTheme ,responsiveFontSizes} from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import {CssBaseline} from '@mui/material';
import GoogleAnalytics from '../src/components/GoogleAnalytics'
import {useTranslation} from '../src/hooks/useTranslation'
import { DefaultSeo } from 'next-seo';
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
        </Head>
        <DefaultSeo
          defaultTitle="CircleHeart"
          title={"CircleHeart"+" | "+t["Description"]}
          titleTemplate="CircleHeart"
          canonical="https://www.circleheart.dev/"
          description={t["Description"]}
          openGraph={{
            type: 'website',
            title: "CircleHeart", 
            site_name: "CircleHeart",
            url: 'https://www.circleheart.dev/',
          }}
        />
        <GoogleAnalytics />
        <ThemeProvider theme={theme}>
          {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
          <CssBaseline />
          {getLayout(<Component {...pageProps} />)}
        </ThemeProvider>
      </CacheProvider>
  );
}
