import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, CircularProgress, Button} from '@material-ui/core'
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {FiberManualRecord,MoreVert, ExpandLess,ExpandMore} from "@material-ui/icons"
import {LightTheme, COLORS, ALPHA_COLORS} from '../styles/chartConstants'
import { useRouter } from 'next/router'
import en from '../locales/en'
import ja from '../locales/ja'


const TIME_WINDOW = 6000
const TIME_WINDOW_GAP = 200
const pressureTypes = ['AoP','Pla','Plv','PAP','Pra','Prv']

const getTimeSeriesFn = ({ 
  Rcs,Rcp,Ras,Rvs,Rap,Rvp,Ras_prox,Rap_prox,Rmv,Rtv,Cas,Cvs,Cap,Cvp,Cas_prox,Cap_prox,
  LV_Ees,LV_V0,LV_alpha,LV_beta,LV_Tmax,LV_tau,LV_AV_delay,
  LA_Ees,LA_V0,LA_alpha,LA_beta,LA_Tmax,LA_tau,LA_AV_delay,
  RV_Ees,RV_V0,RV_alpha,RV_beta,RV_Tmax,RV_tau,RV_AV_delay,
  RA_Ees,RA_V0,RA_alpha,RA_beta,RA_Tmax,RA_tau,RA_AV_delay,HR,
  Ravs, Ravr, Rmvr, Rmvs, Rpvr, Rpvs, Rtvr, Rtvs,
}) => {
  const Plv = x => x['Plv']
  const Pla = x => x['Pla']
  const Prv = x => x['Prv']
  const Pra = x => x['Pra']
  const Iasp = x => x['Iasp']
  const Iapp = x=> x['Iapp']
  const AoP = x => x['AoP']
  const PAP = x=>x['PAP']
  return {Plv, Pla, Prv, Pra, Iasp,Iapp, AoP, PAP}
}

SciChartSurface.setRuntimeLicenseKey("c9732f146520765916c20eaa0ad423d6da78fb8f");

