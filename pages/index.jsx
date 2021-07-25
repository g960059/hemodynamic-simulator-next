import React, { useRef, useState, useEffect, useLayoutEffect, useCallback} from 'react'
import {Box, Button,CircularProgress, Grid, CssBaseline, IconButton, ButtonBase, Stack, Typography, Tab,Tabs} from '@material-ui/core'
// import {TabContext, TabList, TabPanel} from '@material-ui/lab'
import SwipeableViews from 'react-swipeable-views';
import {Menu, KeyboardArrowLeft,KeyboardArrowRight} from "@material-ui/icons";
import { Root, Header, EdgeSidebar,EdgeTrigger,Content, Footer, SidebarContent } from "@mui-treasury/layout";
import {usePvLoop} from '../src/hooks/usePvLoop'

import PVPlot from '../src/components/PVPlot'
import PlaySpeedButtons from '../src/components/PlaySpeedButtons'
import {a11yProps, TabPanel} from '../src/components/TabUtils'
import { makeStyles } from '@material-ui/styles';
import {useTranslation} from '../src/hooks/useTranslation'
import RealTimeChart from '../src/components/RealTimeChart'
import OutputPanel from '../src/components/OutputPanel'
import BasicController from '../src/components/controllers/BasicController'
// import dynamic from 'next/dynamic'
// const RealTimeChart =  dynamic(()=>import('../src/components/RealTimeChart'), { ssr: false })

const useStyles = makeStyles((theme) =>({
    background: {
      position: "fixed",
      zIndex: -1,
      top: "0px",
      left: "0px",
      width: "100%",
      overflow: "hidden",
      transform: "translate3d(0px, 0px, 0px)",
      height: "-webkit-fill-available",
      background: "radial-gradient(50% 50% at 50% 50%, rgb(255, 0, 122) 0%, rgb(247, 248, 250) 100%)",
      opacity: 0.15,
      userSelect: "none",
      pointerEvents: "none"
    },
  }),
);


const App = () => {
  const classes = useStyles();
  const t = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const {subscribe,unsubscribe ,isPlaying,setIsPlaying, setHdps, getHdps, setSpeed} = usePvLoop()
  const [pressureDataTypes, setPressureDataTypes] = useState(['Plv', 'Pla', 'AoP']);
  const [pvDataTypes, setPvDataTypes] = useState(['LV', 'LA']);
  const [outputDataTypes, setOutputDataTypes] = useState(['AoP','PAP','CVP','SV','CO','PCWP']);
  return (
    <Root
      scheme={{
        header: {
          config: {
            xs: {
              position: "sticky",
              height: 56,
            },
            md: {
              position: "relative",
              height: 64,
            },
          },
        },
        leftEdgeSidebar: {
          config: {
            xs: {
              variant: "temporary",
              width: "auto",
            },
            md: {
              variant: "permanent",
              width: 256,
              collapsible: true,
              collapsedWidth: 64,
            },
          },
        },
      }}
    >
      <CssBaseline/>
      <Header>
        <Box
          sx={{ flex: 1, display: "flex", alignItems: "center", px: 2, gap: 1 }}
        >
          <EdgeTrigger target={{ anchor: "left", field: "open" }}>
            {(open, setOpen) => (
              <IconButton onClick={() => setOpen(!open)}>
                {open ? <KeyboardArrowLeft /> : <Menu />}
              </IconButton>
            )}
          </EdgeTrigger>
          Header
        </Box>
      </Header>
      <EdgeSidebar anchor="left">
        <SidebarContent>Sidebar Content</SidebarContent>
        <EdgeTrigger target={{ anchor: "left", field: "collapsed" }}>
          {(collapsed, setCollapsed) => (
            <ButtonBase
              onClick={() => setCollapsed(!collapsed)}
              sx={{
                minHeight: 40,
                width: "100%",
                bgcolor: "grey.100",
                borderTop: "1px solid",
                borderColor: "grey.200",
              }}
            >
              {collapsed ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            </ButtonBase>
          )}
        </EdgeTrigger>        
      </EdgeSidebar>
      <Content>
        <Box className={classes.background}></Box>   
        <Box>
          <Grid container>
            <Grid item xs={12} md={8}>
              <Tabs
                value={tabValue} 
                onChange={(e,newTabValue)=>{setTabValue(newTabValue)}} 
                variant="fullWidth"
                sx={{backgroundColor:'white'}}       
              >
                <Tab label={t["PressurePlot"]} {...a11yProps(0)} />
                <Tab label={t["PVPlot"]} {...a11yProps(1)} />
              </Tabs>
              <SwipeableViews index={tabValue} onChangeIndex={index=>{setTabValue(index)}}>
                <TabPanel value={tabValue} index={0} sx={{p:0}}>
                  <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[1,2], pt:2}}>
                    <RealTimeChart subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} dataTypes={pressureDataTypes} setDataTypes={setPressureDataTypes}/>
                  </Box>
                </TabPanel>
                <TabPanel value={tabValue} index={1} sx={{p:0}}>
                  <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[1,2], pt:2}}>
                    <PVPlot subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} dataTypes={pvDataTypes} setDataTypes={setPvDataTypes}/>
                  </Box>
                </TabPanel>
              </SwipeableViews>
              {/* <OutputPanel subscribe={subscribe} unsubscribe={unsubscribe} dataTypes={outputDataTypes} setDataTypes={setOutputDataTypes} getHdps = {getHdps} /> */}
              <PlaySpeedButtons setIsPlaying={setIsPlaying} isPlaying={isPlaying} setSpeed={setSpeed}/>
            </Grid>
            <Grid item xs={12}>
              <BasicController getHdps={getHdps} setHdps={setHdps}/>
            </Grid>
          </Grid>
        </Box>
      </Content>
    </Root>    
  )
}

export default App