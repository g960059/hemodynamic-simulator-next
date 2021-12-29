import React from 'react'
import {Box, Grid, Typography,Stack,Link} from '@mui/material'
import {useTranslation} from "../hooks/useTranslation"
import { useRouter } from 'next/router'
import Image from 'next/image'

const Footer = () => {
  const t = useTranslation();
  const router = useRouter()
  return <>
    <Grid container spacing={3} px={{xs:3,md:5,lg:8}} my={1}>
      <Grid item xs={12} md={3} sx={{justifyContent:{xs:"flex-start",md:"center"},display:"flex"}}>
        <Box sx={{p:2}} >
          <Stack direction="row" sx={{mb:1}}>
            <Box sx={{display:'block', mb:'-6px'}}><Image src="/HeaderIcon.png" width={30} height={30}/></Box>
            <Typography variant="h5" noWrap component="div" sx={{fontFamily: "GT Haptik Regular" ,flexGrow: 1,fontWeight: 'bold'}}>
              {t['Title']}
            </Typography>
          </Stack>
          <Typography variant="subtitle1" color="gray">{t["Description"]}</Typography>
        </Box>
      </Grid>
      <Grid item xs={12} md={3} sx={{justifyContent:{xs:"flex-start",md:"center"},display:"flex"}}>
        <Box sx={{p:2,pt:{xs:0,md:2}}} >
          <Typography variant="h5" fontWeight="bold">About</Typography>
          <Stack sx={{pt:2}}>
            <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} onClick={()=>router.push("/")}>{t["About"]}</Link>
            <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} onClick={()=>router.push("/changelog")}>{t["ChangeLog"]}</Link>
            <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}}>{t["HowToUse"]}</Link>
            <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} href="https://github.com/g960059/hemodynamic-simulator-next/projects/1">{t["Roadmap"]}</Link>
          </Stack>
        </Box>
      </Grid>  
      <Grid item xs={12} md={3}  sx={{justifyContent:{xs:"flex-start",md:"center"},display:"flex"}} >
        <Box sx={{p:2,pt:{xs:0,md:2}}} >
          <Typography variant="h5" fontWeight="bold">Legal</Typography>
          <Stack sx={{pt:2}}>
            <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} onClick={()=>router.push("/terms")}>{t["Terms"]}</Link>
            <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} onClick={()=>router.push("/privacy")}>{t["PrivaryPolicy"]}</Link>
            <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} href="https://forms.gle/CDNpcKRTFKfn2Ejn7">{t["Contact"]}</Link>
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} md={3}  sx={{justifyContent:{xs:"flex-start",md:"center"},display:"flex"}} >
        <Box sx={{p:2,pt:{xs:0,md:2}}} >
          <Typography variant="h5" fontWeight="bold">Links</Typography>
          <Stack sx={{pt:2}}>
            <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} href="https://twitter.com/0xYusuke">Twitter</Link>
            <Link underline="hover" color="inherit" sx={{cursor:"pointer",my:1}} href="https://github.com/g960059/hemodynamic-simulator-next">GitHub</Link>
          </Stack>
        </Box>
      </Grid>                       
    </Grid>        
  </>
}

export default Footer;