import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, CircularProgress} from '@material-ui/core'
import {useTranslation} from '../hooks/useTranslation'

const dataTypeKeyMap = {
  AoP:'AoP',
  PAP:'PAP',
  CVP:'Pra',
  SV:'Qlv',
  CO:'Qlv',
  EF:'Qlv',
  PCWP:'Pla'
}
const dataTypeUnit = {
  AoP:'mmHg',
  PAP:'mmHg',
  CVP:'mmHg',
  SV:'ml',
  CO:'L/min',
  EF:'%',
  PCWP:'mmHg'
}

const display = (dataType, hdp) => storage => {
  if(!storage[dataTypeKeyMap[dataType]]) return null
  if(['AoP','PAP','CVP'].includes(dataType)){
    return storage[dataTypeKeyMap[dataType]].max.toFixed() + '/' + storage[dataTypeKeyMap[dataType]].min.toFixed()
  }
  if(dataType === 'PCWP') return (storage[dataTypeKeyMap[dataType]].max/3  + storage[dataTypeKeyMap[dataType]].min*2/3).toFixed()
  if(dataType === 'SV') return (storage[dataTypeKeyMap[dataType]].max - storage[dataTypeKeyMap[dataType]].min).toFixed()
  if(dataType === 'CO') return ((storage[dataTypeKeyMap[dataType]].max - storage[dataTypeKeyMap[dataType]].min) * hdp.HR/1000).toFixed()
  if(dataType === 'EF') return ((storage[dataTypeKeyMap[dataType]].max - storage[dataTypeKeyMap[dataType]].min) / storage[dataTypeKeyMap[dataType]].max * 100).toFixed()
}

const OutputPanel = React.memo(({subscribe,unsubscribe, dataTypes,setDataTypes, getHdps}) =>{
  const t = useTranslation();
  const dataRef = useRef({})
  const subscriptionIdRef = useRef();

  const initializeDataType = (dataType) => {
    if(!dataRef.current[dataTypeKeyMap[dataType]]){
      dataRef.current[dataTypeKeyMap[dataType]] = {min: Infinity, max: -Infinity}
    }
  }

  const update = (data, time, hdprops) => {
    console.log('hey')
    Object.keys(dataRef.current).forEach(sk => {
      Object.entries(dataRef.current[sk]).forEach(([k,v])=>{
        if(data[sk]?.length>0){
          if(k=='min'){
            if(v > data[sk][0]){dataRef.current[sk][k] = data[sk][0]}
          }
          if(k=='max'){
            if(v < data[sk][0]){dataRef.current[sk][k] = data[sk][0]}
          }
        }
      })
    })
  }  

  useEffect(() => {
    for(let i=0; i<dataTypes.length; i++){
      initializeDataType(dataTypes[i])
    }
    subscriptionIdRef.current = subscribe(update)
    return ()=>{
      unsubscribe(subscriptionIdRef.current)
    }
  }, []);

  return (
    <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{ p:[0.5,2],pb:0, pt:2, mb:-2}}>
      {dataTypes.map(dataType=>(
        <Stack justifyContent='center' alignItems='center'>
          <Typography variant='h5' style={{display: 'inline'}}>{t[dataType]}</Typography>
          <Typography variant='h5' >{display(dataType,getHdps())(dataRef.current)}</Typography>
        </Stack>
      ))}
    </Box>
  )
})

export default OutputPanel

