import * as React from 'react';
import { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import {CssBaseline} from '@mui/material';
import {pink,teal} from '@mui/material/colors'
import createCache from '@emotion/cache';
import Layout from '../src/components/layout'
import GoogleAnalytics from '../src/components/GoogleAnalytics'
import {useTranslation} from '../src/hooks/useTranslation'
import { DefaultSeo } from 'next-seo';

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
      <DefaultSeo
        defaultTitle="CircleHeart"
        title="CircleHeart"
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
          <Layout>
            <Component {...pageProps} />
          </Layout>
      </ThemeProvider>
    </CacheProvider>
  );
}
