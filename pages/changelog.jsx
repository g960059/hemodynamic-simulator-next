import React  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack} from '@mui/material'
import {useTranslation} from "../src/hooks/useTranslation"
import { makeStyles} from '@mui/styles';
import Footer from "../src/components/Footer"
import {Timeline, TimelineConnector,TimelineItem,TimelineContent,TimelineSeparator,TimelineDot} from '@mui/lab'
import Layout from '../src/components/layout';

const useStyles = makeStyles((theme) =>({
  featuredBox: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
    backgroundColor: "white",
    border: "1px solid rgba(92, 147, 187, 0.17)",
    borderRadius: "12px",
  }
}));

const Changelog = () => {
  const t = useTranslation();
  const classes = useStyles();
  const timelines = [
    {time:"2021.12.10",content:"EcmoとImpellaを使用できるようになりました。"},
    {time:"2021.12.15",content:"弁膜症の重症度を選択できるようにしました。"},
    {time:"2021.12.23",content:"お気に入りの編集機能を追加しました。"},
    {time:"2021.12.28",content: "基本操作・グラフ描画のバグを修正しました。"}
  ]
  
  return <>
      <Grid container justifyContent="center"> 
        <Grid item xs={12} md={10} lg={8}  className={classes.featuredBox} sx={{mt:4,p:5,pb:3}}>
          <Typography variant="h4" fontWeight="bold" sx={{textAlign:"center"}}>{t["ChangeLog"]}</Typography>
          <Divider variant="middle" sx={{my:3}}/>
          <Timeline position='right' sx={{"& .MuiTimelineItem-positionRight::before":{display:"none"}}}>
            {timelines.slice(1).reverse().map(({time,content})=>(
              <TimelineItem>
                <TimelineSeparator>
                  <TimelineDot />
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h5" fontWeight="bold" sx={{mt:-.5}}>{time}</Typography>
                  <Typography variant="subtitle1" sx={{mt:1,mb:4,fontWeight:"bold"}}>{content}</Typography>
                </TimelineContent>
              </TimelineItem>  
            ))}      
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h5" fontWeight="bold" sx={{mt:-.5}}>{timelines[0].time}</Typography>
                <Typography variant="subtitle1" sx={{mt:1,mb:4,fontWeight:"bold"}}>{timelines[0].content}</Typography>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </Grid>
        <Footer/>
      </Grid>
      <div className={classes.background}/>
  </>
}

Changelog.getLayout = (page) => {
  return (
    <Layout>
      {page}
    </Layout>
  )
}

export default Changelog;