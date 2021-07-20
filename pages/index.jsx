import React, { useRef, useState, useEffect, useLayoutEffect, useCallback} from 'react'
import {Box, Button,CircularProgress, Grid, CssBaseline, IconButton, ButtonBase, Stack, Typography, Tab,Tabs} from '@material-ui/core'
// import {TabContext, TabList, TabPanel} from '@material-ui/lab'
import SwipeableViews from 'react-swipeable-views';
import {Menu, KeyboardArrowLeft,KeyboardArrowRight} from "@material-ui/icons";
import { Root, Header, EdgeSidebar,EdgeTrigger,Content, Footer, SidebarContent } from "@mui-treasury/layout";
import {usePvLoop} from '../src/hooks/usePvLoop'
import RealTimeChart from '../src/components/RealTimeChart'
import PVPlot from '../src/components/PVPlot'
import PlaySpeedButtons from '../src/components/PlaySpeedButtons'
import { makeStyles } from '@material-ui/styles';
import { useRouter } from 'next/router'
import en from '../src/locales/en'
import ja from '../src/locales/ja'

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

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}


const App = () => {
  const classes = useStyles();
  const {locale} = useRouter()
  const t = locale==='en' ? en : ja
  const [tabValue, setTabValue] = useState(0);
  const {subscribe,unsubscribe ,isPlaying,setIsPlaying, setHemodynamicProps, setSpeed} = usePvLoop()

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
                    <RealTimeChart subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} initialDataTypes={['Plv', 'Pla', 'AoP']}/>
                  </Box>
                </TabPanel>
                <TabPanel value={tabValue} index={1} sx={{p:0}}>
                  <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[1,2], pt:2}}>
                    <PVPlot subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} initialDataTypes={['LV', 'LA']}/>
                  </Box>
                </TabPanel>
              </SwipeableViews>
              <PlaySpeedButtons setIsPlaying={setIsPlaying} isPlaying={isPlaying} setSpeed={setSpeed}/>
            </Grid>
          </Grid>
        </Box>
      </Content>
    </Root>    
  )
}

export default App