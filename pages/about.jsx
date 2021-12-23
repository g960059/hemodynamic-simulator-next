import React,{ useEffect, useRef }  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack,Link} from '@mui/material'
import Typed from "typed.js";
import {useTranslation} from "../src/hooks/useTranslation"
import Image from 'next/image'
import { makeStyles} from '@mui/styles';
import { useRouter } from 'next/router'
import Footer from "../src/components/Footer"

const useStyles = makeStyles((theme) =>({
  background: {
    position: "fixed",
    zIndex: -1,
    top: "0px",
    left: "0px",
    width: "100%",
    overflow: "hidden",
    transform: "translate3d(0px, 0px, 0px)",
    height: "-webkit-fill-available",
    background: "white",
    opacity: 1,
    userSelect: "none",
    pointerEvents: "none"
  },
  featuredBox: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "rgb(69, 90, 100)",
    boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
    backgroundColor: "white",
    border: "1px solid rgba(92, 147, 187, 0.17)",
    borderRadius: "12px",
  }
}),
);

const About = () => {
  const el = useRef(null);
  const t = useTranslation();
  const classes = useStyles();
  const router = useRouter()

  useEffect(() => {
    const typed = new Typed(el.current, {
      strings: ["Deepen","Discuss", "Share",], 
      startDelay: 300,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 1000,
      smartBackspace: true,
      loop: true,
      showCursor: true,
    });
    return () => {
      typed.destroy();
    };
  }, []);

  return <>
      <Box> 
        <Grid container justifyContent="center">
          <Grid item xs={11} md={4} display="flex" justifyContent="flex-end" alignItems="center">
            <Box mt={{xs:3,md:0}} mb={{md:1}}>
              <Typography variant="h3" color="primary" sx={{fontWeight:"bold"}}><span ref={el}></span></Typography>
              <Typography variant="h3" sx={{fontWeight:"bold"}}>Your Insight</Typography>
              <Typography variant="subtitle1" sx={{lineHeight:1.8,color:"#4c4c4c",mt:2}}>{t["LpDescription"]}</Typography>
              <Button variant="contained" sx={{mt:3}} onClick={()=>{router.push("/")}}>今すぐはじめる</Button>
            </Box>
          </Grid>
          <Grid item xs={11} md={6} sx={{position:"relative", height: {xs:"330px", md:"440px"}}}>
            <Image src="/LpImage.gif" layout={'fill'} objectFit={'contain'} />
          </Grid>
        </Grid>
        <Divider light variant="middle" sx={{mx:{sx:2,md:10}}}/>
        <Box display="flex" justifyContent="center" mt={4}>
          <Typography variant="h3">How it works</Typography>
        </Box>
        <Grid container spacing={3} px={4} mt={1} mb={6}>
          <Grid item xs={12} md={4}>
            <Box sx={{p:2}} className={classes.featuredBox}>
              <Typography variant="h6" sx={{mb:2, fontWeight:"bold",textAlign:"center"}}>循環をより深く理解しよう</Typography>
              <Box sx={{position:"relative",width:1,height:"200px"}}><Image src="/Learning.gif" layout={'fill'} objectFit={'contain'}/></Box>
              <Typography variant="body1">強固な数理モデルを使っているので、複雑な循環動態を再現性・透明性を持って理解することができます。</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{p:2}} className={classes.featuredBox}>
              <Typography variant="h6" sx={{mb:2, fontWeight:"bold",textAlign:"center"}}>症例を振り返ろう</Typography>
              <Box sx={{position:"relative",width:1,height:"200px"}}><Image src="/disscussion.gif" layout={'fill'} objectFit={'contain'}/></Box>
              <Typography variant="body1">心不全や弁膜症など様々な病態のシミュレーションが可能です。検討した症例は周りにも共有しよう。</Typography>
            </Box>    
          </Grid>
          <Grid item xs={12} md={4}>
          <Box sx={{p:2}} className={classes.featuredBox}>
            <Typography variant="h6" sx={{mb:2, fontWeight:"bold",textAlign:"center"}}>分かりやすく伝えよう</Typography>
            <Box sx={{position:"relative",width:1,height:"200px"}}><Image src="/teaching.gif" layout={'fill'} objectFit={'contain'}/></Box>
            <Typography variant="body1">可視化することで、医療者それぞれの経験に基づいた治療をわかりやすく、周りに伝えることができます。</Typography>
            </Box>
          </Grid>            
        </Grid>
        <Divider light variant="middle" sx={{mx:{sx:2,md:10}}}/>
        <Footer/>
      </Box>
      <div className={classes.background}></div>
  </>
}

export default About;