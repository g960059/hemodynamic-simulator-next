import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, IconButton,MenuList,ListItemIcon, CircularProgress, Button} from '@mui/material'
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { chartBuilder } from "scichart/Builder/chartBuilder";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import { EAxisType } from "scichart/types/AxisType";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {NumericLabelProvider} from "scichart/Charting/Visuals/Axis/LabelProvider/NumericLabelProvider";
import {FiberManualRecord,MoreVert,Check} from "@mui/icons-material"
import {LightTheme, COLORS, ALPHA_COLORS} from '../styles/chartConstants'
import { useTranslation } from '../hooks/useTranslation';


const TIME_WINDOW = 6000
const TIME_WINDOW_GAP = 300
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

SciChartSurface.setRuntimeLicenseKey("nac2rMGjekVDJ0tcaayVGckXXaozKTVvSIfVhuk9ywdbBc7oiXADBXZCkajSv4FzWFHCNM81JrsbXRh3k8Z4sBxRn5pVsAD6WK88b26kWQhwzdEhGwl5QgcLwSLGgGbz/EENeIEB4hA6H58o49zmciynUP+46AeDzbW3lI0sFqFygtr3NZ2WPk/d1wiTPX8QYDvczs71ywybTo3eSpMsBrq1jNv+VZ+C9y0Mbg2/svmB3jIx0t5MJKcJock7T6dcRgKJuL9iq3dQTchtO3/UNxwHPvAUa48Lfmlq3bksy0YDRfaIdqWs2lL8liEApipL9OW+lQXdvK1Pj3qT0mIOjWO3ysJRa5SCL7iT+Vq1tT9S8GCvzh6UeBctJAQ1iKtd3GeSE7lsN3jYpilkyLYj83aawtsspyiniAl8uQI2whJLHikoyCUkaDQMuCfRLSsZ0ZyFqEJyK5Uft5ia3ISpUC9jJi/07Vubwai6FAonxiZyUFIFKRWt/hIX4n4ExQ2SfYTgsV1M9CbvuZ3S4IuATSOJXR9jbU7VOuHswfrakcASDuECPs74kBgZ5WR8Gg2rz4/aMo0MBFkP0LPCrB9daGCizpg0uozv0TGc0karwwhgRmNpbY6RJoy0hviQbSyVGoovB7SuhjaKMaHdNIhJmAFf6gAlmQ0M/rsBFVK13J/7RlqofsGfAr66Ez6pxUlEezibkyx9tdH2D/fLhiuDgRRaQmPXsUEn4jzFq6hpch5h2rq+DLaF");

const RealTimeChart = React.memo(({subscribe,unsubscribe, setIsPlaying,isPlaying, dataTypes,setDataTypes}) =>{
  const t = useTranslation();
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
    const { sciChartSurface, wasmContext } = await chartBuilder.buildChart("scichart-root", {
      xAxes: {
        type: EAxisType.NumericAxis,
        options: {
          autoRange: EAutoRange.Never,
          visibleRange:new NumberRange(0, TIME_WINDOW), 
          drawLabels:false,
          drawMinorTickLines:false,
          drawMajorGridLines: false,
          drawMinorGridLines: false,
        }
      },      
      yAxes: {
        type: EAxisType.NumericAxis,
        options: {
          axisAlignment: EAxisAlignment.Left,
          autoRange: EAutoRange.Always,
          drawMinorTickLines:false, 
          drawMinorGridLines: false,
          axisBorder: {
            borderRight: 1,
            color: "#e5e5e5"
          },
          growBy: new NumberRange(0.1,0.05),
          labelProvider: new NumericLabelProvider({
            labelPrecision: 1,
          }) 
        }
      },
    });        
    sciChartSurfaceRef.current = sciChartSurface
    wasmContextRef.current = wasmContext
    sciChartSurface.applyTheme(LightTheme)

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
    const startTime = _time[0]
    const endTime = _time[_time.length-1]
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
      const indiceRange2 = dataSeries[k].getIndicesRange(new NumberRange(startTime,endTime+TIME_WINDOW_GAP))
      if(indiceRange2.max - indiceRange2.min > 0){
        dataSeries[k].removeRange(indiceRange2.min, indiceRange2.max-indiceRange2.min+1)
        // for(let l = indiceRange2.min; l <= indiceRange2.max; l++){
          // dataSeries[k].update(l,NaN)
        // }
      }
      if(TIME_WINDOW - newTime < 200){
        dataSeries[k].clear()
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
      changingRef.current = isPlaying ? 'start' : 'stop';
      const res = await initSciChart()
      setSciChartSurface(res.SciChartSurface)
      subscriptionIdRef.current = subscribe(update)
      if(changingRef.current == 'start'){setIsPlaying(true)}
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
          <Grid item container xs={9} md={9} spacing={1} justifyContent='flex-start' display='flex' sx={{pl:2}}>
            {dataTypes.map((dataType,i)=>(
              <Grid item justifyContent='center' alignItems='center' display='flex' key={dataType} style={{marginBottom:'-4px'}}> 
                <FiberManualRecord sx={{color:COLORS[usedColorsRef.current[i]]}} />
                <Typography variant='subtitle2' noWrap>{t[dataType]}</Typography>
              </Grid>
            ))}
          </Grid>
          <Grid item xs={3} md={3} justifyContent='flex-end' display='flex'>
            <Button size='small' variant='outlined' onClick={e=>setAnchorEl(e.currentTarget)} sx={{mr:1}}>
              {t["ChangePVloopItmes"]}
            </Button>
          </Grid>
          <Menu id="ts-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={()=>setAnchorEl(null)} MenuListProps={{variant:'menu', dense:true}}>       
            {pressureTypes.map((pType,index)=>(
              <MenuItem key={pType} onClick={clickMenuItem(index)} >
                {dataTypes.includes(pType) ? <><ListItemIcon><Check/></ListItemIcon>{t[pType]}</> : <ListItemText inset >{t[pType]}</ListItemText> }
              </MenuItem>              
            ))}
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