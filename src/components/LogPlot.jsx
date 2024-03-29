import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Select,FormControl,InputLabel, IconButton, CircularProgress, Button, ButtonGroup, ToggleButtonGroup, ToggleButton} from '@mui/material'
import {Refresh} from '@mui/icons-material';
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import { XyScatterRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/XyScatterRenderableSeries";
import { EllipsePointMarker } from "scichart/Charting/Visuals/PointMarkers/EllipsePointMarker";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {LightTheme, COLORS, ALPHA_COLORS} from '../styles/chartConstants'
import { useTranslation } from '../hooks/useTranslation';
import {shallowCompare} from '../utils/utils'
import {DEFAULT_HEMODYANMIC_PROPS} from '../hooks/usePvLoop'
import {e} from '../utils/pvFunc'
import {SV, EF, LVEDP, HR, CO,LaKickRatio} from '../utils/metrics'

const BasicHdps = ['Volume','Ras','LV_Ees','LV_alpha','LV_tau','HR']

const AxisDataOptions = [SV, EF, LVEDP, HR, CO,LaKickRatio]

SciChartSurface.setRuntimeLicenseKey("nac2rMGjekVDJ0tcaayVGckXXaozKTVvSIfVhuk9ywdbBc7oiXADBXZCkajSv4FzWFHCNM81JrsbXRh3k8Z4sBxRn5pVsAD6WK88b26kWQhwzdEhGwl5QgcLwSLGgGbz/EENeIEB4hA6H58o49zmciynUP+46AeDzbW3lI0sFqFygtr3NZ2WPk/d1wiTPX8QYDvczs71ywybTo3eSpMsBrq1jNv+VZ+C9y0Mbg2/svmB3jIx0t5MJKcJock7T6dcRgKJuL9iq3dQTchtO3/UNxwHPvAUa48Lfmlq3bksy0YDRfaIdqWs2lL8liEApipL9OW+lQXdvK1Pj3qT0mIOjWO3ysJRa5SCL7iT+Vq1tT9S8GCvzh6UeBctJAQ1iKtd3GeSE7lsN3jYpilkyLYj83aawtsspyiniAl8uQI2whJLHikoyCUkaDQMuCfRLSsZ0ZyFqEJyK5Uft5ia3ISpUC9jJi/07Vubwai6FAonxiZyUFIFKRWt/hIX4n4ExQ2SfYTgsV1M9CbvuZ3S4IuATSOJXR9jbU7VOuHswfrakcASDuECPs74kBgZ5WR8Gg2rz4/aMo0MBFkP0LPCrB9daGCizpg0uozv0TGc0karwwhgRmNpbY6RJoy0hviQbSyVGoovB7SuhjaKMaHdNIhJmAFf6gAlmQ0M/rsBFVK13J/7RlqofsGfAr66Ez6pxUlEezibkyx9tdH2D/fLhiuDgRRaQmPXsUEn4jzFq6hpch5h2rq+DLaF");

const LogPlot = React.memo(({subscribe,unsubscribe, setIsPlaying,isPlaying,setHdps,getHdps, setSpeed}) =>{
  const t = useTranslation();
  const [loading, setLoading] = useState(true);
  const dataRef = useRef();
  const usedColorsRef = useRef([]);

  const datasRef = useRef([])
  const scatterSeriesRef = useRef()
  const counterRef = useRef(30);
  const sciChartSurfaceRef = useRef()
  const wasmContextRef = useRef();
  const subscriptionIdRef = useRef();
  const [recordSpeed, setRecordSpeed] = useState(10);

  const [xAxisClass, setXAxisClass] = useState("LVEDP");
  const [yAxisClass, setYAxisClass] = useState("SV");
  
  const xRef = useRef();
  const yRef = useRef();
  const changingRef = useRef(null);

  const [baseValue, setBaseValue] = useState(100);
  const [targetValue, setTargetValue] = useState(100);
  const difRef = useRef(0);
  const [hdp, setHdp] = useState('Volume');

  const [recording, setRecording] = useState(false);
  

  const addNewScatterSeries = () => {
    const colorIndex = [...COLORS.keys()].find(i=>!usedColorsRef.current.includes(i))
    usedColorsRef.current.push(colorIndex)
    dataRef.current = new XyDataSeries(wasmContextRef.current)
    datasRef.current.push(dataRef.current)

    scatterSeriesRef.current = new XyScatterRenderableSeries(wasmContextRef.current, {
      pointMarker: new EllipsePointMarker(wasmContextRef.current, {
          width: 5,
          height: 5,
          strokeThickness: 2,
          fill: COLORS[colorIndex],
          stroke: COLORS[colorIndex]
      }),
      dataSeries: dataRef.current,
    })    
    sciChartSurfaceRef.current.renderableSeries.add(scatterSeriesRef.current)
  }

  const initSciChart = async () => {
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(
      "scichart-root-log"
    );
    wasmContextRef.current = wasmContext
    sciChartSurface.applyTheme(LightTheme)
    const xAxis = new NumericAxis(wasmContext,{axisAlignment: EAxisAlignment.Bottom,autoRange: EAutoRange.Always,drawMinorTickLines:false});
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

    sciChartSurface.zoomExtents();

    xRef.current = new LVEDP()
    yRef.current = new SV()
    return {sciChartSurface,wasmContext}
  }  

  const update = (data, time, hdprops) => {
    xRef.current.update(data,time,hdprops)
    yRef.current.update(data,time,hdprops)
    if(time > counterRef.current * 60000 / hdprops['HR']){
      const x = xRef.current.get() || 0
      const y = yRef.current.get() || 0
      console.log(x,y)
      xRef.current.reset()
      yRef.current.reset()
      if(0<x && x<10000 && 0<y && y< 10000){
        dataRef.current.appendRange([x],[y]);
        counterRef.current = Math.floor(time*hdprops['HR']/ 60000 )+30
        const defaultValue = DEFAULT_HEMODYANMIC_PROPS[hdp]
        if(targetValue == Math.round(baseValue + difRef.current)){
          setIsPlaying(false)
          setSpeed(1)
        }else if(targetValue > baseValue){
          if(hdp=='HR'){
            setHdps(hdp, Math.round(defaultValue*(baseValue + difRef.current+2)/100))
          }else{
            setHdps(hdp,defaultValue*(baseValue + difRef.current+2)/100)
          }
          difRef.current += 2
        }else{
          if(hdp=='HR'){
            setHdps(hdp, Math.round(defaultValue*(baseValue + difRef.current-2)/100))
          }else{
            setHdps(hdp,defaultValue*(baseValue + difRef.current-2)/100)
          }
          difRef.current -=2
        }
      }
    }
  }
  const startRecording = () => {
    unsubscribe(subscriptionIdRef.current)
    addNewScatterSeries()

    difRef.current=0; 
    const defaultValue = DEFAULT_HEMODYANMIC_PROPS[hdp]
    if(hdp=='HR'){
      setHdps(hdp, Math.round(defaultValue*(baseValue)/100))
    }else{
      setHdps(hdp,defaultValue*(baseValue)/100)
    }

    subscriptionIdRef.current = subscribe(update);
    setSpeed(recordSpeed); 
    setIsPlaying(true)
  }  

  useEffect(() => {
    (async ()=>{
      setIsPlaying(false)
      const res = await initSciChart()
      sciChartSurfaceRef.current = res.sciChartSurface
      if(res){
        setLoading(false)
      }
    })();
    return ()=>{
      unsubscribe(subscriptionIdRef.current)
      datasRef.current.forEach(d=>{d.delete()})
      sciChartSurfaceRef.current?.delete()
    }
  }, []);
  const display = (value) => {
    if(hdp == 'HR') return `${Math.round(DEFAULT_HEMODYANMIC_PROPS[hdp]*value/100)} bpm`
    if(hdp.includes('alpha')) return `${value-100>0 ? "-": "+"}${Math.abs((value-100))}%`
    return `${value-100>0 ? "+": ""}${Math.round((value-100))}%`
  }

  return <>
    <Box width={1} sx={{position: 'relative',backgroundColor:'white', p:[0.5,2],pb:0, pt:2, mb:-2}}>
      <Box width={1} style={{opacity: loading ? 0 : 1}}>
        <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%',aspectRatio: '2 / 1.3'}}>
          <div id="scichart-root-log" style={{width: '100%',height:'100%'}}></div>
        </Box>
      </Box>
      <Box sx={{display: loading? 'block': 'none', zIndex:100, position: 'absolute'}}>
        <CircularProgress/>
      </Box>
      <Box width={1} px={1}>
        <Stack>
        <Grid container justifyContent="center" alignItems="center" sx={{mb:1}}>
            <Grid item xs={6}>
              <Typography variant='subtitle1'>{t['XAxisLog']}</Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControl>
                <Select
                  labelId="hdp-label"
                  id="select"
                  value={xAxisClass}
                  onChange={e=>{
                    setXAxisClass(e.target.value)
                    xRef.current = new AxisDataOptions[AxisDataOptions.findIndex(d=>d.getLabel()===e.target.value)]()
                  }}
                  sx={{'.MuiSelect-select':{py:1, pl:2}}}
                >
                  {AxisDataOptions.map(d=><MenuItem value={d.getLabel()}>{t[d.getLabel()]}</MenuItem>)}
                </Select>          
              </FormControl>
            </Grid>
          </Grid>
          <Grid container justifyContent="center" alignItems="center" sx={{mb:1}}>
            <Grid item xs={6}>
              <Typography variant='subtitle1'>{t['YAxisLog']}</Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControl>
                <Select
                  labelId="hdp-label"
                  id="select"
                  value={yAxisClass}
                  onChange={e=>{
                    setYAxisClass(e.target.value);
                    yRef.current = new AxisDataOptions[AxisDataOptions.findIndex(d=>d.getLabel()===e.target.value)]()
                  }}
                  sx={{'.MuiSelect-select':{py:1, pl:2}}}
                >
                  {AxisDataOptions.map(d=><MenuItem value={d.getLabel()}>{t[d.getLabel()]}</MenuItem>)}
                </Select>          
              </FormControl>
            </Grid>
          </Grid>             
          <Grid container justifyContent="center" alignItems="center" sx={{mb:1}}>
            <Grid item xs={6}>
              <Typography variant='subtitle1'>{t['TargetHdp']}</Typography>
            </Grid>
            <Grid item xs={6}>
              <FormControl>
                <Select
                  labelId="hdp-label"
                  id="select"
                  value={hdp}
                  onChange={e=>{setHdp(e.target.value)}}
                  sx={{'.MuiSelect-select':{py:1, pl:2}}}
                >
                  {BasicHdps.map(hdpOption=><MenuItem value={hdpOption}>{t[hdpOption]}</MenuItem>)}
                </Select>          
              </FormControl>
            </Grid>
          </Grid>               
          <Grid container justifyContent="center" alignItems="center" sx={{mb:1}}>
            <Grid item xs={6}>
              <Typography variant='subtitle1'>{t['BaseValue']}: <strong>{display(baseValue)}</strong></Typography>
            </Grid>
            <Grid item xs={6}>
              <ButtonGroup variant="outlined" size="small">
                <Button onClick={()=>{setBaseValue(prev=>prev-20)}} disabled={baseValue<=30}>-20%</Button>
                <Button onClick={()=>{setBaseValue(prev=>100)}}><Refresh/></Button>
                <Button onClick={()=>{setBaseValue(prev=>prev+20)}}>+20%</Button>
              </ButtonGroup>
            </Grid>
          </Grid>          
          <Grid container justifyContent="center" alignItems="center" sx={{mb:1}}>
            <Grid item xs={6}>
              <Typography variant='subtitle1'>{t['TargetValue']}: <strong>{display(targetValue)}</strong></Typography>
            </Grid>
            <Grid item xs={6}>
              <ButtonGroup variant="outlined" size="small">
                <Button onClick={()=>{setTargetValue(prev=>prev-20)}} disabled={targetValue<=30}>-20%</Button>
                <Button onClick={()=>{setTargetValue(prev=>100)}}><Refresh/></Button>
                <Button onClick={()=>{setTargetValue(prev=>prev+20)}}>+20%</Button>
              </ButtonGroup>
            </Grid>
          </Grid>
          <Box display='flex'justifyContent="center" alignItems="center" mb={1}>
            <Stack direction='row'>
              <ToggleButtonGroup
                color="primary"
                value={recordSpeed}
                exclusive
                onChange={(e,v)=>{setRecordSpeed(v)}}
                sx={{mr:2}}
              >
                <ToggleButton value={2}>{t['LowSpeed']}</ToggleButton>
                <ToggleButton value={10}>{t['NormalSpeed']}</ToggleButton>
                <ToggleButton value={50}>{t['HighSpeed']}</ToggleButton>
              </ToggleButtonGroup>
              {isPlaying ? 
                <Button variant='contained' onClick={()=>{setIsPlaying(false);setSpeed(1)}}>{t['StopRecording']}</Button> :
                <Button  variant='contained' onClick={()=>{startRecording()}}>{t['StartRecording']}</Button>
              }
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>

  </>
})

export default LogPlot
