import React, {useState, useEffect} from 'react';
import {Box, Button, IconButton, Stack, Typography, Menu, MenuItem,Dialog,DialogTitle,DialogContent,DialogActions, List, ListItem,ListItemText,ListItemIcon} from '@mui/material'
import {PlayArrow,Pause,SaveAlt,Publish} from "@mui/icons-material";
import { useRouter } from 'next/router'
import en from '../locales/en'
import ja from '../locales/ja'

const PlaySpeedButtons = ({isPlaying, setIsPlaying, setSpeed, mode, setMode}) =>{
  const [anchorEl, setAnchorEl] = useState(null);
  const [speedDisplayed, setSpeedDisplayed] = useState(1.0);
  const {locale} = useRouter()
  const t = locale==='en' ? en : ja

  return (
    <Stack direction='row' justifyContent='center' alignItems='center' sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
      <IconButton onClick={()=>{setIsPlaying(prev=>!prev)}}>{isPlaying ? (
        <Stack justifyContent='center' alignItems='center'>
          <Pause/>
          <Typography variant='caption'>{t['Pause']}</Typography>
        </Stack>
        ):(
        <Stack justifyContent='center' alignItems='center'>
          <PlayArrow/>
          <Typography variant='caption'>{t['Play']}</Typography>
        </Stack>
      )}
      </IconButton>
      <Button onClick={(e)=>{setAnchorEl(e.currentTarget)}}  sx={{color:'gray'}} id="speed-button" aria-controls="speed-items" aria-haspopup="true" aria-expanded={Boolean(anchorEl) ? 'true' : undefined}>
        <Stack justifyContent='center' alignItems='center'>x{speedDisplayed>=1 ? speedDisplayed.toFixed(1): speedDisplayed}<Typography variant='caption'>{t['PlaySpeed']}</Typography></Stack>
      </Button>
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
      <Button sx={{color:'gray'}} onClick={()=>{setMode(prev => prev=="basic" ? 'advanced': 'basic')}}>
        <Stack justifyContent='center' alignItems='center'>
          <Typography variant="subtitle2" sx={{color:"#525151"}}>{mode == 'basic' ? t['Basic'] : t['Advanced']}</Typography>
          <Typography variant='caption'>{t['ControllerMode']}</Typography>
        </Stack>
      </Button> 
      <Button sx={{color:'gray'}}>
        <Stack justifyContent='center' alignItems='center'>
          <SaveAlt/>
          <Typography variant='caption'>{t['Save']}</Typography>
        </Stack> 
      </Button>
      <Button sx={{color:'gray'}}>
        <Stack justifyContent='center' alignItems='center'>
          <Publish/>
          <Typography variant='caption'>{t['Load']}</Typography>
        </Stack>      
      </Button>
    </Stack>
  )
}

export default PlaySpeedButtons