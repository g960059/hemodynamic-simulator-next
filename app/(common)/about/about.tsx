'use client'

import React,{ useEffect, useRef }  from 'react'
import {Box, Grid, Typography, Divider} from '@mui/material'
import Typed from "typed.js";
import {useTranslation} from "../../../src/hooks/useTranslation"
import Lottie from 'react-lottie-player' 
import MedicalFrontliners from "../../../src/lotties/MedicalFrontliners.json"
import LearningConcept from "../../../src/lotties/LearningConcept.json"
import Discussion from "../../../src/lotties/Discussion.json"
import Teaching from "../../../src/lotties/Teaching.json"
import Link from 'next/link';


const About = () => {
  const el = useRef(null);
  const t = useTranslation();

  useEffect(() => {
    let typed= new Typed(el?.current!, {
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
      typed?.destroy();
    };
  }, []);


  return <>
    <Grid container justifyContent="center">
      <Grid item xs={11} md={4} display="flex" justifyContent="flex-end" alignItems="center">
        <Box mt={{xs:3,md:0}} mb={{md:1}}>
          <Typography variant="h3" color="primary" sx={{fontWeight:"bold"}}><span ref={el}></span></Typography>
          <Typography variant="h3" sx={{fontWeight:"bold"}}>Your Insight</Typography>
          <Typography variant="subtitle1" sx={{lineHeight:1.8,color:"#4c4c4c",mt:2}}>{t["LpDescription"]}</Typography>
          <Box sx={{width:1,display:"flex", justifyContent:{xs:"center",md:"flex-start"}}}>
            <Link href="/" className="font-bold bg-blue-500 text-white cursor-pointer py-2 px-2 md:px-4 text-base rounded-md flex justify-center items-center hover:bg-sky-700 border-none transition" >今すぐはじめる</Link>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={11} md={6} sx={{display:"flex",justifyContent:"center", height: {xs:"330px", md:"440px"}}}>
        <Lottie loop animationData={MedicalFrontliners} play style={{ objectFit:"contain" }} />
      </Grid>
    </Grid>
    <Divider light variant="middle" sx={{mx:{sx:2,md:10}}}/>
    <Box display="flex" justifyContent="center" mt={4}>
      <Typography variant="h4" fontWeight="bold">How it works</Typography>
    </Box>
    <Grid container spacing={3} px={4} mt={1} mb={6}>
      <Grid item xs={12} md={4}>
        <Box sx={{p:2}} className="bg-white rounded-lg border-solid border border-slate-200 shadow">
          <Typography variant="h6" sx={{mb:2, fontWeight:"bold",textAlign:"center"}}>循環をより深く理解しよう</Typography>
          <Box sx={{display:"flex",justifyContent:"center",width:1,height:"200px"}}>
            <Lottie loop animationData={LearningConcept} play style={{ objectFit:"contain" }} />
          </Box>
          <Typography variant="body1">強固な数理モデルを使っているので、複雑な循環動態を再現性・透明性を持って理解することができます。</Typography>
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <Box sx={{p:2}} className="bg-white rounded-lg border-solid border border-slate-200 shadow">
          <Typography variant="h6" sx={{mb:2, fontWeight:"bold",textAlign:"center"}}>症例を振り返ろう</Typography>
          <Box sx={{display:"flex",justifyContent:"center",width:1,height:"200px"}}>
            <Lottie loop animationData={Discussion} play style={{ objectFit:"contain" }} />
          </Box>
          <Typography variant="body1">心不全や弁膜症など様々な病態のシミュレーションが可能です。検討した症例は周りにも共有しよう。</Typography>
        </Box>    
      </Grid>
      <Grid item xs={12} md={4}>
      <Box sx={{p:2}} className="bg-white rounded-lg border-solid border border-slate-200 shadow">
        <Typography variant="h6" sx={{mb:2, fontWeight:"bold",textAlign:"center"}}>分かりやすく伝えよう</Typography>
        <Box sx={{display:"flex",justifyContent:"center",width:1,height:"200px"}}>
          <Lottie loop animationData={Teaching} play style={{ objectFit:"contain" }} />
        </Box>
        <Typography variant="body1">可視化することで、医療者それぞれの経験に基づいた治療をわかりやすく、周りに伝えることができます。</Typography>
        </Box>
      </Grid>            
    </Grid>
  </>
}




export default About;

