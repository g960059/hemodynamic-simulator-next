import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, CircularProgress, Button,MenuList,ListItemIcon} from '@mui/material'
import { makeStyles } from '@mui/styles';
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import { EAxisType } from "scichart/types/AxisType";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {NumericLabelProvider} from "scichart/Charting/Visuals/Axis/LabelProvider/NumericLabelProvider";
import {FiberManualRecord,MoreVert, Check} from "@mui/icons-material"
import {LightTheme, COLORS, ALPHA_COLORS} from '../../styles/chartConstants'

import { chartBuilder } from "scichart/Builder/chartBuilder";
import { ESeriesType } from "scichart/types/SeriesType";

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

const useStyles = makeStyles((theme) =>({
  neumoButton: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "rgb(69, 90, 100)",
    boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
    backgroundColor: "white",
    border: "1px solid rgba(92, 147, 187, 0.17)",
    "&:hover":{
      backgroundColor: "rgba(239, 246, 251, 0.6)",
      borderColor: "rgb(207, 220, 230)"
    }
  }
}),
);

SciChartSurface.setRuntimeLicenseKey("d43pRwbuC+g3GCeKGrhu4pXSxO/JnEJ5nCssQeh0UbK3PvWJXz4EnrsIzTwNOa9kQ181KofrgV8YDwQnbhp+55GY3rP4NLUsKTvg+fIQGSzN9UinWtSFfQpSRzXAUf9LhJEBl6REurL9XmCcXKB8QYh/Le2AoZU11S0lUx3elUQINhMkxAjxbxnPYJ8FG3HelNVTCvgyVinLU2qkMr2WjBvPQNEZHz61LxPQusqKJZoMmdWray4qRBWo+YlhkKrKrmiWbOyGTStFba+vFL+XLIEJBLKdYKE15Jrx4jtiSBFGt6UwP3616g8RmXwfm+6yb8hMC6SWslZmKyO+MuefIgjj8z5DcOWvUYmqqcza9ShIMAMwqes1wem2esmw/V+ZMMX1Gty8/PduRXvDLXeHpYOZ5Zvm+3DoCik65XQO20CVLPWqq7r7UD1LQioqKahsT4PToBaOokJZF1RxfbvUlAibDwAGF5VsNswX80dpOfdUdOOBgyFYNuj1P5GuTgpOEtcDvIV/vKV2SBwx6Aoay24dBOGPIdUtYYbW3QU4+Hr6clTAhs+2VwUK1YPtCNH2TRt0cH3SU9qOpn8hrn6hE0+v5MU7gdvyXyPoAEC3qW7AaR9JO9RaaDy1ZhgSwexUKbqAcg4wmrbrTzzVgS3D7GtQOD0x2d9fTbjezBAnH7eMo7xHZwj/FAdEk/hLlQhMo8g1RJMWVtRMtUBDfNtD4ZV/lGBCDbmH8csu5golavgE8Qc+WnrJ");

const RealTimeChart = React.memo(({subscribe,unsubscribe, setIsPlaying,isPlaying, dataTypes,setDataTypes}) =>{
  const t = useTranslation();
  const classes = useStyles();
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
          drawLabels:false,
          drawMinorGridLines: false,
          growBy: new NumberRange(0.1,0.1),
          labelProvider: new NumericLabelProvider({
            labelPrecision: 1,
          }) 
        }
      },
    });    
    sciChartSurfaceRef.current = sciChartSurface
    wasmContextRef.current = wasmContext
    sciChartSurface.applyTheme(LightTheme)


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
      if(indiceRange2.max - indiceRange2.min > 0){
        dataSeries[k].removeRange(indiceRange2.min, indiceRange2.max - indiceRange2.min + 1)
      }
      if(TIME_WINDOW - newTime < 200){
        dataSeries[k].clear()
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
          <Grid item justifyContent='center' display='flex'>    
            <Button className={classes.neumoButton} size='small' variant='outlined' onClick={e=>setAnchorEl(e.currentTarget)} sx={{mr:1,mt:-1,mb:1}}>
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