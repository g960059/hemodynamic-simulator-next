import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, CircularProgress} from '@material-ui/core'
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import { XyScatterRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/XyScatterRenderableSeries";
import { EllipsePointMarker } from "scichart/Charting/Visuals/PointMarkers/EllipsePointMarker";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {FiberManualRecord,MoreVert, ExpandLess,ExpandMore} from "@material-ui/icons"
import {LightTheme, COLORS, ALPHA_COLORS, DARKEN_COLORS} from '../styles/chartConstants'
import {useTranslation} from '../hooks/useTranslation'


const PV_COUNT = 1000
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


SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENCE_KEY);

const PVPlot = React.memo(({subscribe,unsubscribe, setIsPlaying,isPlaying, dataTypes, setDataTypes}) =>{
  const t = useTranslation();
  const [loading, setLoading] = useState(true);
  const [sciChartSurface, setSciChartSurface] = useState();

  const dataRef = useRef({})
  const leadingPointRef = useRef({});
  const fastLineSeriesRef = useRef({})
  const scatterSeriesRef = useRef({});
  const espvrDataRef = useRef({});
  const espvrLineSeriesRef = useRef({});
  const edpvrDataRef = useRef({});
  const edpvrLineSeriesRef = useRef({}); 

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
  const yMaxRef = useRef({});
  const xMaxRef = useRef({});
  const yPrevRef = useRef({});
  const yPrevPrevRef = useRef({});
  const xPrevRef = useRef({});
  const xPrevPrevRef = useRef({});

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
      dataSeries: dataRef.current[dataType]
    })
    const espvrSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: "#9c9c9c",
      strokeThickness: 2,
      dataSeries: espvrDataRef.current[dataType]
    })
    const edpvrSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: "#9c9c9c",
      strokeThickness: 2,
      dataSeries: edpvrDataRef.current[dataType]
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
  }

  const initSciChart = async () => {
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(
      "scichart-pv-root"
    );
    sciChartSurfaceRef.current = sciChartSurface
    wasmContextRef.current = wasmContext
    sciChartSurface.applyTheme(LightTheme)
    const xAxis = new NumericAxis(wasmContext,{axisAlignment: EAxisAlignment.Bottom,autoRange: EAutoRange.Never,drawMinorTickLines:false});
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
    xAxisRef.current = xAxis
    sciChartSurface.xAxes.add(xAxis);
    sciChartSurface.yAxes.add(yAxis);

    for(let i=0; i<dataTypes.length; i++){
      const dataType = dataTypes[i]
      addDataSeries(dataType)
    }
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

      // to update xMax, yMax
      if(!yPrevRef.current[dataType]){
        yPrevRef.current[dataType] = y
        if(!yPrevPrevRef.current[dataType]){
          yPrevPrevRef.current[dataType] = yPrevRef.current[dataType]
        }
      }
      let yMax = yMaxRef.current[dataType] || 0
      if(yPrevRef.current[dataType] >= yPrevPrevRef.current[dataType] && y < yPrevRef.current[dataType]){
        yMax = (Math.ceil(yPrevRef.current[dataType]/20)+1)*20
      }
      yPrevPrevRef.current[dataType] = yPrevRef.current[dataType]
      yPrevRef.current[dataType] = y

            
      if(!xPrevRef.current[dataType]){
        xPrevRef.current[dataType] = x
        if(!xPrevPrevRef.current[dataType]){
          xPrevPrevRef.current[dataType] = xPrevRef.current[dataType]
        }
      }
      let xMax = xMaxRef.current[dataType] 
      if(xPrevRef.current[dataType] >= xPrevPrevRef.current[dataType] && x < xPrevRef.current[dataType]){
        xMax = (Math.ceil(xPrevRef.current[dataType]/20)+1)*20
      }
      xPrevPrevRef.current[dataType] = xPrevRef.current[dataType]
      xPrevRef.current[dataType] = x
      const maxXMax = Object.values(xMaxRef.current).length >0 ? Math.max(...Object.values(xMaxRef.current)) : 0
      
      if(xAxisRef.current.visibleRange.max != maxXMax){
        xAxisRef.current.visibleRange = new NumberRange(0,maxXMax)
      }
      if(leadingPointRef.current[dataType].count()> 0){
        leadingPointRef.current[dataType].removeRange(0,leadingPointRef.current[dataType].count()-1);
        leadingPointRef.current[dataType].append(x,y);
      }else{
        leadingPointRef.current[dataType].append(_x[dataLength-1],_y[dataLength-1]);
      } 
      // update annotation lines
      const {alpha, beta, Ees, V0} = getHdProps[dataType](hdprops)
      
      if(Ees!= EesRef.current[dataType]|| V0 != V0Ref.current[dataType] || yMax != yMaxRef.current[dataType]){
        EesRef.current[dataType] = Ees;
        V0Ref.current[dataType] = V0;
        if(yMax != yMaxRef.current[dataType]){
          yMaxRef.current[dataType] = yMax
        }
        if(espvrDataRef.current[dataType].count()>0){
          espvrDataRef.current[dataType].clear()
        }
        if(Ees*(xMax-V0)<yMax){
          espvrDataRef.current[dataType].appendRange([V0,xMax],[0,Ees*(xMax-V0)])
        }else{
          espvrDataRef.current[dataType].appendRange([V0,yMax/Ees+V0],[0,yMax])
        }
      }
      if(alpha!= alphaRef.current[dataType] || beta!=betaRef.current[dataType]|| V0 != V0Ref.current[dataType] ||xMax != xMaxRef.current[dataType] || yMax != yMaxRef.current[dataType]){
        alphaRef.current[dataType]= alpha
        betaRef.current[dataType] = beta
        V0Ref.current[dataType] = V0
        if(yMax != yMaxRef.current[dataType]){
          yMaxRef.current[dataType] = yMax
        }
        if(xMax != xMaxRef.current[dataType]){
          xMaxRef.current[dataType] = xMax
        }        
        if(edpvrDataRef.current[dataType].count()>0){
          edpvrDataRef.current[dataType].clear()
        }
        if(beta* (Math.exp(alpha * (xMax-V0))-1) < yMax){
          const stepSize = (xMax-V0)/EDPVR_STEP
          const px = [...(new Array(EDPVR_STEP)).keys()].map(pxIndex => pxIndex*stepSize+V0)
          const py = px.map(_px=>beta* (Math.exp(alpha * (_px-V0))-1))
          edpvrDataRef.current[dataType].appendRange(px,py)
        }else{
          const stepSize = yMax/EDPVR_STEP
          const py = [...(new Array(EDPVR_STEP)).keys()].map(pxIndex => pxIndex*stepSize)
          const px = py.map(_py=> Math.log1p(_py/beta)/alpha + V0) 
          edpvrDataRef.current[dataType].appendRange(px,py)
        }
      }
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
        d.delete();
      })
      sciChartSurface?.delete()
    }
  }, []);

  return (
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
            {PVTypes.map((pType,index)=>(
              <MenuItem key={pType} onClick={clickMenuItem(index)} >
                <Checkbox checked ={dataTypes.includes(pType)} color='primary' />
                <ListItemText>{t[pType]}</ListItemText>
              </MenuItem>              
            ))}
          </Menu>
        </Grid>
        <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%',aspectRatio: '2 / 1.3'}}>
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

