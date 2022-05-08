import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem,Tab,Divider,useMediaQuery, IconButton, CircularProgress,Button, alpha, Dialog,DialogActions,DialogContent,DialogTitle, Select, Menu} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';
import { makeStyles } from '@mui/styles';
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
import {FiberManualRecord,Tune, Delete, Add, DragIndicator, ExpandMore} from "@mui/icons-material"
import {LightTheme, COLORS, ALPHA_COLORS, DARKEN_COLORS,getRandomColor} from '../styles/chartConstants'
import {useTranslation} from '../hooks/useTranslation'
import { useImmer } from "use-immer";
import ReactiveInput from "../components/ReactiveInput";
import {PopoverPicker} from "../components/PopoverPicker"
import  DeleteMenuItemWithDialog from "../components/DeleteMenuItemWithDialog"
import { nanoid } from 'nanoid'


const PV_COUNT = 1000
const EDPVR_STEP = 50
const PVTypes = ['LV','LA','RV','RA']
const format = x => (Math.floor(x/20)+1.8)*20

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
const useStyles = makeStyles((theme) =>({
  neumoButton: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "rgb(69, 90, 100)",
    boxShadow: "0 2px 4px -2px #21253840",
    backgroundColor: "white",
    border: "1px solid rgba(92, 147, 187, 0.17)",
    fontWeight:"bold",
    "&:hover":{
      backgroundColor: "rgba(239, 246, 251, 0.6)",
      borderColor: "rgb(207, 220, 230)"
    }
  },
  neumoIconButton:{
    color:"#93a5b1",
    boxShadow:"0 0 2px #4b57a926, 0 10px 12px -4px #0009651a",
    width:"44px",
    height:"44px",
    backgroundColor:"white",
    borderRadius:"50%",
    transition:".3s",
    "&:hover":{
      boxShadow:"0 25px 25px -10px #00096540",
      transform: "translateY(-2px)",
      color: "#f76685",
      backgroundColor:"white",
    }
  },
  neumoSelect: {
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    border: '1px solid #5c93bb2b',
    '&:hover': {
        borderColor: '#3ea8ff',
    }, 
    "& .MuiOutlinedInput-notchedOutline":{border:"none"},
    "& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input":{paddingTop:"8px",paddingBottom:"8px"}
  },
  neumoSelectInvert: {
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    border: '1px solid #5c93bb2b',
    '&:hover': {
        borderColor: '#3ea8ff',
    }, 
    "& .MuiOutlinedInput-notchedOutline":{border:"none"},
    "& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input":{paddingTop:"8px",paddingBottom:"8px"}
  },
  faintNeumoButton: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "#b3b3b3",
    backgroundColor: "#f1f4f9",
    border: "none",
    "&:hover":{
      backgroundColor: "#fff2f2",
      color: "#ec407a"
    },
    "& .MuiOutlinedInput-notchedOutline": {border:"none"}
  },
}),
);

