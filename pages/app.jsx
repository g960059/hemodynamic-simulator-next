// import React, {useRef, useState, useEffect} from 'react'
// import {Box,Typography,Grid,Tab,Tabs, Divider,AppBar, Toolbar,Button,IconButton,Stack} from '@mui/material'
// import {ArrowBack,Add} from '@mui/icons-material';
// import SwipeableViews from 'react-swipeable-views';
// import {usePatient, user$,patients$,selectedPatient$,patientsRef$,userRef$} from '../src/hooks/usePvLoop'
// import { useRouter } from 'next/router'
// import PlaySpeedButtons from '../src/components/PlaySpeedButtons'
// import {a11yProps, TabPanel} from '../src/components/TabUtils'
// import { makeStyles } from '@mui/styles';
// import {useTranslation} from '../src/hooks/useTranslation'
// import OutputPanel from '../src/components/OutputPanel'
// import ControllerPanel from '../src/components/controllers/ControllerPanel'

// import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
// import dynamic from 'next/dynamic'
// import { NextSeo } from 'next-seo';
// import Sticky from 'react-stickynode';
// import {useObservable} from "reactfire"

// const RealTimeChart = dynamic(()=>import('../src/components/RealTimeChart'), {ssr: false});
// const PVPlot = dynamic(()=>import('../src/components/PVPlot'), {ssr: false,});
// const CombinedChart = dynamic(()=>import('../src/components/combined/CombinedChart'), {ssr: false,});

// SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY);

// const useStyles = makeStyles((theme) =>(
//   {
//     containerBox: {
//       overflow: 'hidden',
//       overflowY: 'scroll',
//       height: `auto`,
//       [theme.breakpoints.up('md')]: {
//         height: `calc(100vh - 56px)`,
//       },
//     },
//     subContainerBox: {
//       overflow: 'hidden',
//       overflowY: 'scroll',
//       height: `auto`,
//       [theme.breakpoints.up('md')]: {
//         maxHeight : `calc(100vh - 174px)`,
//       },
//     },
//     appBar: {
//       [theme.breakpoints.up('xs')]: {
//         backgroundColor: 'transparent',
//         color: 'inherit'
//       },
//     },
//     appBarRoot: {
//       [theme.breakpoints.up('xs')]: {
//         backgroundColor: 'transparent',
//         color: 'inherit'
//       },
//       boxShadow: "rgba(31, 25, 60, 0.1) 0px 0px 8px",
//     },
//     background: {
//       position: "fixed",
//       zIndex: -1,
//       top: "0px",
//       left: "0px",
//       width: "100%",
//       overflow: "hidden",
//       transform: "translate3d(0px, 0px, 0px)",
//       height: "-webkit-fill-available",
//       background: "radial-gradient(50% 50% at 50% 50%, rgb(255, 0, 122) 0%, rgb(247, 248, 250) 100%)",
//       opacity: 0.15,
//       userSelect: "none",
//       pointerEvents: "none"
//     },
//     neumoButton: {
//       transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
//       color: "rgb(69, 90, 100)",
//       boxShadow: "0 2px 4px -2px #21253840",
//       backgroundColor: "white",
//       border: "1px solid rgba(92, 147, 187, 0.17)",
//       fontWeight:"bold",
//       "&:hover":{
//         backgroundColor: "rgba(239, 246, 251, 0.6)",
//         borderColor: "rgb(207, 220, 230)"
//       }
//     },    
//   })
// );

// const loadCase = id => {

// }
// class Case {
//   update(){
    
//   }
//   delete(){

//   }
// }

const App = ()=>{
  return <div></div>
}

// const App = React.memo(() => {
//   const classes = useStyles();
//   const t = useTranslation();
//   const router = useRouter()
//   const [tabValue, setTabValue] = useState(0);


//   const patient = usePatient();

//   const [pressureDataTypes, setPressureDataTypes] = useState(['Plv', 'Pla', 'AoP']);
//   const [pvDataTypes, setPvDataTypes] = useState(['LV', 'LA']);
//   const [combinedData, setCombinedData] = useState(['RA']);
//   const [outputDataTypes, setOutputDataTypes] = useState(['AoP','PAP','CVP','SV','CO','PCWP']);
//   const [mode, setMode] = useState("basic");
  

