export const dynamic = "force-dynamic";

import React  from 'react'
import {Grid, Typography, Divider,} from '@mui/material'
import {useTranslation} from "../../../src/hooks/useTranslation"

const Changelog = () => {
  const t = useTranslation();
  const timelines = [
    {time:"2021.12.10",content:"EcmoとImpellaを使用できるようになりました。"},
    {time:"2021.12.15",content:"弁膜症の重症度を選択できるようにしました。"},
    {time:"2021.12.23",content:"お気に入りの編集機能を追加しました。"},
    {time:"2021.12.28",content: "基本操作・グラフ描画のバグを修正しました。"}
  ]
  
  return <>
      <Grid container justifyContent="center"> 
        {/* <Grid item xs={12} md={10} lg={8}  sx={{mt:4,p:5,pb:3}} className='bg-white rounded-lg border-solid border border-slate-200 shadow'>
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
        </Grid> */}
      </Grid>
  </>
}


export default Changelog;