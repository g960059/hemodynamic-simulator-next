import * as React from 'react';
import Head from 'next/head';
import { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import {CssBaseline} from '@mui/material';
import {pink,teal} from '@mui/material/colors'
import createCache from '@emotion/cache';
import Layout from '../src/components/layout'
import {useTranslation} from '../src/hooks/useTranslation'

const theme = createTheme({
  palette: {
    primary: {
      main: pink[400]
    },
    secondary:{
      main: teal[500]
    },
  },
});

export const cache = createCache({ key: 'css', prepend: true });

export default function MyApp(props: AppProps) {
  const { Component, pageProps } = props;
  const t = useTranslation();

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
        <title>{t['Title']}</title>
        <meta property="og:title" content={t['Title']} key="title" />
        <meta name="description" content={t["Description"]} />
        <meta property="og:description" content={t["Description"]} />        
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
          <Layout>
            <Component {...pageProps} />
          </Layout>
      </ThemeProvider>
    </CacheProvider>
  );
}
