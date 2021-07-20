import React, {useState} from 'react';
import {Box, Button, IconButton, Stack, Typography, Menu, MenuItem} from '@material-ui/core'
import {PlayArrow,Pause} from "@material-ui/icons";
import { useRouter } from 'next/router'
import en from '../locales/en'
import ja from '../locales/ja'


const PlaySpeedButtons = ({isPlaying, setIsPlaying, setSpeed}) =>{
  const [anchorEl, setAnchorEl] = useState(null);
  const [speedDisplayed, setSpeedDisplayed] = useState(1.0);
  const {locale} = useRouter()
  const t = locale==='en' ? en : ja

  return (
    <Stack direction='horizontal' justifyContent='center' alingItems='center' sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[0.5,2]}}>
      <IconButton onClick={()=>{setIsPlaying(prev=>!prev)}}>{isPlaying ? (
        <Stack justifyContent='center' alignItems='center'>
          <Pause/>
          <Typography variant='caption'>{t['Pause']}</Typography>
        </Stack>): (<Stack justifyContent='center' alignItems='center'>
          <PlayArrow/>
          <Typography variant='caption'>{t['Play']}</Typography>
        </Stack>
        )}</IconButton>
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
            <MenuItem onClick={()=>{setSpeed(s);setSpeedDisplayed(s); setAnchorEl(null);}}>{s==1 ? t['NormalSpeed']: s + t['SpeedRatio']}</MenuItem>
          ))}
        </Menu>        
    </Stack>
  )
}

export default PlaySpeedButtons