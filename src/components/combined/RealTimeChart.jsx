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
import {LightTheme, COLORS, ALPHA_COLORS} from '../../styles/chartConstants'
import { useTranslation } from '../../hooks/useTranslation';
import { Thickness } from 'scichart/Core/Thickness';

const TIME_WINDOW = 2000
const TIME_WINDOW_GAP = 200
const pressureTypes = ['LV','LA','RV','RA']

const getTimeSeriesFn = ({ 
  Rcs,Rcp,Ras,Rvs,Rap,Rvp,Ras_prox,Rap_prox,Rmv,Rtv,Cas,Cvs,Cap,Cvp,Cas_prox,Cap_prox,
  LV_Ees,LV_V0,LV_alpha,LV_beta,LV_Tmax,LV_tau,LV_AV_delay,
  LA_Ees,LA_V0,LA_alpha,LA_beta,LA_Tmax,LA_tau,LA_AV_delay,
  RV_Ees,RV_V0,RV_alpha,RV_beta,RV_Tmax,RV_tau,RV_AV_delay,
  RA_Ees,RA_V0,RA_alpha,RA_beta,RA_Tmax,RA_tau,RA_AV_delay,HR,
  Ravs, Ravr, Rmvr, Rmvs, Rpvr, Rpvs, Rtvr, Rtvs,
}) => {
  const LV = x => x['Plv']
  const LA = x => x['Pla']
  const RV = x => x['Prv']
  const RA = x => x['Pra']
  return {LV,LA,RV,RA}
}

SciChartSurface.setRuntimeLicenseKey("huWbZsQPS1xwT/5d4ZX5RzXPo1YdKSolsoHTDGIpnGTJMHTvT9PxmLbG57MPZR9A5ioKcgaTkpJxSI9Jmrhylqtp0onkF0jLC9+ob6gUxuOzRAJ5wQfJLaLprgrVcZCGPXHbnvWFITcp2NKKHn8Ty1/2wGaldBYzfmxtgoOpMvBUcmApFBeZUVkMicPFnUVapiKIev4LFKYthhpPjEQ5I7veQbYAL6FntEP81fMprqDCyfFhuwcdNyj4Ip9djDjW1mWoEMZcgES7cvZGjWEu7lbgJdORwBq4vOX36zB3DhV8ZrwKBMYtVh/KreQQiG5nJFkOlIZHvTSXzuBj2uRD9SGUj3SmpGi6cU7iHTA2ZuLfiQN5Il9AV/25kdaA2k4pqAju6WTCZJbN2l2mqK2/c1xpFQ4pCls59Zi8chYF1npubSmm0wACs3UADGT361i5qlrR117uRdn5a/r17ysWvdhofUUN1AnUilsKuc/E+WlDtRYKLgekjnEHXReBY/WSqgb7MD1U7shW6olCx8G5+evmHumMkuDFCyi5nJtr3G5bdFaDSasPpavkjJYG2iXjsUIYQH7Wbe0J5IIOGcx59iz3/AUAPFazhia9cGUP3ZljrLObQ3v0wK5H+h0v7ZclCv7+QBAJEE4W3tx5zEcUc3LxbESGyseZ0XdYYsfApctLf3RhLnW0c6DylxTKTj79LxCvqc46JH8LvljGmS/0IZBQpZuqvefZDyKDq1fE8P23UzrwKp37");

const RealTimeChart = React.memo(({subscribe,unsubscribe, setIsPlaying,isPlaying, dataTypes,setDataTypes}) =>{
  const t = useTranslation();
  const [loading, setLoading] = useState(true);
  const [sciChartSurface, setSciChartSurface] = useState();
  const dataRef = useRef({})
  const fastLineSeriesRef = useRef({})
  const sciChartSurfaceRef = useRef();

  const annotationDataRef = useRef({})
  const annotationSeriesRef=useRef({})

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
    annotationDataRef.current[dataType] = new XyDataSeries(wasmContextRef.current);
    annotationSeriesRef.current[dataType] = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: ALPHA_COLORS[colorIndex],
      strokeThickness: 2,
      dataSeries: annotationDataRef.current[dataType]
    })
    sciChartSurfaceRef.current.renderableSeries.add(annotationSeriesRef.current[dataType])
  }

  const initSciChart = async () => {
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(
      "scichart-root"
    );
    sciChartSurfaceRef.current = sciChartSurface
    wasmContextRef.current = wasmContext
    sciChartSurface.applyTheme(LightTheme)
    const xAxis = new NumericAxis(wasmContext,{autoRange: EAutoRange.Never,visibleRange:new NumberRange(0, TIME_WINDOW), drawLabels:false,drawMinorTickLines:false});
    const yAxis = new NumericAxis(wasmContext,{axisAlignment: EAxisAlignment.Left,autoRange: EAutoRange.Always,drawMinorTickLines:false, drawLabels:false});
    xAxis.drawMajorGridLines =false;
    xAxis.drawMinorGridLines =false;
    yAxis.drawMinorGridLines =false;    
    yAxis.growBy = new NumberRange(0.1,0.1);
    yAxis.labelProvider.formatLabel = (dataValue => dataValue?.toFixed(0))
    sciChartSurface.xAxes.add(xAxis);
    sciChartSurface.yAxes.add(yAxis);

    // const zeroData = new XyDataSeries(wasmContextRef.current)
    // const zeroSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
    //   stroke: 'white',
    //   strokeThickness: 3,
    //   dataSeries: zeroData
    // })
    // sciChartSurface.renderableSeries.add(zeroSeries)
    // zeroData.append(0,0)

    for(let i=0; i<dataTypes.length; i++){
      const dataType = dataTypes[i]
      addDataSeries(dataType)
    }
    sciChartSurface.zoomExtents();
    sciChartSurface.padding = Thickness.fromNumber(0);
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
      if(TIME_WINDOW - newTime < 200){
        dataSeries[k].clear()
      }
      if(indiceRange2.max - indiceRange2.min > 0){
        // dataSeries[k].removeRange(indiceRange2.min, indiceRange2.max - indiceRange2.min + 1)
        for(let l = indiceRange2.min; l <= indiceRange2.max; l++){
          dataSeries[k].update(l,NaN)
        }
      }
      const lastIndex = _time.length-1
      annotationDataRef.current[dataType].clear()
      annotationDataRef.current[dataType].appendRange([0,_time[lastIndex]],[_data[lastIndex], _data[lastIndex]])
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

  // useEffect(() => {
  //   if(dataTypes.length >0 && changingRef.current != null){
  //     unsubscribe(subscriptionIdRef.current)
  //     subscriptionIdRef.current = subscribe(update)
  //     if(changingRef.current == 'start'){setIsPlaying(true)}
  //     changingRef.current = null
  //   }
  // }, [dataTypes]);

  useEffect(() => {
    (async ()=>{
      const res = await initSciChart()
      setSciChartSurface(res.SciChartSurface)
      subscriptionIdRef.current = subscribe(update)
      if(changingRef.current == 'start'){setIsPlaying(true)}
      changingRef.current = null
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
      usedColorsRef.current = [];
      sciChartSurface?.delete()
    }
  }, [dataTypes]);

  return <>
    <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{position: 'relative',backgroundColor:'white', pb:0,pl:0, pt:2, mb:-2}}>
      <Box width={1} style={{opacity: loading ? 0 : 1}}>
        <Grid container alignItems='center' justifyContent='flex-end'>
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
        <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%',aspectRatio: '1 / 1'}}>
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