import React,{useState, useCallback, useEffect } from 'react';
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, Slider} from '@material-ui/core'
import {useTranslation} from '../../hooks/useTranslation'
import {InputRanges} from '../../constants/InputSettings'

const BasicHdps = ['Volume','Ras','LV_Ees','LV_alpha','LV_tau','HR']

const BasicController = ({getHdps,setHdps}) => {
  const t = useTranslation();
  const hdps = getHdps()
  return ( 
    <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{ p:[0.5,2],pb:0, pt:2}}>
      <Stack  sx={{width: '100%'}}  justifyContent="center" alignItems="center">
        {BasicHdps.map(hdp=>(
          <InputSlider hdp={hdp} hdps={hdps} setHdps={setHdps}/>
        ))}
      </Stack>
    </Box>
  )
}

export default BasicController

export const InputSlider = ({hdp, hdps,setHdps}) => {
  const t = useTranslation();
  return (
    <Box>
      <Typography>{hdp}</Typography>
      <Slider 
        defaultValue={hdps[hdp]} 
        min={InputRanges[hdp].min} 
        max={InputRanges[hdp].max} 
        step={InputRanges[hdp].step} 
        valueLabelDisplay="auto"
        onChangeCommitted={(e,v)=>{setHdps(hdp,v)}}
      />
    </Box>
  )
}