const RealTimeChart = React.memo(({subscribe,unsubscribe, setIsPlaying,isPlaying, dataTypes,setDataTypes}) =>{
  const {locale} = useRouter()
  const t = locale==='en' ? en : ja
  const [loading, setLoading] = useState(true);
  const [sciChartSurface, setSciChartSurface] = useState();
  const dataRef = useRef({})
  const fastLineSeriesRef = useRef({})
  const sciChartSurfaceRef = useRef();
  const wasmContextRef = useRef();
  const subscriptionIdRef = useRef();
  const changingRef = useRef(null);
  const usedColorsRef = useRef([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [pressureMenuOpen, setPressureMenuOpen] = useState(dataTypes.some(x=> pressureTypes.includes(x)));



  const addDataSeries = (dataType)=>{
    const colorIndex = [...COLORS.keys()].find(i=>!usedColorsRef.current.includes(i))
    usedColorsRef.current.push(colorIndex)
    for(let j=0; j<2; j++){
      (dataRef.current[dataType] || (dataRef.current[dataType]=[]))[j] = new XyDataSeries(wasmContextRef.current);
      const fastLineSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
        stroke: COLORS[colorIndex],
        strokeThickness: 3,
        dataSeries: dataRef.current[dataType][j]
      })
      fastLineSeriesRef.current[dataType] = fastLineSeriesRef.current[dataType] ? [...fastLineSeriesRef.current[dataType], fastLineSeries] : [fastLineSeries]
      sciChartSurfaceRef.current.renderableSeries.add(fastLineSeries)
    }
  }

  const initSciChart = async () => {
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(
      "scichart-root"
    );
    sciChartSurfaceRef.current = sciChartSurface
    wasmContextRef.current = wasmContext
    sciChartSurface.applyTheme(LightTheme)
    const xAxis = new NumericAxis(wasmContext,{autoRange: EAutoRange.Never,visibleRange:new NumberRange(0, TIME_WINDOW), drawLabels:false,drawMinorTickLines:false});
    const yAxis = new NumericAxis(wasmContext,{axisAlignment: EAxisAlignment.Left,autoRange: EAutoRange.Always,drawMinorTickLines:false});
    xAxis.drawMajorGridLines =false;
    xAxis.drawMinorGridLines =false;
    yAxis.drawMinorGridLines =false;    
    yAxis.axisBorder = {
      borderRight: 1,
      color: "#e5e5e5"
    };
    yAxis.growBy = new NumberRange(0.1, 0.05);
    yAxis.labelProvider.formatLabel = (dataValue => dataValue?.toFixed(0))
    sciChartSurface.xAxes.add(xAxis);
    sciChartSurface.yAxes.add(yAxis);

    for(let i=0; i<dataTypes.length; i++){
      const dataType = dataTypes[i]
      addDataSeries(dataType)
    }
    sciChartSurface.zoomExtents();
    return {sciChartSurface,wasmContext}
  }  
  const update = (data, time, hdprops) => {
    const newTime = time % TIME_WINDOW
    const _time = data['t']?.map(x=>x%TIME_WINDOW)
    for(let i=0; i<dataTypes.length; i++){
      const dataType = dataTypes[i]
      const dataSeries = dataRef.current[dataType]
      const _data = getTimeSeriesFn(hdprops)[dataType](data)
      const j = time % (TIME_WINDOW * 2) < TIME_WINDOW ? 0 : 1;
      const k = j ? 0 : 1;
      dataSeries[j].appendRange(_time, _data)
      const indiceRange1 = dataSeries[j].getIndicesRange(new NumberRange(newTime, TIME_WINDOW))
      if(indiceRange1.max - indiceRange1.min > 0){
        dataSeries[j].removeRange(indiceRange1.min, indiceRange1.max - indiceRange1.min)
      }
      const indiceRange2 = dataSeries[k].getIndicesRange(new NumberRange(0,newTime+TIME_WINDOW_GAP))
      if(indiceRange2.max - indiceRange2.min > 0){
        dataSeries[k].removeRange(indiceRange2.min, indiceRange2.max - indiceRange2.min)
      }
    }
  }  

  const clickMenuItem = (index) => e => {
    changingRef.current = isPlaying ? 'start' : 'stop';
    setIsPlaying(false)
    unsubscribe(subscriptionIdRef.current)
    if(dataTypes.includes(pressureTypes[index])){
      [0,1].forEach(i=>{dataRef.current[pressureTypes[index]][i].delete()});
      delete dataRef.current[pressureTypes[index]];
      [0,1].forEach(i=>{sciChartSurfaceRef.current.renderableSeries.remove(fastLineSeriesRef.current[pressureTypes[index]][i])});
      delete fastLineSeriesRef.current[pressureTypes[index]];
      usedColorsRef.current.splice(dataTypes.findIndex(x=>x==pressureTypes[index]),1);
      setDataTypes(prev => prev.filter(x=>x!=pressureTypes[index]));
    }else{
      setDataTypes(prev => [...prev,pressureTypes[index]])
      addDataSeries(pressureTypes[index])
    }
  }

  useEffect(() => {
    if(dataTypes.length >0 && changingRef.current != null){
      unsubscribe(subscriptionIdRef.current)
      subscriptionIdRef.current = subscribe(update)
      if(changingRef.current == 'start'){setIsPlaying(true)}
      changingRef.current = null
    }
  }, [dataTypes]);

  useEffect(() => {
    (async ()=>{
      const res = await initSciChart()
      setSciChartSurface(res.SciChartSurface)
      subscriptionIdRef.current = subscribe(update)
      // setIsPlaying(true)
      if(res){
        setLoading(false)
      }
    })();
    return ()=>{
      unsubscribe(subscriptionIdRef.current)
      Object.values(dataRef.current).forEach(d=>{
        d[0].delete();
        d[1].delete();
      })
      sciChartSurface?.delete()
    }
  }, []);

  return <>
    <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{position: 'relative',backgroundColor:'white', p:[0.5,2],pb:0, pt:2, mb:-2}}>
      <Box width={1} style={{opacity: loading ? 0 : 1}}>
        <Grid container alignItems='center'>
          <Grid item container xs={10} md={11} spacing={1} justifyContent='flex-start' display='flex' sx={{pl:2}}>
            {dataTypes.map((dataType,i)=>(
              <Grid item justifyContent='center' alignItems='center' display='flex' key={dataType} style={{marginBottom:'-4px'}}> 
                <FiberManualRecord sx={{color:COLORS[usedColorsRef.current[i]]}} />
                <Typography variant='caption' noWrap>{t[dataType]}</Typography>
              </Grid>
            ))}
          </Grid>
          <Grid item xs={2} md={1} justifyContent='center' display='flex'>
            <IconButton aria-controls='ts-menu' aria-haspopup= {true} onClick={e=>setAnchorEl(e.currentTarget)} style={{zIndex:100, marginBottom:'-8px'}} size='small'>
              <MoreVert/>
            </IconButton>
          </Grid>
          <Menu id="ts-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={()=>setAnchorEl(null)}>
            <ListItemButton onClick={()=>{setPressureMenuOpen(prev=>!prev)}}>
              <ListItemText primary="Pressure" />
              {pressureMenuOpen ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>          
            <Collapse in={pressureMenuOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {pressureTypes.map((pType,index)=>(
                  <MenuItem key={pType} onClick={clickMenuItem(index)} >
                    <Checkbox checked ={dataTypes.includes(pType)} color='primary' />
                    <ListItemText>{t[pType]}</ListItemText>
                  </MenuItem>              
                ))}
              </List>
            </Collapse>
          </Menu>
        </Grid>
        <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%',aspectRatio: '2 / 1'}}>
          <div id="scichart-root" style={{width: '100%',height:'100%'}}></div>
        </Box>
      </Box>
      <Box sx={{display: loading? 'block': 'none', zIndex:100, position: 'absolute'}}>
        <CircularProgress/>
      </Box>
    </Box>

  </>
})

export default RealTimeChart


// import CCapture from '@/../ccapture.js-npmfixed/src/CCapture'

// const startRecording = () => {
//   console.log(shouldRecord.current)
//   shouldRecord.current = true
//   console.log(shouldRecord.current)
// }
// const stopRecording = () =>{
//   setShouldRecord(false);
//   setIsRecording(false);
//   shouldRecord.current = false
//   isRecording.current = false
//   capturer.current.stop();
//   capturer.current.save((blob) => {
//     const fileURL = window.URL.createObjectURL(blob)
//     const tempLink = document.createElement('a')
//     tempLink.href = fileURL
//     tempLink.setAttribute('download', `${filename}.${getExtension(format)}`)
//     tempLink.click()
//   });
// }

//<Box width={1}>
//{isRecording ? <Button onClick={()=>{stopRecording()}}>Stop</Button> : <Button onClick={()=>{startRecording()}}>Save</Button>}
//</Box> 

// console.log(shouldRecord.current, isRecording.current)
// if(shouldRecord.current && !isRecording.current){
//   isRecording.current = true
//   capturer.current.start();
// }
// if(isRecording.current){
//   capturer.current.capture(sciChartDomRef.current.children[0]);
// }

// const capturer = useRef(new CCapture( { format: 'webm',framerate: 24, verbose: true}));
// const isRecording = useRef(false);
// const shouldRecord = useRef(false);

// const sciChartDomRef = useRef();