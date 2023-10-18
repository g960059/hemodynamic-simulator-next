import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, IconButton,MenuList,ListItemIcon,Tab, CircularProgress,Select,FormControl,InputLabel, useMediaQuery, ToggleButtonGroup, ToggleButton} from '@mui/material'
import {Tune,Delete,Add,DragIndicator,ExpandMore} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { chartBuilder } from "scichart/Builder/chartBuilder";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import {XyScatterRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/XyScatterRenderableSeries";
import { EllipsePointMarker } from "scichart/Charting/Visuals/PointMarkers/EllipsePointMarker";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import { EAxisType } from "scichart/types/AxisType";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {NumericLabelProvider} from "scichart/Charting/Visuals/Axis/LabelProvider/NumericLabelProvider";

import {FiberManualRecord,MoreVert,Check} from "@mui/icons-material"
import {LightTheme, COLORS, ALPHA_COLORS,getRandomColor} from '../styles/chartConstants'
import { useTranslation } from '../hooks/useTranslation';
import { useImmer } from "use-immer";
import ReactiveInput from "../components/ReactiveInput";
import  DeleteMenuItemWithDialog from "../components/DeleteMenuItemWithDialog"
import { nanoid } from 'nanoid'
import { metrics, metricOptions } from '../utils/metrics'
import NeumoSelect from '../elements/NeumoSelect';
import FaintNeumoButton from '../elements/FaintNeumoButton';


const isClient = () => typeof window !== 'undefined'


const Tracker =  React.memo(({engine,initialView,setInitialView, removeView,patients,readOnly=false}) =>{
  const [view, setView] = useImmer(initialView);
  const [originalView, setOriginalView] = useImmer(initialView);
  const t = useTranslation();
  const [loading, setLoading] = useState(true);
  const dataRef = useRef({})
  const scatterSeriesRef = useRef({})
  const sciChartSurfaceRef = useRef();
  const wasmContextRef = useRef();
  const subscriptionsRef = useRef([]);
  const xMetricsRef = useRef([]);
  const yMetricsRef = useRef([]);
  const readyToRecordRef = useRef([]);
  const counterRef = useRef([]);
  const [, updateState] = React.useState();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  const changingRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [viewNameEditing, setViewNameEditing] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);


  const addDataSeries = (item)=>{
    const {id} = item;
    dataRef.current[id] = new XyDataSeries(wasmContextRef.current);
    scatterSeriesRef.current[id] = new XyScatterRenderableSeries(wasmContextRef.current, { 
      pointMarker: new EllipsePointMarker(wasmContextRef.current, {
        width: 5,
        height: 5,
        strokeThickness: 2,
        fill: item.color,
        stroke: item.color
      }),
      dataSeries: dataRef.current[id],
    })
    sciChartSurfaceRef.current.renderableSeries.add(scatterSeriesRef.current[id])
    subscriptionsRef.current.push({id:item.id, patientId: item.patientId, subscriptionId: engine.subscribe(item.patientId)(update(item))})
    xMetricsRef.current[id]=new metrics[item.xMetric]();
    yMetricsRef.current[id]=new metrics[item.yMetric]();
    readyToRecordRef.current[id]=false;
    counterRef.current[id]=3;
  }


  const deleteDataSeries = (id) => {
    dataRef.current[id].delete()
    delete dataRef.current[id];
    sciChartSurfaceRef.current.renderableSeries.remove(scatterSeriesRef.current[id])
    delete scatterSeriesRef.current[id];
    delete xMetricsRef.current[id];
    delete yMetricsRef.current[id];
    try{
      const {patientId,subscriptionId} = subscriptionsRef.current.find(sub => sub.id==id);
      engine.unsubscribe(patientId)(subscriptionId);
    }catch(e){
      console.log(e)
    }
  }

  const initSciChart = async () => {
    SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY);
    SciChartSurface.configure({
      dataUrl: "/scichart2d.data",
      wasmUrl: "/scichart2d.wasm"
    })
    const { sciChartSurface, wasmContext } = await chartBuilder.buildChart("scichart-root"+initialView.id, {
      xAxes: {
        type: EAxisType.NumericAxis,
        options: {
          autoRange: EAutoRange.Always,
          drawMinorTickLines:false,
          drawMajorGridLines: false,
          drawMinorGridLines: false,
          growBy: new NumberRange(0.1,0.05),
          labelProvider: new NumericLabelProvider({
            labelPrecision: 1,
          })           
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
    sciChartSurface.zoomExtents();
  }  

  const update = ({id, recordingFrequency=1}) =>{
    const xVals = [];
    const yVals = [];
    return (data, time, hdprops) => {
      if(!dataRef.current[id]) return;
      if(!readyToRecordRef.current[id]) return;
      xMetricsRef.current[id]?.update(data,time,hdprops)
      yMetricsRef.current[id]?.update(data,time,hdprops)

      if(time > counterRef.current[id] * 60000 / hdprops['HR']){
        counterRef.current[id]+=recordingFrequency;
        const xVal = xMetricsRef.current[id]?.getMetric()||0;
        const yVal = yMetricsRef.current[id]?.getMetric()||0;
        xVals.push(xVal)
        yVals.push(yVal)
        if(xVals.length>7){
          xVals.shift()
          yVals.shift()
        }
        if(xVals.length==7){
          const xValAverage = xVals.reduce((a,b)=>a+b,0)/xVals.length
          const yValAverage = yVals.reduce((a,b)=>a+b,0)/yVals.length
          if (-10000< xVal && xVal <100000 && -10000< yVal && yVal <10000 && (xValAverage-xVal)/xValAverage<0.001 && (yValAverage-yVal)/yValAverage<0.001){
            console.log([xVal],[yVal])
            dataRef.current[id].appendRange([xVal],[yVal])
          }
        }
      }
    }
  }

  const changeSubscription = (item)=>{
    console.log(subscriptionsRef.current, item)
    const {id,patientId,subscriptionId} = subscriptionsRef.current.find(sub => sub.id==item.id);
    engine.unsubscribe(patientId)(subscriptionId);
    subscriptionsRef.current = subscriptionsRef.current.filter(sub => sub.subscriptionId!=item.subscriptionId);
    subscriptionsRef.current.push({id:item.id, patientId: item.patientId, subscriptionId: engine.subscribe(item.patientId)(update(item))})
  }

  const addNewItem = ()=>{
    const patientId = patients[0].id
    const hdp = getExcludeHdpList(patientId)[0];
    const label = getLabel(patientId,hdp);
    const id = nanoid()
    const newItem = {id,patientId,hdp,label,color: getRandomColor()}
    setView(draft => {draft.items.push(newItem)});
  }

  const getLabel = (patientId, hdp)=> t[hdp]+"("+patients.find(p=>p.id===patientId).name+")"
  const getExcludeHdpList = (patientId)=>{
    const existingItems = subscriptionsRef.current.filter(s=>s.patientId == patientId)
    return metricOptions.filter(pt => !existingItems.includes(pt)) 
  }

  useEffect(() => {
    (async ()=>{
      if(isClient){
        const isEnginePlaying = engine.isPlaying
        engine.setIsPlaying(false)
        await initSciChart()
        
        setView(initialView)
        for(let item of initialView.items){
          addDataSeries(item)
        }      
        setLoading(false)
        if(isEnginePlaying){
          engine.setIsPlaying(true);
        }
      }
    })();
    return ()=>{
      for(const {patientId, subscriptionId} of subscriptionsRef.current){
        engine.unsubscribe(patientId)(subscriptionId);
      }
      for(let item of view.items){
        if(!dataRef.current[item.id]){
          deleteDataSeries(item.id);
        }
      }
      sciChartSurfaceRef.current?.delete()
    }
  }, []);

  useEffect(() => {
    (async ()=>{
      if(sciChartSurfaceRef.current &&  wasmContextRef.current){
        const isEnginePlaying = engine.isPlaying
        engine.setIsPlaying(false)
        const oldItems = originalView.items.filter(oldItem => !initialView.items.some(item=> item.id===oldItem.id && item.xMetric === oldItem.xMetric && item.yMetric === oldItem.yMetric && item.recordingFrequency === oldItem.recordingFrequency && item.patientId === oldItem.patientId && item.color === oldItem.color))
        const newItems = initialView.items.filter(item => !originalView.items.some(oldItem=> oldItem.id==item.id && item.xMetric === oldItem.xMetric && item.yMetric === oldItem.yMetric && item.recordingFrequency === oldItem.recordingFrequency && item.patientId === oldItem.patientId && item.color === oldItem.color))
        for(let item of oldItems){
          if(!dataRef.current[item.id]){
            deleteDataSeries(item.id)
          }
        }
        for(let item of newItems){
          addDataSeries(item)
        }
        setOriginalView(initialView)
        setView(initialView)
        setLoading(false)
        if(isEnginePlaying){
          engine.setIsPlaying(true);
        }
      }
    })();
  }, [initialView.items]);

  return (
    <Box display='flex' justifyContent='center' alignItems='center' sx={{backgroundColor:'white', p:[0.5,2],py:2}}>
      <Box width={1} style={{opacity: loading ? 0 : 1}}>
        <Stack alignItems='center' sx={{zIndex: 100, position: "relative"}}>
          {isUpMd && <Stack direction="row" pr={1} pl={2} pb={1} justifyContent="center" sx={{width:1}}>
            {
              viewNameEditing && !readOnly ? 
                <ReactiveInput 
                  value={view.name} 
                  updateValue={(newValue)=>{
                    setInitialView({...view, name: newValue})
                    setView(draft=>{draft.name=newValue})
                    setViewNameEditing(false)
                  }} 
                  type="text"
                  autoFocus
                  allowEmpty
                /> : 
                <Typography variant="h6" fontWeight={isUpMd&&"bold"} onClick={()=>{setViewNameEditing(true)}} sx={{cursor: "pointer", color:!view.name&&"gray","&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"},ml:1,pr:1}}>{view.name || "View Title"}</Typography>                
            }            
            <div style={{flexGrow:1}}></div>
            {!readOnly && <>

              <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={()=>{setMenuAnchorEl(null)}} MenuListProps={{dense:true}}>
                <DeleteMenuItemWithDialog onDelete={()=>{removeView();setMenuAnchorEl(null)}} onClose={()=>{setMenuAnchorEl(null)}} message={"「"+(view?.name || "無題のグラフ") +"」を削除しようとしています。この操作は戻すことができません。"}/>
              </Menu>      
            </>}
          </Stack>}
          <div className='flex w-full'>
            <Grid container xs={12} spacing={1} justifyContent='flex-start' display='flex' sx={{pl:2}}>
              {view.items.map((item,i)=>(
                <Grid item justifyContent='center' alignItems='center' display='flex' key={item} style={{marginBottom:'-4px'}}> 
                  <FiberManualRecord sx={{color:item.color}} />
                  <Typography variant='subtitle2' noWrap>{item.label}</Typography>
                </Grid>
              ))}
            </Grid>
            {!readOnly && !isUpMd && <>
              <FaintNeumoButton size="small" onClick={e=>{setDialogOpen(true);changingRef.current=engine.isPlaying;engine.setIsPlaying(false)}} >
                <Tune/>
              </FaintNeumoButton>
              <FaintNeumoButton onClick={e=>{setMenuAnchorEl(e.currentTarget)}} size="small" sx={{ml:1,backgroundColor:"transparent !important"}}><ExpandMore/></FaintNeumoButton>
              <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={()=>{setMenuAnchorEl(null)}} MenuListProps={{dense:true}}>
                <DeleteMenuItemWithDialog onDelete={()=>{removeView();setMenuAnchorEl(null)}} onClose={()=>{setMenuAnchorEl(null)}} message={"グラフ「"+view?.name +"」を削除しようとしています。この操作は戻すことができません。"}/>
              </Menu>      
            </>}
          </div>
        </Stack>
        <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%'}}>
          <div id={"scichart-root"+initialView.id} style={{width: '100%',height:'100%'}}/>
        </Box>
        <Stack alignItems='center' spacing={1}>
          {view.items.map((item,index)=><>
            <Stack direction={isUpMd ?'row':'column'} justifyContent='center' alignItems='flex-start' spacing={1} p={1}>
              {isUpMd && <DragIndicator sx={{alignSelf:"center", mr:2,cursor:"pointer"}}/>}
              <ToggleButtonGroup
                color="primary"
                value={readyToRecordRef.current[item.id]}
                exclusive
                onChange={(e,v) => {readyToRecordRef.current[item.id]=v; forceUpdate()}}
                size="small"
                sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
              >
                <ToggleButton value={true}>{engine?.isPlaying ? "Recording" : "Ready"}</ToggleButton>
                <ToggleButton value={false}>Pause</ToggleButton>
              </ToggleButtonGroup>   
              <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>ラベル</Typography>
                <ReactiveInput value={item.label} 
                  updateValue={(newValue)=>{
                    setView(draft=>{draft.items[index].label=newValue})
                  }} 
                  type="text" 
                  required
                />  
              </Stack>              
              <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70} >患者</Typography>
                <NeumoSelect
                  id={item.patientId + "_" + item.hdp}
                  value={item.patientId}
                  required
                  onChange={(e)=>{
                    setView(draft=>{
                      const newItem = {...draft.items[index], patientId: e.target.value, label: getLabel(e.target.value,draft.items[index].hdp) }
                      draft.items[index] = newItem
                      changeSubscription(newItem)
                    }); }}
                 
                >
                  {patients.map(p=><MenuItem value={p.id} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{p.name || "無題の患者"}</MenuItem>)}
                </NeumoSelect>
              </Stack>
              <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>x軸</Typography>
                <NeumoSelect
                  id={item.id}
                  value={item.xMetric}
                  required
                  onChange={(e)=>{
                    setView(draft=>{
                      const newItem = {...draft.items[index], xMetric: e.target.value, label: getLabel(draft.items[index].patientId,e.target.value) }
                      draft.items[index] = newItem
                      xMetricsRef.current[item.id] = new metrics[e.target.value](); 
                    })}}
                  
                  sx={{minWidth: '110px'}}
                >
                  {metricOptions?.map(metricOption =><MenuItem value={metricOption} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{t[metricOption]}</MenuItem>)}
                </NeumoSelect> 
              </Stack>
              <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>y軸</Typography>
                <NeumoSelect
                  id={item.id}
                  value={item.yMetric}
                  required
                  onChange={(e)=>{
                    setView(draft=>{
                      const newItem = {...draft.items[index], yMetric: e.target.value, label: getLabel(draft.items[index].patientId,e.target.value) }
                      yMetricsRef.current[item.id] = new metrics[e.target.value](); 
                      draft.items[index] = newItem
                    })}}
                  
                  sx={{minWidth: '110px'}}
                >
                  {metricOptions?.map(metricOption =><MenuItem value={metricOption} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{t[metricOption]}</MenuItem>)}
                </NeumoSelect> 
              </Stack>              
              <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>カラー</Typography>
                <PopoverPicker 
                  color={item.color} 
                  onChange={newColor=>{
                    setView(draft=>{
                      draft.items[index] = {...draft.items[index], color:newColor}
                    })
                  }} 
                />
              </Stack>
              <IconButton sx={{ alignSelf: 'center'}} onClick={()=>{setView(draft=>{draft.items.splice(index,1)});}}>
                <Delete/>
              </IconButton>                                                     
            </Stack>
            <Divider light/>
          </>)}
        </Stack>
      </Box>
      <Box sx={{display: loading? 'block': 'none', zIndex:100, position: 'absolute'}}>
        <CircularProgress/>
      </Box>
    </Box>
  )
})

export default Tracker


