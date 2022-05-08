import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, CircularProgress} from '@mui/material'
import {useTranslation} from '../hooks/useTranslation'
import {AoP,CVP,PAP,LAP,SV,EF,PVA,CPO,LVEDP,HR,CO,LaKickRatio} from '../utils/metrics'



const OutputPanel = React.memo(({patient}) =>{
  const {subscribe,unsubscribe} = patient;
  const t = useTranslation();
  const subscriptionIdRef = useRef();

  const outputOptions = [AoP,LAP,PAP,CVP,SV,EF,CO,PVA,CPO,LVEDP,LaKickRatio]
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
    <Box width={1} justifyContent='center' alignItems='center' sx={{ p:{xs:0.5,md:2},py:1, backgroundColor:'rgb(241, 245, 249)',color:"slategrey",boxShadow:{xs:'none',md:'rgb(0 10 60 / 20%) 0px 3px 6px -2px'},borderColor: 'grey.300', overflowX:{xs:"scroll",md:"none"},display:{xs:"-webkit-box",md:"grid"},gridTemplateColumns:{md:"repeat(auto-fill,minmax(100px,1fr))"}}}>
      {instancesRef.current.map((instance,i) =>(
        <Stack justifyContent='center' alignItems='center' sx={{mx:1}} key={i}>
          <Typography variant='subtitle2' style={{display: 'inline'}}>{t["output_label"][outputOptions[i].getLabel()]}</Typography>
          <Stack direction='row' justifyContent='center' alignItems='center'>
            <Typography variant='subtitle2'sx={{mr:.5}}>{instance.get()}</Typography>
            <Typography variant='caption'sx={{color: 'text.secondary'}} noWrap>{outputOptions[i].getUnit()}</Typography>
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