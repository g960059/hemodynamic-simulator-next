import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, CircularProgress} from '@mui/material'
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import { XyScatterRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/XyScatterRenderableSeries";
import { EllipsePointMarker } from "scichart/Charting/Visuals/PointMarkers/EllipsePointMarker";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import { ELineDrawMode } from "scichart/Charting/Drawing/WebGlRenderContext2D";
import {FiberManualRecord,MoreVert, ExpandLess,ExpandMore} from "@mui/icons-material"
import {LightTheme, COLORS, ALPHA_COLORS, DARKEN_COLORS} from '../../styles/chartConstants'
import {useTranslation} from '../../hooks/useTranslation'
import { Thickness } from 'scichart/Core/Thickness';


const PV_COUNT = 500
const EDPVR_STEP = 20
const PVTypes = ['LV','LA','RV','RA']

const getPVSeriesFn = () => {
  const LV = x => [x['Qlv'],x['Plv']]
  const LA = x => [x['Qla'],x['Pla']]
  const RV = x => [x['Qrv'],x['Prv']]
  const RA = x => [x['Qra'],x['Pra']]
  return {LV,LA, RV, RA}
}
const getHdProps = {
  LV: x=>({Ees: x["LV_Ees"],V0:x["LV_V0"],alpha:x["LV_alpha"],beta:x["LV_beta"]}),
  LA: x=>({Ees: x["LA_Ees"],V0:x["LA_V0"],alpha:x["LA_alpha"],beta:x["LA_beta"]}),
  RV: x=>({Ees: x["RV_Ees"],V0:x["RV_V0"],alpha:x["RV_alpha"],beta:x["RV_beta"]}),
  RA: x=>({Ees: x["RA_Ees"],V0:x["RA_V0"],alpha:x["RA_alpha"],beta:x["RA_beta"]}),
}



const PVPlot = React.memo(({subscribe,unsubscribe, setIsPlaying,isPlaying, dataTypes, setDataTypes}) =>{
  const t = useTranslation();
  const [loading, setLoading] = useState(true);

  const dataRef = useRef({})
  const leadingPointRef = useRef({});
  const fastLineSeriesRef = useRef({})
  const scatterSeriesRef = useRef({});
  const espvrDataRef = useRef({});
  const espvrLineSeriesRef = useRef({});
  const edpvrDataRef = useRef({});
  const edpvrLineSeriesRef = useRef({}); 

  const annotationDataRef = useRef({})
  const annotationSeriesRef=useRef({})

  const alphaRef = useRef({}); 
  const betaRef = useRef({});
  const V0Ref = useRef({});
  const EesRef = useRef({});

  const sciChartSurfaceRef = useRef();
  const wasmContextRef = useRef();
  const subscriptionIdRef = useRef();
  const changingRef = useRef(null);
  const usedColorsRef = useRef([]);
  const xAxisRef = useRef();
  const yAxisRef = useRef();
  const yMaxRef = useRef(-Infinity);
  const xMaxRef = useRef(-Infinity);
  const yMinRef = useRef(Infinity);
  const xMinRef = useRef(Infinity);
  const yMaxCandidateRef = useRef(-Infinity);
  const xMaxCandidateRef = useRef(-Infinity);
  const yMinCandidateRef = useRef(Infinity);
  const xMinCandidateRef = useRef(Infinity);

  const counterRef = useRef(1)

  const [anchorEl, setAnchorEl] = useState(null);

  const addDataSeries = (dataType)=>{
    const colorIndex = [...COLORS.keys()].find(i=>!usedColorsRef.current.includes(i))
    usedColorsRef.current.push(colorIndex)
    dataRef.current[dataType] = new XyDataSeries(wasmContextRef.current);
    leadingPointRef.current[dataType] = new XyDataSeries(wasmContextRef.current)
    espvrDataRef.current[dataType] = new XyDataSeries(wasmContextRef.current)
    edpvrDataRef.current[dataType] = new XyDataSeries(wasmContextRef.current)
    const fastLineSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: ALPHA_COLORS[colorIndex],
      strokeThickness: 3,
      dataSeries: dataRef.current[dataType],
      drawNaNAs:ELineDrawMode.PolyLine
    })
    const espvrSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: "#9c9c9c",
      strokeThickness: 2,
      dataSeries: espvrDataRef.current[dataType],
      drawNaNAs:ELineDrawMode.PolyLine
    })
    const edpvrSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: "#9c9c9c",
      strokeThickness: 2,
      dataSeries: edpvrDataRef.current[dataType],
      drawNaNAs:ELineDrawMode.PolyLine
    })        
    const leadingSeries = new XyScatterRenderableSeries(wasmContextRef.current, {
        pointMarker: new EllipsePointMarker(wasmContextRef.current, {
            width: 5,
            height: 5,
            strokeThickness: 2,
            fill: COLORS[colorIndex],
            stroke: COLORS[colorIndex]
        }),
        dataSeries: leadingPointRef.current[dataType],
    })    

    fastLineSeriesRef.current[dataType] = fastLineSeries
    scatterSeriesRef.current[dataType] = leadingSeries
    espvrLineSeriesRef.current[dataType] = espvrSeries
    edpvrLineSeriesRef.current[dataType] = edpvrSeries
    
    sciChartSurfaceRef.current.renderableSeries.add(fastLineSeries)
    sciChartSurfaceRef.current.renderableSeries.add(leadingSeries)
    sciChartSurfaceRef.current.renderableSeries.add(espvrSeries)
    sciChartSurfaceRef.current.renderableSeries.add(edpvrSeries)

    annotationDataRef.current[dataType] = new XyDataSeries(wasmContextRef.current);
    annotationSeriesRef.current[dataType] = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: ALPHA_COLORS[colorIndex],
      strokeThickness: 2,
      dataSeries: annotationDataRef.current[dataType]
    })
    sciChartSurfaceRef.current.renderableSeries.add(annotationSeriesRef.current[dataType])
  }

  const initSciChart = async () => {
    SciChartSurface.setRuntimeLicenseKey("nac2rMGjekVDJ0tcaayVGckXXaozKTVvSIfVhuk9ywdbBc7oiXADBXZCkajSv4FzWFHCNM81JrsbXRh3k8Z4sBxRn5pVsAD6WK88b26kWQhwzdEhGwl5QgcLwSLGgGbz/EENeIEB4hA6H58o49zmciynUP+46AeDzbW3lI0sFqFygtr3NZ2WPk/d1wiTPX8QYDvczs71ywybTo3eSpMsBrq1jNv+VZ+C9y0Mbg2/svmB3jIx0t5MJKcJock7T6dcRgKJuL9iq3dQTchtO3/UNxwHPvAUa48Lfmlq3bksy0YDRfaIdqWs2lL8liEApipL9OW+lQXdvK1Pj3qT0mIOjWO3ysJRa5SCL7iT+Vq1tT9S8GCvzh6UeBctJAQ1iKtd3GeSE7lsN3jYpilkyLYj83aawtsspyiniAl8uQI2whJLHikoyCUkaDQMuCfRLSsZ0ZyFqEJyK5Uft5ia3ISpUC9jJi/07Vubwai6FAonxiZyUFIFKRWt/hIX4n4ExQ2SfYTgsV1M9CbvuZ3S4IuATSOJXR9jbU7VOuHswfrakcASDuECPs74kBgZ5WR8Gg2rz4/aMo0MBFkP0LPCrB9daGCizpg0uozv0TGc0karwwhgRmNpbY6RJoy0hviQbSyVGoovB7SuhjaKMaHdNIhJmAFf6gAlmQ0M/rsBFVK13J/7RlqofsGfAr66Ez6pxUlEezibkyx9tdH2D/fLhiuDgRRaQmPXsUEn4jzFq6hpch5h2rq+DLaF");
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(
      "scichart-pv-root"
    );
    sciChartSurfaceRef.current = sciChartSurface
    wasmContextRef.current = wasmContext
    sciChartSurface.applyTheme(LightTheme)
    const xAxis = new NumericAxis(wasmContext,{axisAlignment: EAxisAlignment.Bottom,autoRange: EAutoRange.Never, drawLabels:false, drawMinorTickLines:false});
    const yAxis = new NumericAxis(wasmContext,{axisAlignment: EAxisAlignment.Left,autoRange: EAutoRange.Never,drawMinorTickLines:false});
    xAxis.drawMajorGridLines =false;
    xAxis.drawMinorGridLines =false;
    yAxis.drawMinorGridLines =false;    
    yAxis.axisBorder = {
      borderRight: 1,
      color: "#e5e5e5"
    };
    yAxis.growBy = new NumberRange(0.1, 0.05);
    yAxis.labelProvider.formatLabel = (dataValue => dataValue?.toFixed(0))
    xAxisRef.current = xAxis
    yAxisRef.current = yAxis
    sciChartSurface.xAxes.add(xAxis);
    sciChartSurface.yAxes.add(yAxis);
    for(let i=0; i<dataTypes.length; i++){
      const dataType = dataTypes[i]
      addDataSeries(dataType)
    }
    sciChartSurface.padding = Thickness.fromNumber(0);
    return {sciChartSurface,wasmContext}
  }  
  const update = (data, time, hdprops) => {
    for(let i=0; i<dataTypes.length; i++){
      const dataType = dataTypes[i]
      const [_x, _y] = getPVSeriesFn(hdprops)[dataType](data)
      const dataLength = _x.length
      const y = _y[dataLength-1]
      const x = _x[dataLength-1]
      if(dataRef.current[dataType].count()>PV_COUNT){
        dataRef.current[dataType].removeRange(0,dataLength)
      }
      dataRef.current[dataType].appendRange(_x, _y)

      if(leadingPointRef.current[dataType].count()> 0){
        leadingPointRef.current[dataType].removeRange(0,leadingPointRef.current[dataType].count()-1);
        leadingPointRef.current[dataType].append(x,y);
      }else{
        leadingPointRef.current[dataType].append(_x[dataLength-1],_y[dataLength-1]);
      } 
      
      if(time / (60000/hdprops['HR']) > counterRef.current){
        xMaxRef.current = xMaxCandidateRef.current
        yMaxRef.current = yMaxCandidateRef.current
        xMinRef.current = xMinCandidateRef.current
        yMinRef.current = yMinCandidateRef.current

        xMaxCandidateRef.current = xMaxCandidateRef.current - Math.abs(xMaxCandidateRef.current) * 0.8
        yMaxCandidateRef.current = yMaxCandidateRef.current - Math.abs(yMaxCandidateRef.current) * 0.8
        xMinCandidateRef.current = xMinCandidateRef.current + Math.abs(xMinCandidateRef.current) * 0.8
        yMinCandidateRef.current = yMinCandidateRef.current + Math.abs(yMinCandidateRef.current) * 0.8
        counterRef.current= Math.floor(time / (60000/hdprops['HR']))+1;
      }
      _x.forEach(px=>{
        if(px>xMaxRef.current){xMaxRef.current=px}
        if(px<xMinRef.current){xMinRef.current=px}
        if(px>xMaxCandidateRef.current){xMaxCandidateRef.current=px}
        if(px<xMinCandidateRef.current){xMinCandidateRef.current=px}
      })
      _y.forEach(py=>{
        if(py>yMaxRef.current){yMaxRef.current=py}
        if(py<yMinRef.current){yMinRef.current=py}
        if(py>yMaxCandidateRef.current){yMaxCandidateRef.current=py}
        if(py<yMinCandidateRef.current){yMinCandidateRef.current=py}
      })
      xAxisRef.current.visibleRange = new NumberRange(xMinRef.current-0.1*(xMaxRef.current-xMinRef.current),xMaxRef.current)
      yAxisRef.current.visibleRange = new NumberRange(yMinRef.current-(yMaxRef.current-yMinRef.current)*0.1,yMaxRef.current+(yMaxRef.current-yMinRef.current)*0.1)

      const lastIndex = _x.length-1
      annotationDataRef.current[dataType].clear()
      annotationDataRef.current[dataType].appendRange([_x[lastIndex],xMaxRef.current],[_y[lastIndex], _y[lastIndex]])
    }
  }  

  const clickMenuItem = (index) => e => {
    changingRef.current = isPlaying ? 'start' : 'stop';
    setIsPlaying(false)
    unsubscribe(subscriptionIdRef.current)
    if(dataTypes.includes(PVTypes[index])){
      dataRef.current[PVTypes[index]].delete();
      leadingPointRef.current[PVTypes[index]].delete();
      espvrDataRef.current[PVTypes[index]].delete();
      edpvrDataRef.current[PVTypes[index]].delete();
      delete dataRef.current[PVTypes[index]];
      delete leadingPointRef.current[PVTypes[index]];
      delete espvrDataRef.current[PVTypes[index]];
      delete edpvrDataRef.current[PVTypes[index]];

      sciChartSurfaceRef.current.renderableSeries.remove(fastLineSeriesRef.current[PVTypes[index]]);
      sciChartSurfaceRef.current.renderableSeries.remove(scatterSeriesRef.current[PVTypes[index]]);
      sciChartSurfaceRef.current.renderableSeries.remove(espvrLineSeriesRef.current[PVTypes[index]]);
      sciChartSurfaceRef.current.renderableSeries.remove(edpvrLineSeriesRef.current[PVTypes[index]]);
      delete fastLineSeriesRef.current[PVTypes[index]];
      delete scatterSeriesRef.current[PVTypes[index]];
      delete espvrLineSeriesRef.current[PVTypes[index]];
      delete edpvrLineSeriesRef.current[PVTypes[index]];

      usedColorsRef.current.splice(dataTypes.findIndex(x=>x==PVTypes[index]),1);
      setDataTypes(prev => prev.filter(x=>x!=PVTypes[index]));
    }else{
      setDataTypes(prev => [...prev,PVTypes[index]])
      addDataSeries(PVTypes[index])
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
      const playNow = isPlaying;
      setIsPlaying(false)
      const res = await initSciChart()
      sciChartSurfaceRef.current = res.sciChartSurface
      subscriptionIdRef.current = subscribe(update)
      // setIsPlaying(true)
      if(res){
        setLoading(false)
      }
      if(playNow){
        setIsPlaying(true)
      }
    })();
    return ()=>{
      const playNow = isPlaying;
      setIsPlaying(false)
      unsubscribe(subscriptionIdRef.current)
      for(let i=0; dataRef.current.length;i++){
        dataRef.current[i].delete();
        leadingPointRef.current[i].delete();
        espvrDataRef.current[i].delete();
        edpvrDataRef.current[i].delete();
        sciChartSurfaceRef.current.renderableSeries.remove(fastLineSeriesRef.current[i]);
        sciChartSurfaceRef.current.renderableSeries.remove(scatterSeriesRef.current[i]);
        sciChartSurfaceRef.current.renderableSeries.remove(espvrLineSeriesRef.current[i]);
        sciChartSurfaceRef.current.renderableSeries.remove(edpvrLineSeriesRef.current[i]);
        delete leadingPointRef.current[i];
        delete espvrDataRef.current[i];
        delete edpvrDataRef.current[i];
        delete fastLineSeriesRef.current[i];
        delete scatterSeriesRef.current[i];
        delete espvrLineSeriesRef.current[i];
        delete edpvrLineSeriesRef.current[i];
      }
      usedColorsRef.current = [];
      sciChartSurfaceRef.current?.delete()
      if(playNow){
        setIsPlaying(true)
      }
    }
  }, [dataTypes]);

  return (
    <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{position: 'relative',backgroundColor:'white', pb:0,pr:0,pt:2, mb:-2}}>
      <Box width={1} style={{opacity: loading ? 0 : 1}}>
        <Grid container alignItems='center' sx={{marginBottom: '11px'}}>
          <Grid item container xs={10} md={11} spacing={1} justifyContent='flex-start' display='flex' sx={{pl:2}}>
            {dataTypes.map((dataType,i)=>(
              <Grid item justifyContent='center' alignItems='center' display='flex' key={dataType} style={{marginBottom:'-4px'}}> 
                <FiberManualRecord sx={{color:COLORS[usedColorsRef.current[i]]}} />
                <Typography variant='subtitle2' noWrap>{t[dataType]}</Typography>
              </Grid>
            ))}
          </Grid>
          <Menu id="ts-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={()=>setAnchorEl(null)}>
            {PVTypes.map((pType,index)=>(
              <MenuItem key={pType} onClick={clickMenuItem(index)} >
                <Checkbox checked ={dataTypes.includes(pType)} color='primary' />
                <ListItemText>{t[pType]}</ListItemText>
              </MenuItem>              
            ))}
          </Menu>
        </Grid>
        <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%',aspectRatio: '1 / 1'}}>
          <div id="scichart-pv-root" style={{width: '100%',height:'100%'}}></div>
        </Box>
      </Box>
      <Box sx={{display: loading? 'block': 'none', zIndex:100, position: 'absolute'}}>
        <CircularProgress/>
      </Box>
    </Box>
  )
})

export default PVPlot

