import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, CircularProgress} from '@mui/material'
import {useTranslation} from '../hooks/useTranslation'
import {AoP,CVP,PAP,SV, EF, LVEDP, HR, CO,LaKickRatio} from '../utils/metrics'



const OutputPanel = React.memo(({subscribe,unsubscribe, dataTypes, getHdps}) =>{
  const t = useTranslation();
  const subscriptionIdRef = useRef();

  const outputOptions = [AoP,CVP,PAP,SV, EF, LVEDP, CO,LaKickRatio]
  const instancesRef = useRef([]);
  const [refresh, setRefresh] = useState(0);
  const update = (data, time, hdprops) => {
    for(let instance of instancesRef.current){
      instance.update(data, time, hdprops)
    }
    let current = Math.floor(time / (60000/ data['HR'][0]));
    if(refresh != current){
      setRefresh(current);
    }
  }
  useEffect(() => {
    for(let i=0; i<outputOptions.length; i++){
      let instance = new outputOptions[i]();
      instancesRef.current.push(instance);
      subscriptionIdRef.current = subscribe(update);
    }
    return ()=>{
      instancesRef.current.splice(0);
      unsubscribe(subscriptionIdRef.current)
    }
  }, []);
  return (
    <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{ p:[0.5,2],pb:0, pt:2, mb:-2, backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
      {instancesRef.current.map((instance,i) =>(
        <Stack justifyContent='center' alignItems='center' sx={{mx:1}}>
          <Typography variant='subtitle2' style={{display: 'inline'}}>{t["output_label"][outputOptions[i].getLabel()]}</Typography>
          <Stack direction='row' justifyContent='center' alignItems='center'>
            <Typography variant='subtitle2'sx={{mr:.5}}>{instance.get()}</Typography>
            <Typography variant='body2'sx={{color: 'text.secondary'}}>{outputOptions[i].getUnit()}</Typography>
          </Stack>
        </Stack>
      ))}
    </Box>
  )
})

export default OutputPanel


// const dataTypeKeyMap = {
//   AoP:'AoP',
//   PAP:'PAP',
//   CVP:'Pra',
//   SV:'Qlv',
//   CO:'Qlv',
//   EF:'Qlv',
//   PCWP:'Pla'
// }
// const dataTypeUnit = {
//   AoP:'mmHg',
//   PAP:'mmHg',
//   CVP:'mmHg',
//   SV:'ml',
//   CO:'L/min',
//   EF:'%',
//   PCWP:'mmHg'
// }