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
import ControllerList from '../src/components/controllers/ControllerList'
import CombinedChart from '../src/components/combined/CombinedChart'
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import {DEFAULT_DATA, DEFAULT_TIME, DEFAULT_HEMODYANMIC_PROPS} from "../src/utils/presets"
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import {auth, app} from '../src/utils/firebase'

SciChartSurface.setRuntimeLicenseKey("KR5N3CyL70B+EbXcZJIpweBbe500KgJgn5PfMpZRvcTJ0zvJXCf0mHUAA2Jyk4XKQihQcwQOsBZ+H9ezbPM2FKVZQAeJLgeN+8IH8DHeXUy1DK/XVuDvnGT9Yq4iCJXIsVV52I1zvc1zBF1jN9uOcp28U3nBJkmtgq/oE0fWRUP2fb/wSMkZF82/vbPkj7QfipRJVeSXXmP5tijA2ySVJ71aLigfWyWZEN06LIF1CQzfbeUnB6O1iKKje4QJLmQ0JqAqHZpwVhSlNfUBVahRfTgWDn/YTCHkp4ISJigJi1HKXXvNJdkC/Df0esTBUrdqmIQw8M6PZPOA3bl98GgtckXBzcXWIUJd5My6vc2AI7oh8eFSSI7LTkppc8CUyPHxWgiqNYlnsh5qXnk4crpQKfverE20iLLqzva58tJyMXf3RvMY+YKuP6cXoWS8b79PqoInMVkBgOHQii8kvXAAdS5UQyfy91QplXNMon2iztAzKA1X+QPrD/IQyZbiPVBk0d+eQRnrIqpOO7jdwR/mhzjUSF4ePG9ixpd7Xq+VqymP0HwgX/JEqKwq4pLZk3fp4TjMsGsH5F8b3hCdu6sPb3O6qBjcwyb99PCXtahTNA4h2+q1iQoSTMhwWy6SIvzC5zhWFFZKbb2V+AWIMUe8gKvmNU+O1ScT93WuIZFgckabmmeXX47noSpY+uU+ynxHnSX6RQq4p1+qSD7C6QWbDkXFK8NcGMyNpGT9RMvINYqqnG4Y3+H91GJFWzXcnFJ780i8GhLNt7oF");

const useStyles = makeStyles((theme) =>(
  {
    containerBox: {
      overflow: 'hidden',
      overflowY: 'scroll',
      height: `auto`,
      [theme.breakpoints.up('md')]: {
        height: `calc(100vh - 56px)`,
      },
    },
    subContainerBox: {
      overflow: 'hidden',
      overflowY: 'scroll',
      height: `auto`,
      [theme.breakpoints.up('md')]: {
        maxHeight : `calc(100vh - 174px)`,
      },
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
  const [mode, setMode] = useState("basic");
  const [user, loading, error] = useAuthState(auth);

  return (
    <> 
    <Grid container justifyContent='center' spacing={[0,1]}>
      <Grid item xs={12} md={5} lg={4} justifyContent='center' sx={{order:[1,1,0]}}>
        <Box className={classes.containerBox} mx={[0,1]}>
          <Box className={classes.subContainerBox}>
            <BasicController getHdps={getHdps} setHdps={setHdps} InitialHdps={DEFAULT_HEMODYANMIC_PROPS} mode={mode}/>
            {/* <ControllerList getHdps={getHdps} setHdps={setHdps}/> */}
          </Box>
          <Box sx={{display: { xs: 'none', md: 'block' }, mt:2}}>
            {tabValue != 3 && <PlaySpeedButtons setIsPlaying={setIsPlaying} isPlaying={isPlaying} setSpeed={setSpeed} mode={mode} setMode={setMode}/>}        
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
            {/* <Tab label={t["LogPlot"]} {...a11yProps(3)} /> */}
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
            {/* <TabPanel value={tabValue} index={3} sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
              <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[1,2], pt:2}}>
                <LogPlot subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} setSpeed={setSpeed} setHdps={setHdps} getHdps ={getHdps}/>
              </Box>
            </TabPanel> */}
          </SwipeableViews>
          <OutputPanel subscribe={subscribe} unsubscribe={unsubscribe} dataTypes={outputDataTypes}  getHdps = {getHdps} />
          <Box sx={{display: { xs: 'block', md: 'none' }}}>
            {tabValue != 3 && <PlaySpeedButtons setIsPlaying={setIsPlaying} isPlaying={isPlaying} setSpeed={setSpeed} mode={mode} setMode={setMode}/>}
          </Box>
        </Box>
      </Grid>
    </Grid>
  </>
  )
}

export default App