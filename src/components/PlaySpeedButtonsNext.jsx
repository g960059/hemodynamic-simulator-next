import React, {useState, useEffect} from 'react';
import {Box, Button, IconButton, Stack, Typography, Menu, MenuItem,Tooltip} from '@mui/material'
import { makeStyles } from '@mui/styles';

import {PlayArrow,Pause,SaveAlt,CloudUpload,SwitchAccount} from "@mui/icons-material";
import { useRouter } from 'next/router'
import en from '../locales/en'
import ja from '../locales/ja'

const useStyles = makeStyles((theme) =>(
  {
    neumoIconButton:{
      color:"#93a5b1",
      boxShadow:"0 0 2px #4b57a926, 0 10px 12px -4px #0009651a",
      width:"44px",
      height:"44px",
      backgroundColor:"white",
      borderRadius:"50%",
      transition:".3s",
      "&:hover":{
        boxShadow:"0 25px 25px -10px #00096540",
        transform: "translateY(-2px)",
        color: "#3ea8ff",
        backgroundColor:"white",
      }
    }
  })
);


const PlaySpeedButtons = ({engine, vertical=false}) =>{
  const classes = useStyles()
  const {isPlaying, setIsPlaying, setSpeed} = engine
  const [anchorEl, setAnchorEl] = useState(null);
  const [speedDisplayed, setSpeedDisplayed] = useState(1.0);
  const {locale} = useRouter()
  const t = locale==='en' ? en : ja

  return (
    <Stack direction={vertical ? "column":'row'} justifyContent='center' alignItems='center' spacing={2}>
      <Tooltip title={isPlaying ? t['Pause']: t['Play']}>
        <IconButton onClick={()=>{setIsPlaying(prev=>!prev)}} className={classes.neumoIconButton}>{isPlaying ? <Pause/>:<PlayArrow/>}</IconButton>
      </Tooltip>  
      <Tooltip title={t['PlaySpeed']}>
        <Button onClick={(e)=>{setAnchorEl(e.currentTarget)}} className={classes.neumoIconButton} sx={{borderRadius:"2.5rem !important"}} id="speed-button" aria-controls="speed-items" aria-haspopup="true" aria-expanded={Boolean(anchorEl) ? 'true' : undefined}>
          x{speedDisplayed>=1 ? speedDisplayed.toFixed(1): speedDisplayed}
        </Button>
      </Tooltip>
      <Menu
        id="speed-items"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={()=>{setAnchorEl(null)}}
        MenuListProps={{
          'aria-labelledby': 'speed-button',
        }}
      >
        {[0.25, 0.5, 0.75,1,2,5].map(s=>(
          <MenuItem onClick={()=>{setSpeed(s);setSpeedDisplayed(s); setAnchorEl(null);}} key={s}>{s==1 ? t['NormalSpeed']: s + t['SpeedRatio']}</MenuItem>
        ))}
      </Menu>        
    </Stack>
  )
}

export default PlaySpeedButtons