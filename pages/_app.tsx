import * as React from 'react';
import type { ReactElement, ReactNode } from 'react'
import { AppProps } from 'next/app';
import { ThemeProvider, createTheme ,responsiveFontSizes, StyledEngineProvider} from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import {CssBaseline} from '@mui/material';
import {pink, blue, blueGrey} from '@mui/material/colors'
import createCache from '@emotion/cache';
import GoogleAnalytics from '../src/components/GoogleAnalytics'
import {useTranslation} from '../src/hooks/useTranslation'
import { DefaultSeo } from 'next-seo';
import "../src/styles/globals.css"
import { NextPage } from 'next';

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
export const cache = createCache({ key: 'css', prepend: true });

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
    <StyledEngineProvider injectFirst>
      <CacheProvider value={cache}>
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
    </StyledEngineProvider>
  );
}
