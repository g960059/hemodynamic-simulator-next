import React,{useState} from 'react';
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, Slider,Tab, Button, ButtonGroup} from '@material-ui/core'
import {TabContext,TabList,TabPanel} from '@material-ui/lab';
import {useTranslation} from '../../hooks/useTranslation'
import {InputRanges} from '../../constants/InputSettings'
import {Refresh} from '@material-ui/icons';
import {DEFAULT_HEMODYANMIC_PROPS} from '../../hooks/usePvLoop'

const BasicHdps = ['Volume','Ras','LV_Ees','LV_alpha','LV_tau','HR']
const AdvancedHdps = ["Volume","HR","LV_Ees","LV_alpha" ,"LV_Tmax" ,"LV_tau" ,"LV_AV_delay" ,"RV_Ees","RV_alpha" ,"RV_Tmax" ,"RV_tau" ,"RV_AV_delay" ,"LA_Ees","LA_alpha" ,"LA_Tmax" ,"LA_tau" ,"RA_Ees","RA_alpha" ,"RA_Tmax" ,"RA_tau" ,"Ras" ,"Rap" ,"Rvs" ,"Rvp","Cas","Cap" ,"Cvs" ,"Cvp","Ravs","Ravr","Rmvr","Rmvs","Rpvr", "Rpvs", "Rtvr", "Rtvs"]

const BasicController = React.memo(({getHdps,setHdps}) => {
  const [tabValue, setTabValue] = useState("1");
  const t = useTranslation();
  const hdps = getHdps()
  return ( 
    <Box width={1}>
      <TabContext value={tabValue}>
        <TabList onChange={(e,v)=>{setTabValue(v)}} variant="fullWidth">
          <Tab label={t["BasicController"]} value="1" />
          <Tab label={t["AdvancedController"]} value="2" />
        </TabList>
        <TabPanel value="1" sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
          <Stack justifyContent="center" alignItems="center" >
            {BasicHdps.map(hdp=>(
              <InputButtons hdp={hdp} hdps={hdps} setHdps={setHdps}/>
            ))}
          </Stack>          
        </TabPanel>
        <TabPanel value="2" sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
          <Stack justifyContent="center" alignItems="center" >
            {AdvancedHdps.map(hdp=>(
              <InputButtons hdp={hdp} hdps={hdps} setHdps={setHdps}/>
            ))}
          </Stack>   
        </TabPanel>
      </TabContext>      
    </Box>
  )
})

export default BasicController

export const InputSlider = React.memo(({hdp, hdps,setHdps}) => {
  const t = useTranslation();
  return (
    <Grid container justifyContent="center" alignItems="center">
      <Grid item xs={5}>
        <Typography variant='subtitle2'>{t[hdp]}</Typography>
      </Grid>
      <Grid item xs={7}>
        <Slider 
          defaultValue={hdps[hdp]} 
          min={InputRanges[hdp].min} 
          max={InputRanges[hdp].max} 
          step={InputRanges[hdp].step} 
          valueLabelDisplay="auto"
          onChangeCommitted={(e,v)=>{setHdps(hdp,v)}}
        />
      </Grid>
    </Grid>
  )
})
export const InputButtons = React.memo(({hdp, hdps,setHdps}) => {
  const t = useTranslation();
  const [value, setValue] = useState(100);
  const display = () => {
    if(hdp == 'HR') return `${t[hdp]} (${Math.round(DEFAULT_HEMODYANMIC_PROPS[hdp]*value/100)} bpm)`
    if(value == 100) return `${t[hdp]}`
    if(hdp.includes('alpha') || hdp.includes('tau')) return `${t[hdp]} (${value-100>0 ? "-": "+"}${Math.abs((value-100))}%)`
    return `${t[hdp]} (${value-100>0 ? "+": ""}${Math.round((value-100))}%)`
  }
  const onHandle = (changeValue)=>()=>{
    if(hdp.includes('alpha') || hdp.includes('tau')){changeValue = -changeValue}
    if(changeValue == 0){
      setValue(100);
      setHdps(hdp, DEFAULT_HEMODYANMIC_PROPS[hdp])
    }else if(hdp === 'HR'){
      setValue(prev=> { 
        setHdps(hdp,Math.round(DEFAULT_HEMODYANMIC_PROPS[hdp]*(prev+changeValue)/100));
        return Math.round(prev+changeValue)
      })
    }else{
      setValue(prev=> { 
        setHdps(hdp,DEFAULT_HEMODYANMIC_PROPS[hdp]*(prev+changeValue)/100);
        return Math.round(prev+changeValue)
      })
    }
  }
  return (
    <Grid container justifyContent="center" alignItems="center" display='flex' sx={{mb:1}}>
      <Grid item xs={6}>
        <Typography variant='subtitle1'>{display()}</Typography>
      </Grid>
      <Grid item xs={6} justifyContent="center" alignItems="center" display='flex'>

        {hdp.includes('vr') ? (
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={value<20 ? onHandle(-1): onHandle(-10)}>{value<20 ? "-1%" : "-10%"}</Button>
            <Button onClick={onHandle(0)}><Refresh/></Button>
            <Button onClick={onHandle(10)}>+10%</Button>
          </ButtonGroup>
        ) : (
          <ButtonGroup variant="outlined" size="small">
            <Button onClick={onHandle(-10)} disabled={value<=30}>-10%</Button>
            <Button onClick={onHandle(0)}><Refresh/></Button>
            <Button onClick={onHandle(10)}>+10%</Button>
          </ButtonGroup>
        )}
      </Grid>
    </Grid>
  )
})