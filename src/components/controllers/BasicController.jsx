import React,{useState} from 'react';
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, Slider,Tab} from '@material-ui/core'
import {TabContext,TabList,TabPanel} from '@material-ui/lab';
import {useTranslation} from '../../hooks/useTranslation'
import {InputRanges} from '../../constants/InputSettings'

const BasicHdps = ['Volume','Ras','LV_Ees','LV_alpha','LV_tau','HR']

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
              <InputSlider hdp={hdp} hdps={hdps} setHdps={setHdps}/>
            ))}
          </Stack>          
        </TabPanel>
        <TabPanel value="2">Item Two</TabPanel>
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
