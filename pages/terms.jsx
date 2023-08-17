import React  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack,Link} from '@mui/material'
import {useTranslation} from "../../hooks/useTranslation"
import Footer from "../../components/Footer"
import ReactMarkdown from 'markdown-to-jsx';
import TermsMd from "../src/markdown/terms.md"
import Layout from '../../components/layout';
import Background from '../../elements/Background';


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

// const useStyles = makeStyles((theme) =>({
//   featuredBox: {
//     transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
//     boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
//     backgroundColor: "white",
//     border: "1px solid rgba(92, 147, 187, 0.17)",
//     borderRadius: "12px",
//   }
// }));

const Terms = () => {
  const t = useTranslation();


  return <>
      <Grid container justifyContent="center" > 
        <Grid item xs={12} md={10} lg={8}   sx={{mt:4,p:5}} className='bg-white rounded-lg border-solid border border-slate-200 shadow'>
          <Typography variant="h4" fontWeight="bold" sx={{textAlign:"center"}}>{t["Terms"]}</Typography>
          <Divider variant="middle" sx={{my:3}}/>
          <ReactMarkdown children={TermsMd} options={options}/>
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