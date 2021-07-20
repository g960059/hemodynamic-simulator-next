import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, ListItemButton, IconButton, CircularProgress} from '@material-ui/core'
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import {FastLineRenderableSeries} from "scichart/charting/visuals/RenderableSeries/FastLineRenderableSeries";
import {XyDataSeries} from "scichart/charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {FiberManualRecord,MoreVert, ExpandLess,ExpandMore} from "@material-ui/icons"
import {LightTheme, COLORS, ALPHA_COLORS} from '../styles/chartConstants'
import { useRouter } from 'next/router'
import en from '../locales/en'
import ja from '../locales/ja'

const PV_COUNT = 400

const getPVSeriesFn = () => {
  const LV = x => [x['Qlv'],x['Plv']]
  const LA = x => [x['Qla'],x['Pla']]
  const RV = x => [x['Qrv'],x['Prv']]
  const RA = x => [x['Qra'],x['Pra']]
  return {LV,LA, RV, RA}
}

SciChartSurface.setRuntimeLicenseKey(process.env.LICENCE_KEY);

const PVPlot = React.memo(({subscribe,unsubscribe, setIsPlaying,isPlaying, initialDataTypes}) =>{
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
  const xAxisRef = useRef();
  const [dataTypes, setDataTypes] = useState(initialDataTypes);
  const [anchorEl, setAnchorEl] = useState(null);

  const addDataSeries = (dataType)=>{
    const colorIndex = [...COLORS.keys()].find(i=>!usedColorsRef.current.includes(i))
    usedColorsRef.current.push(colorIndex)
    dataRef.current[dataType] = new XyDataSeries(wasmContextRef.current);
    const fastLineSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: COLORS[colorIndex],
      strokeThickness: 3,
      dataSeries: dataRef.current[dataType]
    })
    fastLineSeriesRef.current[dataType] = fastLineSeries
    sciChartSurfaceRef.current.renderableSeries.add(fastLineSeries)
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
    // sciChartSurface.zoomExtents();
    return {sciChartSurface,wasmContext}
  }  
  const update = (data, time, hdprops) => {
    for(let i=0; i<dataTypes.length; i++){
      const dataType = dataTypes[i]
      const [_x, _y] = getPVSeriesFn(hdprops)[dataType](data)
      if(dataRef.current[dataType].count()>PV_COUNT){
        dataRef.current[dataType].removeRange(0,_x.length)
      }
      dataRef.current[dataType].appendRange(_x, _y)
      const newMax = Math.ceil(dataRef.current[dataType].xRange.max / 20) * 20
      if(xAxisRef.current.visibleRange.max < newMax){
        xAxisRef.current.visibleRange = new NumberRange(0,newMax)
      }      
    }
  }  

  // const clickMenuItem = (index) => e => {
  //   changingRef.current = isPlaying ? 'start' : 'stop';
  //   setIsPlaying(false)
  //   unsubscribe(subscriptionIdRef.current)
  //   if(dataTypes.includes(pressureTypes[index])){
  //     [0,1].forEach(i=>{dataRef.current[pressureTypes[index]][i].delete()});
  //     delete dataRef.current[pressureTypes[index]];
  //     [0,1].forEach(i=>{sciChartSurfaceRef.current.renderableSeries.remove(fastLineSeriesRef.current[pressureTypes[index]][i])});
  //     delete fastLineSeriesRef.current[pressureTypes[index]];
  //     usedColorsRef.current.splice(dataTypes.findIndex(x=>x==pressureTypes[index]),1);
  //     setDataTypes(prev => prev.filter(x=>x!=pressureTypes[index]));
  //   }else{
  //     setDataTypes(prev => [...prev,pressureTypes[index]])
  //     addDataSeries(pressureTypes[index])
  //   }
  // }

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
      setIsPlaying(true)
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
          {/* <Grid item xs={2} md={1} justifyContent='center' display='flex'>
            <IconButton aria-controls='ts-menu' aria-haspopup= {true} onClick={e=>setAnchorEl(e.currentTarget)} style={{zIndex:100, marginBottom:'-8px'}} size='small'>
              <MoreVert/>
            </IconButton>
          </Grid>
          <Menu id="ts-menu" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={()=>setAnchorEl(null)}>
            <ListItemButton onClick={()=>{setPressureMenuOpen(prev=>!prev)}}>
              <ListItemText primary="PV Loop" />
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
          </Menu> */}
        </Grid>
        <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%',aspectRatio: '2 / 1'}}>
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

