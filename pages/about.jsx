import React,{ useEffect, useRef }  from 'react'
import {Box, Grid, Typography, Divider} from '@mui/material'
import Typed from "typed.js";
import {useTranslation} from "../src/hooks/useTranslation"
import Image from 'next/image'
import { makeStyles} from '@mui/styles';

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
  }}),
);

const About = () => {
  const el = useRef(null);
  const t = useTranslation();
  const classes = useStyles();

  useEffect(() => {
    const typed = new Typed(el.current, {
      strings: ["Test","Deepen", "Share",], 
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
            </Box>
          </Grid>
          <Grid item xs={11} md={6} sx={{position:"relative", height: {xs:"330px", md:"440px"}}}>
            <Image src="/LpImage.gif" layout={'fill'} objectFit={'contain'} />
          </Grid>
        </Grid>
        <Divider light variant="middle" sx={{mx:10}}/>
        <Box display="flex" justifyContent="center" mt={4}>
            <Typography variant="h3">How it works</Typography>
        </Box>
      </Box>
      <div className={classes.background}></div>
  </>
}

export default About;