const PVPlot = React.memo(({engine,initialView,setInitialView,removeView,patients,readOnly=false}) =>{

  const [view, setView] = useImmer(initialView);
  const [originalView, setOriginalView] = useImmer(initialView);

  const t = useTranslation();
  const classes = useStyles();
  const [loading, setLoading] = useState(true);

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
  const subscriptionsRef = useRef([]);
  const changingRef = useRef(null);

  const xAxisRef = useRef();
  const yAxisRef = useRef();
  const yMaxRef = useRef({});
  const xMaxRef = useRef({});
  const yMaxPrevRef = useRef({});
  const xMaxPrevRef = useRef({});
  const tcRef = useRef({});
  const changedVisibleRange = useRef(false);
  const [autoScale, setAutoScale] = useState(true);
  const autoScaleRef = useRef(true);
  const [viewNameEditing, setViewNameEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const updateCounterRef = useRef(0);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [tabValue, setTabValue] = useState("0");
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);


  const addDataSeries = (item)=>{
    const {id,color} = item
    dataRef.current[id] = new XyDataSeries(wasmContextRef.current);
    leadingPointRef.current[id] = new XyDataSeries(wasmContextRef.current)
    espvrDataRef.current[id] = new XyDataSeries(wasmContextRef.current)
    edpvrDataRef.current[id] = new XyDataSeries(wasmContextRef.current)
    const fastLineSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: alpha(color, 0.5),
      strokeThickness: 3,
      dataSeries: dataRef.current[id],
      drawNaNAs:ELineDrawMode.PolyLine
    })
    const espvrSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: "#9c9c9c7a",
      strokeThickness: 2,
      dataSeries: espvrDataRef.current[id],
      drawNaNAs:ELineDrawMode.PolyLine
    })
    const edpvrSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
      stroke: "#9c9c9c7a",
      strokeThickness: 2,
      dataSeries: edpvrDataRef.current[id],
      drawNaNAs:ELineDrawMode.PolyLine
    })        
    const leadingSeries = new XyScatterRenderableSeries(wasmContextRef.current, {
        pointMarker: new EllipsePointMarker(wasmContextRef.current, {
            width: 8,
            height: 8,
            strokeThickness: 2,
            fill: color,
            stroke: color
        }),
        dataSeries: leadingPointRef.current[id],
    })    

    fastLineSeriesRef.current[id] = fastLineSeries
    scatterSeriesRef.current[id] = leadingSeries
    espvrLineSeriesRef.current[id] = espvrSeries
    edpvrLineSeriesRef.current[id] = edpvrSeries
    
    sciChartSurfaceRef.current.renderableSeries.add(fastLineSeries)
    sciChartSurfaceRef.current.renderableSeries.add(leadingSeries)
    sciChartSurfaceRef.current.renderableSeries.add(espvrSeries)
    sciChartSurfaceRef.current.renderableSeries.add(edpvrSeries)

    subscriptionsRef.current.push({id:item.id, patientId: item.patientId, subscriptionId: engine.subscribe(item.patientId)(update(item))})
  }

  const deleteDataSeries = (id) => {
    dataRef.current[id]?.delete();
    leadingPointRef.current[id]?.delete();
    espvrDataRef.current[id]?.delete();
    edpvrDataRef.current[id]?.delete();
    delete dataRef.current[id];
    delete leadingPointRef.current[id];
    delete espvrDataRef.current[id];
    delete edpvrDataRef.current[id];
    sciChartSurfaceRef.current.renderableSeries.remove(fastLineSeriesRef.current[id]);
    sciChartSurfaceRef.current.renderableSeries.remove(scatterSeriesRef.current[id]);
    sciChartSurfaceRef.current.renderableSeries.remove(espvrLineSeriesRef.current[id]);
    sciChartSurfaceRef.current.renderableSeries.remove(edpvrLineSeriesRef.current[id]);
    delete fastLineSeriesRef.current[id];
    delete scatterSeriesRef.current[id];
    delete espvrLineSeriesRef.current[id];
    delete edpvrLineSeriesRef.current[id];

    const {patientId,subscriptionId} = subscriptionsRef.current.find(sub => sub.id==id);
    engine.unsubscribe(patientId)(subscriptionId);
  }
  const initSciChart = async () => {
    SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY)
    SciChartSurface.configure( {
      dataUrl: "/scichart2d.data",
      wasmUrl: "/scichart2d.wasm"
    })
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(
      "scichart-pv-root"+initialView.id
    );
    sciChartSurfaceRef.current = sciChartSurface
    wasmContextRef.current = wasmContext
    sciChartSurface.applyTheme(LightTheme)
    const xAxis = new NumericAxis(wasmContext,{axisAlignment: EAxisAlignment.Bottom,autoRange: EAutoRange.Never,drawMinorTickLines:false});
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
  }  
  const update = (item) => {
    const {hdp,patientId, id} = item
    return (data, time, hdprops) => {
      const HR = hdprops["HR"];
      const tp = Math.floor(time/(60000/HR));
      const [_x, _y] = getPVSeriesFn(hdprops)[item.hdp](data)
      const len = _x.length
      const y = _y[len-1]
      const x = _x[len-1]
      if(dataRef.current[id].count()>PV_COUNT){
        dataRef.current[id].removeRange(0,len)
      }
      dataRef.current[id].appendRange(_x, _y)
      if(leadingPointRef.current[id].count()> 0){
        leadingPointRef.current[id].clear();
      }
      leadingPointRef.current[id].append(x,y);
      if(tp!=tcRef.current[id]){
        xMaxRef.current[id] = xMaxPrevRef.current[id];
        yMaxRef.current[id] = yMaxPrevRef.current[id];
        xMaxPrevRef.current[id]=0;
        yMaxPrevRef.current[id]=0;
        tcRef.current[id] = tp;
      }
      xMaxPrevRef.current[id] = Math.max(xMaxPrevRef.current[id],..._x);
      yMaxPrevRef.current[id] = Math.max(yMaxPrevRef.current[id],..._y);
      // xMaxPrevRef.current["All"]  = Math.max(xMaxPrevRef.current["All"],xMaxPrevRef.current[id]);
      // yMaxPrevRef.current["All"] = Math.max(yMaxPrevRef.current["All"],yMaxPrevRef.current[id]);
      // if(updateCounterRef.current % subscriptionsRef.current.length ==0){
      //   changedVisibleRange.current = false
      // }

      // if(tp!=tcRef.current[id] ){

      //   const newXMax = format(xMaxPrevRef.current["All"]);
      //   const newYMax= format(yMaxPrevRef.current["All"]);
      //   console.log("update", newXMax,newYMax,updateCounterRef.current % subscriptionsRef.current.length,tp, tcRef.current[id])
      //   if(newXMax != xMaxRef.current["All"] || newYMax != yMaxRef.current["All"]){
      //     changedVisibleRange.current =true;
      //   }
      //   if(newXMax != xMaxRef.current["All"]){
      //     xMaxRef.current["All"] = newXMax;
      //     if(newXMax && autoScaleRef.current){
      //       xAxisRef.current.visibleRange = new NumberRange(0,newXMax);
      //     }
      //   }
      //   if(newYMax !=yMaxRef.current["All"]){
      //     yMaxRef.current["All"] = newYMax;
      //     if(newYMax && autoScaleRef.current){
      //       yAxisRef.current.visibleRange = new NumberRange(0,newYMax);
      //     }
      //   }
      //   xMaxRef.current[id] = newXMax;
      //   yMaxRef.current[id] = newYMax;
      //   xMaxPrevRef.current[id]=0;
      //   yMaxPrevRef.current[id]=0;
      //   tcRef.current[id] = tp;
      // }
      // updateCounterRef.current=(updateCounterRef.current+1)%subscriptionsRef.current.length;
      
      const xMax = xMaxRef.current["All"];
      const yMax = yMaxRef.current["All"];
      const {alpha, beta, Ees, V0} = getHdProps[hdp](hdprops)
      // console.log(id,espvrDataRef.current[id].getXRange(),espvrDataRef.current[id].count())
      // console.log([V0,xMax],[0,Ees*(xMax-V0)],[V0,yMax/Ees+V0],[0,yMax])
      if(Ees!=EesRef.current[id] || changedVisibleRange.current || espvrDataRef.current[id].count()<=1){
        EesRef.current[id] = Ees;
        V0Ref.current[id] = V0;
        espvrDataRef.current[id].clear()
        if(Ees*(xMax-V0)<yMax){
          if(xMax && Ees*(xMax-V0) ){
            espvrDataRef.current[id].appendRange([V0,xMax],[0,Ees*(xMax-V0)])
          }
        }else{
          if(yMax/Ees && yMax ){
            espvrDataRef.current[id].appendRange([V0,yMax/Ees+V0],[0,yMax])
          }
        }
      }
      if(alpha!=alphaRef.current[id] || beta!=betaRef.current[id] || V0!=V0Ref.current[id] || changedVisibleRange.current || edpvrDataRef.current[id].count()<=1){
        alphaRef.current[id]= alpha
        betaRef.current[id] = beta
        V0Ref.current[id] = V0
        edpvrDataRef.current[id].clear()
        if(beta* (Math.exp(alpha * (xMax-V0))-1) < yMax){
          const stepSize = (xMax-V0)/EDPVR_STEP
          const px = [...(Array(EDPVR_STEP)).keys()].map(pxIndex => pxIndex*stepSize+V0)
          const py = px.map(_px=>beta* (Math.exp(alpha * (_px-V0))-1))
          edpvrDataRef.current[id].appendRange(px,py)
        }else{
          const stepSize = yMax/EDPVR_STEP
          const py = [...(Array(EDPVR_STEP)).keys()].map(pxIndex => pxIndex*stepSize)
          const px = py.map(_py=> Math.log1p(_py/beta)/alpha + V0) 
          edpvrDataRef.current[id].appendRange(px,py)
        }
      }      
    }
  }  
  const onDialogClose = () => {
    setDialogOpen(false);
    if(changingRef.current){
      engine.setIsPlaying(true)
    };
    changingRef.current=null;
  }
  const getLabel = (patientId, hdp)=> t[hdp]+"("+patients.find(p=>p.id===patientId).name+")"
  const getExcludeHdpList = (patientId)=>{
    const existingItems = subscriptionsRef.current.filter(s=>s.patientId == patientId)
    return PVTypes.filter(pt => !existingItems.includes(pt)) 
  }
  const addNewItem = ()=>{
    const patientId = patients[0].id
    const hdp = getExcludeHdpList(patientId)[0];
    const label = getLabel(patientId,hdp);
    const id = nanoid()
    const newItem = {id,patientId,hdp,label,color: getRandomColor()}
    setView(draft => {draft.items.push(newItem)});
  }

  useEffect(() => {
    const intervalId = setInterval(()=>{
      changedVisibleRange.current = false
      if(autoScaleRef.current ){
        const newXMax = Math.max(...Object.values(xMaxRef.current))
        if(newXMax != xMaxRef.current["All"] && newXMax){
          xAxisRef.current.visibleRange = new NumberRange(0,format(newXMax));
          xMaxRef.current["All"] = format(newXMax);
          changedVisibleRange.current =true;
        }
        const newYMax = Math.max(...Object.values(yMaxRef.current))
        if(newYMax != yMaxRef.current["All"] && newYMax){
          yAxisRef.current.visibleRange = new NumberRange(0,format(newYMax));
          yMaxRef.current["All"] = format(newYMax);
          changedVisibleRange.current =true;
        }
      }
    },200)
    return () => {
      if(intervalId){
        clearInterval(intervalId)
      }
    }
  }, []);

  useEffect(() => {
    (async ()=>{
      const isEnginePlaying = engine.isPlaying
      engine.setIsPlaying(false)
      const oldItems = originalView.items.filter(oldItem => !initialView.items.some(item=> item.id===oldItem.id && item.hdp === oldItem.hdp && item.patientId === oldItem.patientId && item.color === oldItem.color))
      const newItems = initialView.items.filter(item => !originalView.items.some(oldItem=> oldItem.id==item.id && item.hdp === oldItem.hdp && item.patientId === oldItem.patientId && item.color === oldItem.color))
      for(let item of oldItems){
        deleteDataSeries(item.id)
      }
      for(let item of newItems){
        addDataSeries(item)
      }
      updateCounterRef.current=0;
      setOriginalView(initialView)
      setView(initialView)
      setLoading(false)
      if(isEnginePlaying){
        engine.setIsPlaying(true);
      }
      
    })();
  }, [initialView.items]);


  useEffect(() => {
    (async ()=>{
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
    })();
    return ()=>{
      for(const {patientId, subscriptionId} of subscriptionsRef.current){
        engine.unsubscribe(patientId)(subscriptionId);
      }
      for(let item of view.items){
        deleteDataSeries(item.id);
      }
      sciChartSurfaceRef.current?.delete()
    }
  }, []);


  return (
    <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{position: 'relative',backgroundColor:'white', p:[0.5,2],py:2}}>
      <Box width={1} style={{opacity: loading ? 0 : 1}}>
        <Stack alignItems='center' sx={{zIndex: 100, position: "relative"}}>
          <Stack direction="row" pr={1} pl={2} pb={{xs:1,md:1}} justifyContent="center" sx={{width:1}}>
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
                /> : 
                <Typography variant="h6" fontWeight={isUpMd&&"bold"} onClick={()=>{setViewNameEditing(true)}} sx={{cursor: "pointer"}}>{view.name || "無題のグラフ"}</Typography>                
            }
            <div style={{flexGrow:1}}></div>   
            {!readOnly && <>
              <IconButton size="small" className={classes.faintNeumoButton} onClick={e=>{setDialogOpen(true);changingRef.current=engine.isPlaying;engine.setIsPlaying(false)}}>
                <Tune/>
              </IconButton>
              <IconButton onClick={e=>{setMenuAnchorEl(e.currentTarget)}} size="small" className={classes.faintNeumoButton} sx={{ml:1,backgroundColor:"transparent !important"}}><ExpandMore/></IconButton>
              <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={()=>{setMenuAnchorEl(null)}} MenuListProps={{dense:true}}>
                <DeleteMenuItemWithDialog onDelete={()=>{removeView();setMenuAnchorEl(null)}} onClose={()=>{setMenuAnchorEl(null)}} message={"グラフ「"+view?.name +"」を削除しようとしています。この操作は戻すことができません。"}/>
              </Menu>
            </>}
          </Stack> 
          <Grid container xs={12} spacing={1} justifyContent='flex-start' display='flex' sx={{pl:2}}>
            {initialView.items.map((item,i)=>(
              <Grid item justifyContent='center' alignItems='center' display='flex' key={item} style={{marginBottom:'-4px'}}> 
                <FiberManualRecord sx={{color:item.color}} />
                <Typography variant='subtitle2' noWrap>{item.label}</Typography>
              </Grid>
            ))}
          </Grid>
          <Dialog open={dialogOpen} onClose={onDialogClose} maxWidth='md' sx={{minHeight:'340px',"& .MuiDialog-paper":{minWidth : isUpMd ? "800px": "100%"}}} >
            <DialogTitle  sx={{ borderBottom: isUpMd ? 1:0, borderColor: 'divider',"& .MuiOutlinedInput-input.MuiInputBase-input":{fontWeight:"bold"}}}>
              {
                viewNameEditing ? 
                  <ReactiveInput 
                    value={view.name} 
                    updateValue={(newValue)=>{
                      setView(draft=>{draft.name=newValue})
                      setViewNameEditing(false)
                    }} 
                    type="text" autoFocus
                  /> : 
                  <Typography variant="h5" fontWeight="bold" onClick={()=>{setViewNameEditing(true)}} sx={{cursor: "pointer"}}>{view.name}</Typography>                
              }
            </DialogTitle>
            <DialogContent>
              <Box display={isUpMd && 'flex'}>
                <TabContext value={tabValue}>
                  <TabList onChange={(e,v)=>{setTabValue(v)}} orientation={isUpMd ? "vertical" : "horizontal"} sx={{mt:{xs:0,md:2}}}>
                    <Tab label="項目選択" value="0"/>
                    <Tab label="表示設定" value="1"/>
                  </TabList>
                  <Divider sx={{mb:2}}/>
                  <TabPanel value="0" sx={{p:{xs:0,md:3},pt:{md:1}}}>
                    <Box>
                      <Stack spacing={1}>
                        {view.items.map((item,index)=><>
                          <Stack direction={isUpMd ?'row':'column'} justifyContent='center' alignItems='flex-start' spacing={1} p={1}>
                            {isUpMd && <DragIndicator sx={{alignSelf:"center", mr:2,cursor:"pointer"}}/>}
                            <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                              <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70} >患者</Typography>
                              <Select
                                id={item.patientId + "_" + item.hdp}
                                value={item.patientId}
                                required
                                onChange={(e)=>{
                                  setView(draft=>{
                                    const newItem = {...draft.items[index],id:nanoid(), patientId: e.target.value, label: getLabel(e.target.value,draft.items[index].hdp) }
                                    draft.items[index] = newItem
                                  })}}
                                className={classes.neumoSelect}
                              >
                                {patients.map(p=><MenuItem value={p.id} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{p.name}</MenuItem>)}
                              </Select>
                            </Stack>
                            <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                              <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>表示項目</Typography>
                              <Select
                                id={item.id}
                                value={item.hdp}
                                required
                                onChange={(e)=>{
                                  setView(draft=>{
                                    const newItem = {...draft.items[index],id:nanoid(), hdp: e.target.value, label: getLabel(draft.items[index].patientId,e.target.value) }
                                    draft.items[index] = newItem
                                  })}}
                                className={classes.neumoSelect}
                                sx={{minWidth: '110px'}}
                              >
                                {PVTypes.map(hdpOption =><MenuItem value={hdpOption} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{t[hdpOption]}</MenuItem>)}
                              </Select> 
                            </Stack>
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
                              <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>カラー</Typography>
                              <PopoverPicker 
                                color={item.color} 
                                onChange={newColor=>{
                                  setView(draft=>{
                                    draft.items[index] = {...draft.items[index], id:nanoid(), color:newColor}
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
                        <Box width={1} display="flex" p={1}>
                          <Button onClick={addNewItem} startIcon={<Add/>} className={classes.neumoButton}>追加する</Button>
                        </Box>            
                      </Stack>
                    </Box>
                  </TabPanel>
                  <TabPanel value="1">
                  </TabPanel>
                </TabContext>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={async ()=>{
                setInitialView(view);
                onDialogClose()
              }} >
                {t["Save"]}
              </Button>              
              <Button onClick={()=>{setView(initialView);onDialogClose()}} >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>

        </Stack>
        <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%',aspectRatio: '2 / 1.3'}}>
          <div id={"scichart-pv-root"+initialView.id} style={{width: '100%',height:'100%'}}></div>
        </Box>
      </Box>
      <Box sx={{display: loading  ? 'block': 'none', zIndex:100, position: 'absolute'}}>
        <CircularProgress/>
      </Box>
    </Box>
  )
})

export default PVPlot

