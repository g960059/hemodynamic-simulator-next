import React  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack,Link} from '@mui/material'
import {useTranslation} from "../src/hooks/useTranslation"
import Footer from "../src/components/Footer"
import ReactMarkdown from 'markdown-to-jsx';
import PrivacyMd from "../src/markdown/privacy.md"
import Layout from '../src/components/layout';
import Background from '../src/elements/Background';


const options = {
  overrides: {
    h1: {
      component: Typography,
      props: {
        gutterBottom: true,
        variant: 'h5',
      },
    },
    h2: { component: Typography, props: { gutterBottom: true, variant: 'h6',sx:{fontWeight:"bold"} } },
    h3: { component: Typography, props: { gutterBottom: true, variant: 'subtitle1' } },
    h4: {
      component: Typography,
      props: { gutterBottom: true, variant: 'caption', paragraph: true },
    },
    p: { component: Typography, props: { paragraph: true } },
    a: { component: Link },
    li: {
      component:  (props) => <li style={{marginBottom:"0.5rem"}} {...props} />,
    },
  },
};



const Terms = () => {
  const t = useTranslation();

  return <>
      <Grid container justifyContent="center"> 
        <Grid item xs={12} md={10} lg={8}  sx={{mt:4,p:5}} className='bg-white rounded-lg border-solid border border-slate-200 shadow'>
          <Typography variant="h4" fontWeight="bold" sx={{textAlign:"center"}}>{t["PrivaryPolicy"]}</Typography>
          <Divider variant="middle" sx={{my:3}}/>
          <ReactMarkdown children={PrivacyMd} options={options}/>
        </Grid>
        <Footer/>
      </Grid>
      <Background/>
  </>
}

Terms.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default Terms;