//   return <>
//       <AppBar position="static" elevation={0} className={classes.appBar} classes={{root:classes.appBarRoot}}>
//         <Toolbar>
//           <Box onClick={()=>{router.push("/cases")}} sx={{cursor:"pointer",fontFamily: "GT Haptik Regular" ,fontWeight: 'bold',display:"flex",ml:{xs:0,md:2}}}>
//             <IconButton><ArrowBack/></IconButton>
//           </Box>
//           <Typography variant="h4" fontWeight="bold" sx={{ml:2}}>Case1</Typography>
//           <div style={{flexGrow:1}}/>
//           <Button variant="contained" disableElevation sx={{fontWeight: 'bold',mr:2}}>保存する</Button>
//         </Toolbar>
//       </AppBar>   
//       <NextSeo title={t["Simulator"]}/>
//       <Box className={classes.background}/>
//       <Grid container justifyContent='center' spacing={[0,1]}>
//         <Grid item xs={12} md={5} lg={4} justifyContent='center' sx={{order:[1,1,0]}}>
//           <Box className={classes.containerBox} mx={[0,1]}>
//             <Box className={classes.subContainerBox}>
//               <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mx:2,mt:{xs:1,md:2}}}>
//                 <Typography variant={"h4"} color="secondary">Patients</Typography>
//                 <Button startIcon={<Add/>} variant='contained' disableElevation className={classes.neumoButton}>比較</Button>
//               </Stack>
//               <ControllerPanel patient={patient} mode={mode}/>
//             </Box>
//             <Box sx={{display: { xs: 'none', md: 'block' }, mt:2}}>
//               {tabValue != 3 && <PlaySpeedButtons patient={patient} mode={mode} setMode={setMode}/>}        
//             </Box>
//           </Box>
//           <Divider orientation="vertical" flexItem xs={{display: { xs: 'none', md: 'block' }}}/>
//         </Grid>
//         <Grid item xs={12} md={7} lg={7} sx={{order:[0,0,1]}} >
//           <Box className={classes.containerBox} mx={[0,1]} mt={[0,1]} sx={{"& .sticky-outer-wrapper.active .sticky-inner-wrapper":{boxShadow: "rgb(0 10 60 / 20%) 0px 3px 6px -2px"}}}>
//             <Tabs
//               value={tabValue} 
//               onChange={(e,newTabValue)=>{setTabValue(newTabValue)}} 
//               textColor="secondary"
//               indicatorColor="secondary"
//               sx={{mx:2, "& .Mui-selected":{fontWeight:"bold", color:"#484848 !important"}}}
//             >
//               <Tab label={t["PressurePlot"]} {...a11yProps(0)} />
//               <Tab label={t["PVPlot"]} {...a11yProps(1)} />
//               <Tab label={t["CombinedPlot"]} {...a11yProps(2)} />
//               {/* <Tab label={t["LogPlot"]} {...a11yProps(3)} /> */}
//             </Tabs>
//             <Sticky enabled={true} innerZ={100} >
//               <SwipeableViews index={tabValue} onChangeIndex={index=>{setTabValue(index)}} >
//                 <TabPanel value={tabValue} index={0} sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
//                   <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[0,2],pt:[1,2],mb:1.5}}>
//                     <RealTimeChart patient={patient} dataTypes={pressureDataTypes} setDataTypes={setPressureDataTypes}/>
//                   </Box>
//                 </TabPanel>
//                 <TabPanel value={tabValue} index={1} sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
//                   <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[0,2],pt:[1,2],mb:1.5}}>
//                     <PVPlot patient={patient} dataTypes={pvDataTypes} setDataTypes={setPvDataTypes}/>
//                   </Box>
//                 </TabPanel>
//                 <TabPanel value={tabValue} index={2} sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
//                   <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[0,2],pt:[1,2],mb:1.5}}>
//                     <CombinedChart patient={patient} dataTypes={combinedData} setDataTypes={setCombinedData}/>
//                   </Box>
//                 </TabPanel>            
//                 {/* <TabPanel value={tabValue} index={3} sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300'}}>
//                   <Box sx={{backgroundColor:'white',boxShadow:'0 2px 4px rgb(67 133 187 / 7%)',borderColor: 'grey.300', p:[1,2], pt:2}}>
//                     <LogPlot subscribe={subscribe} unsubscribe={unsubscribe} setIsPlaying={setIsPlaying} isPlaying={isPlaying} setSpeed={setSpeed} setHdps={setHdps} getHdps ={getHdps}/>
//                   </Box>
//                 </TabPanel> */}
//               </SwipeableViews>
//               <OutputPanel patient={patient} />
//               <Box sx={{display: { xs: 'block', md: 'none' }}}>
//                 {tabValue != 3 && <PlaySpeedButtons patient={patient} mode={mode} setMode={setMode}/>}
//               </Box>
//             </Sticky>
//           </Box>
//         </Grid>
//       </Grid>
//   </>
// })

// export default App

