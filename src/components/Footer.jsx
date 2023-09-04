import React from 'react'
import {Box, Grid, Typography,Stack,Link, Divider} from '@mui/material'
import {useTranslation} from "../hooks/useTranslation"
import Image from 'next/image'

const Footer = () => {
  const t = useTranslation();
  return <>
    <div className='flex flex-col md:flex-row md:space-x-6 pt-8 pb-4 md:px-10 lg:px-16 w-full ' >
      <Box sx={{maxWidth:"260px",width:"100%",p:2,mr:3,display:"flex",justifyContent:{xs:"flex-start",md:"center"}}} >
        <div className='mb-1 w-full'>
          <Stack direction="row" justifyContent="start" alignItems="center">
            <Box sx={{display:'block', mb:'-6px', mr: 1}}><Image src="/favicons/favicon_256x256.png" width={24} height={24} alt="headerIcon"/></Box>            
            <Typography variant="h6" noWrap component="div" sx={{fontFamily: "GT Haptik Regular" ,fontWeight: 'bold'}}>
              {t['Title']}
            </Typography>
          </Stack>
          <Typography variant="subtitle2" color="gray" className='whitespace-nowrap'>{t["Description"]}</Typography>
        </div>
      </Box>
      <Grid container width={1}>
        <Grid item xs={12} md={4} sx={{justifyContent:{xs:"flex-start"},display:"flex"}}>
          <Box sx={{p:2,pt:{xs:0,md:2}}} width={1}>
            <Typography variant="h5" fontWeight="bold">About</Typography>
            <Divider flexItem sx={{borderColor:"#5c93bb2b",mt:1, display:{md:"none"}}} light/>
            <Stack sx={{pt:2}}>
              <Link href="/about" underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} >{t["About"]}</Link>
              {/* <Link href="/changelog" underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} >{t["ChangeLog"]}</Link> */}
              {/* <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}}>{t["HowToUse"]}</Link> */}
              <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} href="https://github.com/g960059/hemodynamic-simulator-next/projects/1">{t["Roadmap"]}</Link>
            </Stack>
          </Box>
        </Grid>  
        <Grid item xs={12} md={4}  sx={{justifyContent:{xs:"flex-start"},display:"flex"}} >
          <Box sx={{p:2,pt:{xs:0,md:2}}} width={1}>
            <Typography variant="h5" fontWeight="bold">Legal</Typography>
            <Divider flexItem sx={{borderColor:"#5c93bb2b",mt:1, display:{md:"none"}}} light/>
            <Stack sx={{pt:2}}>
              <Link href="/terms" underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} >{t["Terms"]}</Link>
              <Link href="/privacy" underline="hover" color="inherit" sx={{cursor:"pointer",my:1}}>{t["PrivaryPolicy"]}</Link>
              <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} href="https://forms.gle/CDNpcKRTFKfn2Ejn7">{t["Contact"]}</Link>
            </Stack>
          </Box>
        </Grid>
        <Grid item xs={12} md={4}  sx={{justifyContent:{xs:"flex-start"},display:"flex"}} >
          <Box sx={{p:2,pt:{xs:0,md:2}}} width={1}>
            <Typography variant="h5" fontWeight="bold">Links</Typography>
            <Divider flexItem sx={{borderColor:"#5c93bb2b",mt:1, display:{md:"none"}}} light/>
            <Stack sx={{pt:2}}>
              <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} href="https://twitter.com/0xYusuke">Twitter</Link>
              <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} href="https://github.com/g960059/hemodynamic-simulator-next">GitHub</Link>
            </Stack>
          </Box>
        </Grid>    
      </Grid>         
    </div>        
  </>
}

export default Footer;