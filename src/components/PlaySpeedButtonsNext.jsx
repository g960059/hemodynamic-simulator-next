import React, {useState, useEffect} from 'react';
import {Box, Button, IconButton, Stack, Typography, Menu, MenuItem,Tooltip, useMediaQuery} from '@mui/material'
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


const PlaySpeedButtons = ({engine, vertical=false, isEmbed = false}) =>{
  const classes = useStyles()
  const {isPlaying, setIsPlaying, setSpeed} = engine
  const [anchorEl, setAnchorEl] = useState(null);
  const [speedDisplayed, setSpeedDisplayed] = useState(1.0);
  const {locale} = useRouter()
  const t = locale==='en' ? en : ja
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'), {noSsr: true});
  if(isUpMd || isEmbed){
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
  }else{
    return <>
      <div onClick={()=>{setIsPlaying(prev=>!prev)}} className='bg-white px-1.5 m-1.5 mx-1 inline-flex items-center rounded cursor-pointer'>
        {isPlaying ? 
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5  fill-slate-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg> : 
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 fill-slate-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>          
        }
      </div>
      <div onClick={(e)=>{setAnchorEl(e.currentTarget)}} className="font-bold text-sm text-gray-500 bg-white px-1.5 m-1.5 ml-1 mr-2 inline-flex items-center rounded-sm cursor-pointer" id="speed-button" aria-controls="speed-items" aria-haspopup="true" aria-expanded={Boolean(anchorEl) ? 'true' : undefined}>
        x{speedDisplayed>=1 ? speedDisplayed.toFixed(1): speedDisplayed}
      </div>
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
    </>
  }
}

export default PlaySpeedButtons