import React,{ useEffect, useRef }  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack,Link, CircularProgress} from '@mui/material'
import Typed from "typed.js";
import {useTranslation} from "../src/hooks/useTranslation"
import Image from 'next/image'
import { makeStyles} from '@mui/styles';
import { useRouter } from 'next/router'
import Footer from "../src/components/Footer"
import {auth,db} from '../src/utils/firebase'
import Lottie from 'react-lottie-player' 
import MedicalFrontliners from "../src/lotties/MedicalFrontliners.json"
import LearningConcept from "../src/lotties/LearningConcept.json"
import Discussion from "../src/lotties/Discussion.json"
import Teaching from "../src/lotties/Teaching.json"


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
    let typed= new Typed(el.current, {
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
      <Box> 
        <Grid container justifyContent="center">
          <Grid item xs={11} md={4} display="flex" justifyContent="flex-end" alignItems="center">
            <Box mt={{xs:3,md:0}} mb={{md:1}}>
              <Typography variant="h3" color="primary" sx={{fontWeight:"bold"}}><span ref={el}></span></Typography>
              <Typography variant="h3" sx={{fontWeight:"bold"}}>Your Insight</Typography>
              <Typography variant="subtitle1" sx={{lineHeight:1.8,color:"#4c4c4c",mt:2}}>{t["LpDescription"]}</Typography>
              <Box sx={{width:1,display:"flex", justifyContent:{xs:"center",md:"flex-start"}}}>
                <Button variant="contained" size="large" sx={{mt:3}} onClick={()=>{router.push("/app")}}>今すぐはじめる</Button>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={11} md={6} sx={{display:"flex",justifyContent:"center", height: {xs:"330px", md:"440px"}}}>
            <Lottie loop animationData={MedicalFrontliners} play style={{ objectFit:"contain" }} />
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
              <Box sx={{display:"flex",justifyContent:"center",width:1,height:"200px"}}>
                <Lottie loop animationData={LearningConcept} play style={{ objectFit:"contain" }} />
              </Box>
              <Typography variant="body1">強固な数理モデルを使っているので、複雑な循環動態を再現性・透明性を持って理解することができます。</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{p:2}} className={classes.featuredBox}>
              <Typography variant="h6" sx={{mb:2, fontWeight:"bold",textAlign:"center"}}>症例を振り返ろう</Typography>
              <Box sx={{display:"flex",justifyContent:"center",width:1,height:"200px"}}>
                <Lottie loop animationData={Discussion} play style={{ objectFit:"contain" }} />
              </Box>
              <Typography variant="body1">心不全や弁膜症など様々な病態のシミュレーションが可能です。検討した症例は周りにも共有しよう。</Typography>
            </Box>    
          </Grid>
          <Grid item xs={12} md={4}>
          <Box sx={{p:2}} className={classes.featuredBox}>
            <Typography variant="h6" sx={{mb:2, fontWeight:"bold",textAlign:"center"}}>分かりやすく伝えよう</Typography>
            <Box sx={{display:"flex",justifyContent:"center",width:1,height:"200px"}}>
              <Lottie loop animationData={Teaching} play style={{ objectFit:"contain" }} />
            </Box>
            <Typography variant="body1">可視化することで、医療者それぞれの経験に基づいた治療をわかりやすく、周りに伝えることができます。</Typography>
            </Box>
          </Grid>            
        </Grid>
        <Divider light variant="middle" sx={{mx:{sx:2,md:10}}}/>
        {/* <Box display="flex" justifyContent="center" mt={4}>
          <Typography variant="h3">Supporter Plans</Typography>
        </Box>
        <Grid container spacing={3} px={4} mt={1} mb={6}>
          <Grid item xs={12} md={4}>
            <Box sx={{p:3}} className={classes.featuredBox}>
              <Grid container justifyContent="space-between" sx={{mb:3}}>
                <Grid item xs={12} md={7}>
                  <Typography variant="h5" sx={{my:2, fontWeight:"bold",textAlign:"center"}}>☕ Coffee Supporter</Typography>
                </Grid>
                <Grid item xs={12} md={5} justifyContent="center">
                  <Stack direction="row" alignItems="center" justifyContent="center"><Typography variant="h4" color="primary">¥500</Typography><Typography variant="subtitle2" color="primary" sx={{mt:.5,ml:.5}}>/月</Typography></Stack>                    
                </Grid>
              </Grid>
              <Stack justifyContent="center" alignItems="center">
                <Typography variant="body1">私はコーヒーが大好きです。</Typography>
                <Typography variant="body1">あなたの1杯でさらに頑張れます。</Typography>
              </Stack>
              <Stack mt={3} justifyContent="center" alignItems="center" spacing={1}>
                <Typography variant="subtitle1">✔特別な患者プリセットのロード</Typography>
              </Stack>
              <Stack justifyContent="center" alignItems="center" mt={3}><Button variant='outlined'>選択する</Button></Stack>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{p:3}} className={classes.featuredBox}>
              <Grid container justifyContent="space-between" sx={{mb:3}}>
                <Grid item xs={12} md={7}>
                  <Typography variant="h5" sx={{my:2, fontWeight:"bold",textAlign:"center"}}>📖 Book Supporter</Typography>
                </Grid>
                <Grid item xs={12} md={5} justifyContent="center">
                  <Stack direction="row" alignItems="center" justifyContent="center"><Typography variant="h4" color="primary">¥3000</Typography><Typography variant="subtitle2" color="primary" sx={{mt:.5,ml:.5}}>/月</Typography></Stack>                   
                </Grid>
              </Grid>
              <Stack justifyContent="center" alignItems="center">
                <Typography variant="body1">毎月、新しい論文や本を読んでいます。</Typography>
                <Typography variant="body1">あなたのサポートで、新機能を開発できます。</Typography>
              </Stack>
              <Stack mt={3} justifyContent="center" alignItems="center" spacing={1}>
                <Typography variant="subtitle1">✔特別な患者プリセットのロード</Typography>
                <Typography variant="subtitle1">✔トップページにロゴを表示</Typography>
              </Stack>
              <Stack justifyContent="center" alignItems="center" mt={3}><Button variant='outlined'>選択する</Button></Stack>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{p:3}} className={classes.featuredBox}>
              <Grid container justifyContent="space-between" sx={{mb:3}}>
                <Grid item xs={12} md={7}>
                  <Typography variant="h5" sx={{my:2, fontWeight:"bold",textAlign:"center"}}>🦄 Unicorn Supporter</Typography>
                </Grid>
                <Grid item xs={12} md={5} justifyContent="center">
                  <Stack direction="row" alignItems="center" justifyContent="center"><Typography variant="h4" color="primary">¥50000~</Typography><Typography variant="subtitle2" color="primary" sx={{mt:.5,ml:.5}}>/月</Typography></Stack>                   
                </Grid>
              </Grid>
              <Stack justifyContent="center" alignItems="center">
                <Typography variant="body1">大きな支援を心より感謝します。</Typography>
                <Typography variant="body1">今後も開発・研究を継続できます。</Typography>
              </Stack>
              <Stack mt={3} justifyContent="center" alignItems="center" spacing={1}>
                <Typography variant="subtitle1">✔特別な患者プリセットのロード</Typography>
                <Typography variant="subtitle1">✔トップページにロゴを表示</Typography>
                <Typography variant="subtitle1">✔記事や学会発表時にロゴを表示</Typography>
                <Typography variant="subtitle1">✔Twitterでスポンサーシップをツイート</Typography>
                <Typography variant="subtitle1">✔新機能リクエストに優先的に対応</Typography>
              </Stack>
              <Stack justifyContent="center" alignItems="center" mt={3}><Button variant='outlined'>選択する</Button></Stack>
            </Box>
          </Grid>           
        </Grid> */}
        <Divider light variant="middle" sx={{mx:{sx:2,md:10}}}/>
        <Footer/>
      </Box>
      <div className={classes.background}></div>
  </>
}

export default About;

