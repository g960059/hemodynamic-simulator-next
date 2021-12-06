import React, { useRef, useState, useEffect, useLayoutEffect, useCallback} from 'react'
import {Box, Button,CircularProgress, Grid, CssBaseline, IconButton, ButtonBase, Stack, Typography, Tab,Tabs, Divider} from '@mui/material'
import SwipeableViews from 'react-swipeable-views';
import {usePvLoop} from '../src/hooks/usePvLoop'

import PVPlot from '../src/components/PVPlot'
import PlaySpeedButtons from '../src/components/PlaySpeedButtons'
import {a11yProps, TabPanel} from '../src/components/TabUtils'
import { makeStyles } from '@mui/styles';
import {useTranslation} from '../src/hooks/useTranslation'
import RealTimeChart from '../src/components/RealTimeChart'
import OutputPanel from '../src/components/OutputPanel'
import LogPlot from '../src/components/LogPlot'
import BasicController from '../src/components/controllers/BasicController'
import CombinedChart from '../src/components/combined/CombinedChart'
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
// import dynamic from 'next/dynamic'
// const RealTimeChart =  dynamic(()=>import('../src/components/RealTimeChart'), { ssr: false })
// Set this code once in application startup
SciChartSurface.setRuntimeLicenseKey("j3aVXSGZO23k42CCUenqTAAFoPWU5oCEw4TRfOwo+ZPNTB9vnmOCSF3Kcm1Lfb+bxz944AxJ2gPypOt820lF3xAR6NPuphVp8D5ZJe9yT2bvt/J+0NLg1bdmN7XfQ7JnOVNe3CDQQWGKw1ascjhsowwRSECTRoJ8fNJZMf3qq2R55VJUuiLxmbjtu4FPFi5aBc+BYJliCqhVaEGFhJ1ewMP8ZWlxmL44widB6WTwe+RJ42PKjqEBIx4m8adyOdaEvdvV5cjMUgRqkkkeo5jEq/WjcZRMcCm+HJQxwD56E4vHX+L/wOWILeOAYZgdcG6uZnBaSGt2Zrp/3Z353PtMLfwzMTKt8a2kzxoeJBrpezPNUWU3rojJ9iZdYS2AheNg1x51Jh0t05iZ98C4h4nSyyHsBlD9+BkiIeq19eQo7RbEqn026515lUm81V7SUPpYANv6WEoHZuJ1R2W1c1vgyzi6oeEXg/ybISCcjldD7tnjts2IjgjfAuiNwdxY7N7Z/IPinkAc0AztkRHiROkscwmNHb4ygmMUGQ8c2eUIXIy2usID4WofJbgaBRX6a2ocB+WNcdV2CiH7fI4br8f8grcUSFkp/Hkab9x8zkttp5NDMoHdf2U9HEBXL5LfX0RUJFi6hMzcHXV8L6+INf8zNc8aUiG2f5oB+748n/chVimgWuh63ou0KItn84SC1KVAF1mLqTOBYiPFNt480WK4gESM+Czs7Lt9e9RMw2QW5TeChqsrKWLM");

const useStyles = makeStyles((theme) =>(
  {
    containerBox: {
      overflow: 'hidden',
      overflowY: 'scroll',
      height: `auto`,
      [theme.breakpoints.up('md')]: {
        height: `calc(100vh - 56px)`,
      },
      // [theme.breakpoints.up('sm')]: {
      //   height: `calc(100vh - 64px)`,
      // },
    },
    subContainerBox: {
      overflow: 'hidden',
      overflowY: 'scroll',
      height: `auto`,
      [theme.breakpoints.up('md')]: {
        maxHeight : `calc(100vh - 174px)`,
      },
      // [theme.breakpoints.up('sm')]: {
      //   maxHeight : `calc(100vh - 182px)`,
      // },
    },    
  })
);


const App = () => {
  const classes = useStyles();
  const t = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const {subscribe,unsubscribe ,isPlaying,setIsPlaying, setHdps, getHdps, setSpeed} = usePvLoop()
  const [pressureDataTypes, setPressureDataTypes] = useState(['Plv', 'Pla', 'AoP']);
  const [pvDataTypes, setPvDataTypes] = useState(['LV', 'LA']);
  const [combinedData, setCombinedData] = useState(['RA']);
  const [outputDataTypes, setOutputDataTypes] = useState(['AoP','PAP','CVP','SV','CO','PCWP']);
  return (
    <> 
    <Grid container justifyContent='center' spacing={[0,1]}>
      <Grid item xs={12} md={5} lg={4} justifyContent='center' sx={{order:[1,1,0]}}>
        <Box className={classes.containerBox} mx={[0,1]}>
          <Box className={classes.subContainerBox}>
            <BasicController getHdps={getHdps} setHdps={setHdps}/>
          </Box>
          <Box sx={{display: { xs: 'none', md: 'block' }, mt:2}}>
            {tabValue != 3 && <PlaySpeedButtons setIsPlaying={setIsPlaying} isPlaying={isPlaying} setSpeed={setSpeed}/>}        
          </Box>
        </Box>
        <Divider orientation="vertical" flexItem xs={{display: { xs: 'none', md: 'block' }}}/>
      </Grid>
      <Grid item xs={12} md={7} lg={7} sx={{order:[0,0,1]}}>
        <Box className={classes.containerBox} mx={[0,1]}>
          <Tabs
            value={tabValue} 
            onChange={(e,newTabValue)=>{setTabValue(newTabValue)}} 
            variant="fullWidth"     
          >
            <Tab label={t["PressurePlot"]} {...a11yProps(0)} />
            <Tab label={t["PVPlot"]} {...a11yProps(1)} />
            <Tab label={t["CombinedPlot"]} {...a11yProps(2)} />
            <Tab label={t["LogPlot"]} {...a11yProps(3)} />
          </Tabs>
          <SwipeableViews index={tabValue} onChangeIndex={index=>{setTabValue(index)}}>
            <TabPanel value={tabValue} index={0} sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
              <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[1,2], pt:2}}>
                <RealTimeChart subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} dataTypes={pressureDataTypes} setDataTypes={setPressureDataTypes}/>
              </Box>
            </TabPanel>
            <TabPanel value={tabValue} index={1} sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
              <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[1,2], pt:2}}>
                <PVPlot subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} dataTypes={pvDataTypes} setDataTypes={setPvDataTypes}/>
              </Box>
            </TabPanel>
            <TabPanel value={tabValue} index={2} sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
              <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[1,2], pt:2}}>
                <CombinedChart subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} dataTypes={combinedData} setDataTypes={setCombinedData}/>
              </Box>
            </TabPanel>            
            <TabPanel value={tabValue} index={3} sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
              <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[1,2], pt:2}}>
                <LogPlot subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} setSpeed={setSpeed} setHdps={setHdps} getHdps ={getHdps}/>
              </Box>
            </TabPanel>
          </SwipeableViews>
          <OutputPanel subscribe={subscribe} unsubscribe={unsubscribe} dataTypes={outputDataTypes}  getHdps = {getHdps} />
          <Box sx={{display: { xs: 'block', md: 'none' }}}>
            {tabValue != 3 && <PlaySpeedButtons setIsPlaying={setIsPlaying} isPlaying={isPlaying} setSpeed={setSpeed}/>}
          </Box>
        </Box>
      </Grid>
    </Grid>
  </>
  )
}

export default App