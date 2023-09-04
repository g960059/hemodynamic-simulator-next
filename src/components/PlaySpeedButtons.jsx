import React, {useState, useEffect} from 'react';
import {Box, Button, IconButton, Stack, Typography, Menu, MenuItem,Dialog,DialogTitle,DialogContent,DialogActions,Tab, List, ListItem,ListItemText,ListItemIcon, DialogContentText} from '@mui/material'

import {PlayArrow,Pause,SaveAlt,CloudUpload,SwitchAccount} from "@mui/icons-material";
import { useRouter } from 'next/navigation'
import en from '../locales/en'
import ja from '../locales/ja'

const PlaySpeedButtons = ({patient, mode, setMode}) =>{
  const {subscribe, unsubscribe, isPlaying, setIsPlaying, setSpeed,getHdps} = patient
  const [anchorEl, setAnchorEl] = useState(null);
  const [speedDisplayed, setSpeedDisplayed] = useState(1.0);
  const {locale} = useRouter()
  const t = locale==='en' ? en : ja
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState("0");

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
      {/* <Button sx={{color:'gray'}} onClick={()=>{setDialogOpen(true)}}>
        <Stack justifyContent='center' alignItems='center'>
          <SwitchAccount/>
          <Typography variant='caption'>{t['NewCase']}</Typography>
        </Stack> 
      </Button> */}
      {/* <Button sx={{color:'gray'}} onClick={()=>{saveInitialDataHdps()}}>
        <Stack justifyContent='center' alignItems='center'>
          <CloudUpload/>
          <Typography variant='caption'>{t['Save']}</Typography>
        </Stack>      
      </Button>        */}
      {/* <Dialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}}>
        <DialogTitle>
          {t["CaseList"]}
        </DialogTitle>
        <DialogContent>
        <TabContext value={tabValue}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList onChange={(e,v)=>{setTabValue(v)}}>
              <Tab label="Private" value="0" />
              <Tab label="Public" value="1" />
            </TabList>
          </Box>          
          <TabPanel value="0">
            
          </TabPanel>
          <TabPanel value="1">
          </TabPanel>
        </TabContext>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>{setDialogOpen(false)}} >
            Cancel
          </Button>
        </DialogActions>
      </Dialog> */}
    </Stack>
  )
}

export default PlaySpeedButtons