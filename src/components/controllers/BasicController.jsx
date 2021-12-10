import React,{useState} from 'react';
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, Slider,Tab, Button, ButtonGroup,ToggleButtonGroup,ToggleButton, Select} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';
import {useTranslation} from '../../hooks/useTranslation'
import {InputRanges} from '../../constants/InputSettings'
import {Refresh} from '@mui/icons-material';
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
            <Divider flexItem>{t["assisted_circulation"]}</Divider>
            <ImpellaButton hdps={hdps} setHdps={setHdps}/>
            <EcmoButton hdps={hdps} setHdps={setHdps}/>
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
            <Button onClick={value<20 ? onHandle(-0.5): onHandle(-10)} disabled={value<=0.5}>{value<20 ? "-0.5%" : "-10%"}</Button>
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
export const ImpellaButton = React.memo(({hdps,setHdps}) => {
  const t = useTranslation();
  const [type, setType] = useState(hdps["impella_type"]);
  const [level, setLevel] = useState(hdps["impella_aux_level"]);
  const handleChange = (e, newType) =>{
    if(newType=='None'){
      setType("None");
      setHdps("impella_type","None");
    }else{
      setType(newType);
      setHdps("impella_aux_level",level);
      setHdps("impella_type",newType);
    }
  }
  const handleLevel = e => {
    setLevel(e.target.value);
    if (type !='None') {
      setHdps("impella_aux_level",e.target.value);
    }
  }

  return <>
    <Grid container justifyContent="space-between" alignItems="center" display='flex' sx={{mb:1,mt:1}}>
      <Grid item xs={12} justifyContent="space-between" alignItems="center" display='flex' sx={{mb:.5}}>
        <Typography variant='h6'>Impella</Typography>
      </Grid>
      <Grid itex xs={12}  justifyContent="space-between" alignItems="center" display='flex'>
        <ToggleButtonGroup
          color="primary"
          value={type}
          exclusive
          onChange={handleChange}
          size="small"
        >
          <ToggleButton value="None">Off</ToggleButton>
          <ToggleButton value="2.5">2.5</ToggleButton>
          <ToggleButton value="CP">CP</ToggleButton>
          <ToggleButton value="5.0">5.0</ToggleButton>
        </ToggleButtonGroup>
        {
          type != "None" && <Grid item justifyContent="space-between" alignItems="center" display='flex'>
            <Typography variant="subtitle2" sx={{pr:.5}}>{t["auxiliary_level"]}</Typography>
            <Select
              labelId="impella-level-select-label"
              id="impella-level-select"
              value={level}
              onChange={handleLevel}
              size="small"
            >
              {
                [...Array(9).keys()].map(i => 
                  <MenuItem value={"P"+(i+1)}>{"P"+(i+1)}</MenuItem> 
                )
              }
            </Select>
          </Grid>
        }        
      </Grid>
    </Grid>
  </>
})

export const EcmoButton = React.memo(({hdps,setHdps}) => {
  const t = useTranslation();
  const [ecmoSpeed, setEcmoSpeed] = useState(hdps["ecmo_speed"]);
  const [isRunning, setIsRunning] = useState(false);

  const handleChange = (e, v) =>{
    if(v){
      setIsRunning(v);
      if(ecmoSpeed==0){
        setEcmoSpeed(5000);
        setHdps("ecmo_speed",5000);
      }else{
        setHdps("ecmo_speed",ecmoSpeed);
      }
    }else{
      setIsRunning(v);
      setHdps("ecmo_speed",0);
    }
  }
  const handleSpeed = e => {
    setEcmoSpeed(e.target.value);
    setHdps("ecmo_speed",e.target.value);
  }

  return <>
    <Grid container justifyContent="space-between" alignItems="center" display='flex' sx={{mb:1,mt:1}}>
      <Grid item xs={12} justifyContent="space-between" alignItems="center" display='flex' sx={{mb:.5}}>
        <Typography variant='h6'>ECMO</Typography>
      </Grid>
      <Grid itex xs={12}  justifyContent="space-between" alignItems="center" display='flex'>
        <ToggleButtonGroup
          color="primary"
          value={isRunning}
          exclusive
          onChange={handleChange}
          size="small"
        >
          <ToggleButton value={false}>Off</ToggleButton>
          <ToggleButton value={true}>On</ToggleButton>
        </ToggleButtonGroup>   
        {
          isRunning && <Grid item justifyContent="space-between" alignItems="center" display='flex'>
            <Typography variant="subtitle2" sx={{pr:.5}}>{t["ecmo_speed"]}</Typography>
            <Select
              labelId="ecmo-speed-select-label"
              id="ecmo-speed-select"
              value={ecmoSpeed}
              onChange={handleSpeed}
              size="small"
            >
              {
                [...Array(7).keys()].map(i => 
                  <MenuItem value={(i+1)*1000}>{(i+1)*1000}rpm</MenuItem> 
                )
              }
            </Select>
          </Grid>
        }              
      </Grid>
    </Grid>
  </>
})