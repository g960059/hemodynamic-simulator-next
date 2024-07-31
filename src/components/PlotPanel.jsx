import React, { useRef, useState, useEffect} from 'react'
import {Box,Typography, Popover, CircularProgress} from '@mui/material'
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import { XyScatterRenderableSeries } from "scichart/Charting/Visuals/RenderableSeries/XyScatterRenderableSeries";
import { EllipsePointMarker } from "scichart/Charting/Visuals/PointMarkers/EllipsePointMarker";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {LightTheme, } from '../styles/chartConstants'
import { useImmer } from "use-immer";
import { metrics } from '../utils/metrics'
import  DeleteMenuItemWithDialog from "../components/DeleteMenuItemWithDialog"
import { EDragMode, MouseWheelZoomModifier, XAxisDragModifier, YAxisDragModifier, ZoomExtentsModifier, ZoomPanModifier, easing } from 'scichart';
import PlotDialog from './PlotDialog';
import {z} from 'zod'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "./ui/tooltip"

const PlotPanel = React.memo(({engine,view : initialView,updateView: updateViewParent,removeView,patients,isOwner}) =>{
  const [view, setView] = useImmer(initialView);
  const [originalView, setOriginalView] = useImmer(initialView);

  const [loading, setLoading] = useState(true);

  const dataRef = useRef({})
  const scatterSeriesRef = useRef({});

  const sciChartSurfaceRef = useRef();
  const wasmContextRef = useRef();
  const subscriptionsRef = useRef([]);
  const timeCounter = useRef({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState();

  const xMetricsRef = useRef({});
  const yMetricsRef = useRef({});
  const xAxisRef = useRef();
  const yAxisRef = useRef();
  const [isRecording, setIsRecording] = useState(false);




  const deleteDataSeries = (id) => {
    dataRef.current[id]?.delete()
    delete dataRef.current[id];
    sciChartSurfaceRef.current?.renderableSeries?.remove(scatterSeriesRef.current[id])
    delete scatterSeriesRef.current[id];
    delete xMetricsRef.current[id];
    delete yMetricsRef.current[id];
    try{
      const res =  subscriptionsRef.current.find(sub => sub.id==id);
      if(!res) return;
      const {patientId,subscriptionId} = res
      engine.unsubscribe(patientId)(subscriptionId);
    }catch(e){
      console.log(e)
    }
  }

  const initSciChart = async () => {
    SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY)
    SciChartSurface.configure( {
      dataUrl: "/scichart2d.data",
      wasmUrl: "/scichart2d.wasm"
    })
    const { sciChartSurface, wasmContext } = await SciChartSurface.create(
      "scichart-plot"+view.id
    );
    sciChartSurfaceRef.current = sciChartSurface
    wasmContextRef.current = wasmContext
    sciChartSurface.applyTheme(LightTheme)
    const xAxis = new NumericAxis(wasmContext,{autoRange: EAutoRange.Always,drawMinorTickLines:false});
    const yAxis = new NumericAxis(wasmContext,{axisAlignment: EAxisAlignment.Left,autoRange: EAutoRange.Always, drawMinorTickLines:false});
    xAxis.drawMajorGridLines =false;
    xAxis.drawMinorGridLines =false;
    yAxis.drawMinorGridLines =false;    
    yAxis.axisBorder = {
      borderRight: 1,
      color: "#e5e5e5"
    };
    yAxis.growBy = new NumberRange(0.1, 0.05);
    xAxis.growBy = new NumberRange(0.1, 0.05);
    xAxis.axisTitleStyle={
      fontSize: 16,
      color: "#292c32"
    }
    yAxis.axisTitleStyle={
      fontSize: 16,
      color: "#292c32"
    }
    if(view.axis?.left?.title) yAxis.axisTitle = view.axis?.left?.title
    if(view.axis?.bottom?.title) xAxis.axisTitle = view.axis?.bottom?.title
    if(view.axis?.left?.precision) yAxis.labelProvider.precision= view.axis?.left?.precision
    if(view.axis?.bottom?.precision) xAxis.labelProvider.precision= view.axis?.bottom?.precision
    if(view.axis?.left?.postfix) yAxis.labelProvider.postfix= view.axis?.left?.postfix
    if(view.axis?.bottom?.postfix) xAxis.labelProvider.postfix= view.axis?.bottom?.postfix
    xAxisRef.current = xAxis
    yAxisRef.current = yAxis
    sciChartSurface.xAxes.add(xAxis);
    sciChartSurface.yAxes.add(yAxis);
  //   sciChartSurface.chartModifiers.add(
  //     new YAxisDragModifier({
  //       dragMode: EDragMode.Scaling,
  //     }),
  //     new XAxisDragModifier({
  //       dragMode: EDragMode.Scaling,
  //     }),
  //     new ZoomPanModifier({ 
  //       isAnimated: true,
  //       animationDuration: 400,
  //       easingFunction: easing.outExpo
  //    }),
  //     new MouseWheelZoomModifier({
  //       growFactor: 0.001
  //     }),
  //     new ZoomExtentsModifier({ 
  //       isAnimated: true,
  //       animationDuration: 400,
  //       easingFunction: easing.outExpo
  //    })
  // );

  }  
  const addDataSeries = (item, xValues=[], yValues=[], fifoCapacity=null)=>{
    const {id} = item;
    dataRef.current[id] = fifoCapacity ? new XyDataSeries(wasmContextRef.current, {xValues, yValues, fifoCapacity}) : new XyDataSeries(wasmContextRef.current, {xValues, yValues});
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
    xMetricsRef.current[id]=new metrics[item.xSource]();
    yMetricsRef.current[id]=new metrics[item.ySource]();
    timeCounter.current[id] = 0;
  }  

  const stopSubscripton = (id) =>{
    const {patientId,subscriptionId} = subscriptionsRef.current.find(sub => sub.id==id);
    engine.unsubscribe(patientId)(subscriptionId);
    subscriptionsRef.current = subscriptionsRef.current.filter(sub => sub.id!=id);
  }
  const startSubscripton = (item) =>{
    const {id,patientId} = item
    subscriptionsRef.current.push({id:id, patientId: patientId, subscriptionId: engine.subscribe(patientId)(update(item))})
  }

  const handleRecording = () =>{
    if(isRecording){
      for(let item of view.items){
        stopSubscripton(item.id)
      }
      setIsRecording(false)
    }else{
      for(let item of view.items){
        startSubscripton(item)
      }
      setIsRecording(true)
    }
  }

  const update = (item) =>{
    const {id} = item
    return (data, time, hdprops) => {
      if(!dataRef.current[id] ) return;
      xMetricsRef.current[id]?.update(data,time,hdprops)
      yMetricsRef.current[id]?.update(data,time,hdprops)
      let current = Math.floor(time / view.interval);
      if(timeCounter.current[id] != current){
        const xVal = xMetricsRef.current[id]?.getMetric();
        const yVal = yMetricsRef.current[id]?.getMetric();
        if(xVal && yVal){
          dataRef.current[id].append(xVal,yVal)
        }
        timeCounter.current[id] = current;
      }
    }
  }

  useEffect(() => {
    (async ()=>{
      if(typeof window !== 'undefined'){
        const isEnginePlaying = engine.isPlaying
        engine.setIsPlaying(false)
        await initSciChart()
        setView(initialView)
        for(let item of initialView.items){
          addDataSeries(item)
        }    
        if(initialView.autoStart){
          for(let item of initialView.items){
            startSubscripton(item)
          }
          setIsRecording(true)
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

  const numericParser = z.number()

  const updateView = (newView)=>{
    updateViewParent(newView);
    setView(newView)

    if(sciChartSurfaceRef.current &&  wasmContextRef.current){
      const isEnginePlaying = engine.isPlaying
      engine.setIsPlaying(false)
      const oldItems = originalView.items.filter(oldItem => !newView.items.some(item=> item.id===oldItem.id && item.xSource === oldItem.xSource && item.ySource === oldItem.ySource && item.patientId === oldItem.patientId && item.color === oldItem.color))
      const newItems = newView.items.filter(item => !originalView.items.some(oldItem=> oldItem.id==item.id && item.xSource === oldItem.xSource && item.ySource === oldItem.ySource && item.patientId === oldItem.patientId && item.color === oldItem.color))
      for(let item of oldItems){
        deleteDataSeries(item.id)
      }
      for(let item of newItems){
        addDataSeries(item)
      }
      xAxisRef.current.axisTitle = newView.axis?.bottom?.title
      yAxisRef.current.axisTitle = newView.axis?.left?.title
      yAxisRef.current.labelProvider.precision= newView.axis?.left?.precision
      xAxisRef.current.labelProvider.precision= newView.axis?.bottom?.precision
      yAxisRef.current.labelProvider.postfix= newView.axis?.left?.postfix
      xAxisRef.current.labelProvider.postfix= newView.axis?.bottom?.postfix
      
      const parsedBottomMin = numericParser.safeParse(Number(newView.axis?.bottom?.min))
      const parsedBottomMax = numericParser.safeParse(Number(newView.axis?.bottom?.max))
      const parsedLeftMin = numericParser.safeParse(Number(newView.axis?.left?.min))
      const parsedLeftMax = numericParser.safeParse(Number(newView.axis?.left?.max))
      if(!newView.axis.bottom.autoScale && parsedBottomMin.success && parsedBottomMax.success && parsedBottomMin.data < parsedBottomMax.data){
        xAxisRef.current.visibleRange = new NumberRange(parsedBottomMin.data, parsedBottomMax.data)
        xAxisRef.current.autoRange = EAutoRange.Never
      }else{
        xAxisRef.current.autoRange = EAutoRange.Always
      }
      if(!newView.axis.left.autoScale && parsedLeftMin.success && parsedLeftMax.success && parsedLeftMin.data < parsedLeftMax.data){
        yAxisRef.current.visibleRange = new NumberRange( parsedLeftMin.data, parsedLeftMax.data)
        yAxisRef.current.autoRange = EAutoRange.Never
      }else{
        yAxisRef.current.autoRange = EAutoRange.Always
      }
      if(originalView.fifoCapacity != newView.fifoCapacity){
        for(let item of newView.items){
          const xGetter = dataRef.current[item.id]?.getNativeXValues()
          const yGetter = dataRef.current[item.id]?.getNativeYValues()
          const xValues = xGetter ?  [...Array(dataRef.current[item.id].count()).keys()].map(i=>xGetter.get(i)) :[]
          const yValues = yGetter ? [...Array(dataRef.current[item.id].count()).keys()].map(i=>yGetter.get(i)) : []
          if( newView.fifoCapacity > 0){
            deleteDataSeries(item.id)
            addDataSeries(item, xValues, yValues, newView.fifoCapacity)
          }else{
            deleteDataSeries(item.id)
            addDataSeries(item, xValues, yValues)
          }
          if(isRecording){
            stopSubscripton(item.id)
            startSubscripton(item)
          }
        }   
      }
      setOriginalView(view)
      setLoading(false)
      if(isEnginePlaying){
        engine.setIsPlaying(true);
      }
    }
  }

  const clearData = ()=> {
    for(let item of view.items){
      dataRef.current[item.id].clear()
    }
  }



  return (
    <div className="w-full h-full">
      <div className="w-full h-full" style={{opacity: loading ? 0 : 1}}>
        <div className='flex p-2 pb-1 pl-4 mb-2 border-solid border-0 border-b border-b-slate-200'>
          <div className='draggable cursor-move font-bold text-base md:text-lg pl-1 whitespace-nowrap overflow-x-auto'>{view?.name || ""}</div>
          <div className='draggable cursor-move flex-grow'></div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={clearData} className="mr-2 py-1 px-2 rounded-md text-slate-600 cursor-pointer stroke-slate-600 fill-slate-600 bg-slate-100 hover:bg-slate-200  transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24"  stroke="currentColor"><path d="M5.662 23l-5.369-5.365c-.195-.195-.293-.45-.293-.707 0-.256.098-.512.293-.707l14.929-14.928c.195-.194.451-.293.707-.293.255 0 .512.099.707.293l7.071 7.073c.196.195.293.451.293.708 0 .256-.097.511-.293.707l-11.216 11.219h5.514v2h-12.343zm3.657-2l-5.486-5.486-1.419 1.414 4.076 4.072h2.829zm6.605-17.581l-10.677 10.68 5.658 5.659 10.676-10.682-5.657-5.657z"/></svg>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>記録を消去</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleRecording} type="button" className='text-slate-700  cursor-pointer py-1 px-2 md:px-3 text-sm rounded-md items-center border-none bg-slate-100 hover:bg-slate-200  transition'>
                  {isRecording ? <span className="relative inline-flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span > :
                  <span className="relative inline-flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-900"></span>
                  </span>
                  }
                  {/* <div className='inline-block ml-2'>{isRecording ? "Stop" : "Start"}</div> */}
                </button>                 
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRecording ? "記録を停止" : "記録を開始"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>                  
             
          {isOwner && <div className='p-1 px-3 -my-2 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition' onClick={e => { setAnchorEl(e.currentTarget)}}>
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </div>}
        </div>
        <Popover 
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={(e)=>{setAnchorEl(null)}}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          elevation={0}
          marginThreshold={0}
          slotProps={{paper:{className:'border border-solid border-slate-200 rounded shadow-md'}}}
        >
          <div className='flex flex-col items-center justify-center py-2'>
            <div onClick={()=> {setDialogOpen(true); setAnchorEl(null)}} 
              className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
            >
              <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </div>
            <DeleteMenuItemWithDialog raw onDelete={()=>{removeView()}} onClose={()=>setAnchorEl(null)} message ={"「"+(view?.name || "Chart") + "」を削除しようとしています。この操作は戻すことができません。"}>
              <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1  text-red-500 hover:bg-red-500 hover:text-white">
                <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>                                
                Delete
              </div>
            </DeleteMenuItemWithDialog>
          </div>
        </Popover>
        <PlotDialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} initialView={view} updateView={updateView} patients={patients}/>
        
        <div className='pl-4 flex flex-row w-full'>
          <div className='flex flex-row px-4 pt-2 flex-wrap space-x-2'>
            {view.items.map((item,i)=>(
              <div className='flex flex-row items-center justify-center' key={item.id} > 
                <div className='w-3 h-3 rounded-full mr-0.5' style={{ backgroundColor: item.color}} />
                <span className='text-sm'>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div id={"scichart-plot"+view.id} style={{width: '100%',height:"calc(100% - 76px)", aspectRatio : "auto"}}/>
      </div>
      <Box sx={{display: loading  ? 'block': 'none', zIndex:100, position: 'absolute'}}>
        <CircularProgress/>
      </Box>
    </div>
  )
})

export default PlotPanel






// import React, { useRef, useState, useEffect, useCallback} from 'react'
// import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, IconButton,MenuList,ListItemIcon,Tab, CircularProgress,Select,FormControl,InputLabel, useMediaQuery, ToggleButtonGroup, ToggleButton} from '@mui/material'
// import {Tune,Delete,Add,DragIndicator,ExpandMore} from '@mui/icons-material';
// import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
// import { chartBuilder } from "scichart/Builder/chartBuilder";
// import {XyScatterRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/XyScatterRenderableSeries";
// import { EllipsePointMarker } from "scichart/Charting/Visuals/PointMarkers/EllipsePointMarker";
// import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
// import {EAxisAlignment} from "scichart/types/AxisAlignment";
// import { EAxisType } from "scichart/types/AxisType";
// import {EAutoRange} from "scichart/types/AutoRange";
// import { NumberRange } from "scichart/Core/NumberRange";
// import {NumericLabelProvider} from "scichart/Charting/Visuals/Axis/LabelProvider/NumericLabelProvider";

// import {FiberManualRecord,MoreVert,Check} from "@mui/icons-material"
// import {LightTheme, COLORS, ALPHA_COLORS,getRandomColor} from '../styles/chartConstants'
// import { useTranslation } from '../hooks/useTranslation';
// import { useImmer } from "use-immer";
// import ReactiveInput from "../components/ReactiveInput";
// import  DeleteMenuItemWithDialog from "../components/DeleteMenuItemWithDialog"
// import { nanoid } from 'nanoid'
// import { metrics, metricOptions } from '../utils/metrics'
// import NeumoSelect from '../elements/NeumoSelect';
// import FaintNeumoButton from '../elements/FaintNeumoButton';


// const isClient = () => typeof window !== 'undefined'


// const PlotPanel =  React.memo(({engine,initialView,setInitialView, removeView,patients,readOnly=false}) =>{
//   const [view, setView] = useImmer(initialView);
//   const [originalView, setOriginalView] = useImmer(initialView);
//   const t = useTranslation();
//   const [loading, setLoading] = useState(true);
//   const dataRef = useRef({})
//   const scatterSeriesRef = useRef({})
//   const sciChartSurfaceRef = useRef();
//   const wasmContextRef = useRef();
//   const subscriptionsRef = useRef([]);

//   const readyToRecordRef = useRef([]);
//   const counterRef = useRef([]);
//   const [, updateState] = React.useState();
//   const forceUpdate = React.useCallback(() => updateState({}), []);

//   const changingRef = useRef(null);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
//   const [viewNameEditing, setViewNameEditing] = useState(false);
//   const [menuAnchorEl, setMenuAnchorEl] = useState(null);










//   const changeSubscription = (item)=>{
//     console.log(subscriptionsRef.current, item)
//     const {id,patientId,subscriptionId} = subscriptionsRef.current.find(sub => sub.id==item.id);
//     engine.unsubscribe(patientId)(subscriptionId);
//     subscriptionsRef.current = subscriptionsRef.current.filter(sub => sub.subscriptionId!=item.subscriptionId);
//     subscriptionsRef.current.push({id:item.id, patientId: item.patientId, subscriptionId: engine.subscribe(item.patientId)(update(item))})
//   }

//   const addNewItem = ()=>{
//     const patientId = patients[0].id
//     const hdp = getExcludeHdpList(patientId)[0];
//     const label = getLabel(patientId,hdp);
//     const id = nanoid()
//     const newItem = {id,patientId,hdp,label,color: getRandomColor()}
//     setView(draft => {draft.items.push(newItem)});
//   }

//   const getLabel = (patientId, hdp)=> t[hdp]+"("+patients.find(p=>p.id===patientId).name+")"
//   const getExcludeHdpList = (patientId)=>{
//     const existingItems = subscriptionsRef.current.filter(s=>s.patientId == patientId)
//     return metricOptions.filter(pt => !existingItems.includes(pt)) 
//   }

//   useEffect(() => {
//     (async ()=>{
//       if(isClient){
//         const isEnginePlaying = engine.isPlaying
//         engine.setIsPlaying(false)
//         await initSciChart()
        
//         setView(initialView)
//         for(let item of initialView.items){
//           addDataSeries(item)
//         }      
//         setLoading(false)
//         if(isEnginePlaying){
//           engine.setIsPlaying(true);
//         }
//       }
//     })();
//     return ()=>{
//       for(const {patientId, subscriptionId} of subscriptionsRef.current){
//         engine.unsubscribe(patientId)(subscriptionId);
//       }
//       for(let item of view.items){
//         if(!dataRef.current[item.id]){
//           deleteDataSeries(item.id);
//         }
//       }
//       sciChartSurfaceRef.current?.delete()
//     }
//   }, []);



//   return (
//     <Box display='flex' justifyContent='center' alignItems='center' sx={{backgroundColor:'white', p:[0.5,2],py:2}}>
//       <Box width={1} style={{opacity: loading ? 0 : 1}}>
//         <Stack alignItems='center' sx={{zIndex: 100, position: "relative"}}>
//           {isUpMd && <Stack direction="row" pr={1} pl={2} pb={1} justifyContent="center" sx={{width:1}}>
//             {
//               viewNameEditing && !readOnly ? 
//                 <ReactiveInput 
//                   value={view.name} 
//                   updateValue={(newValue)=>{
//                     setInitialView({...view, name: newValue})
//                     setView(draft=>{draft.name=newValue})
//                     setViewNameEditing(false)
//                   }} 
//                   type="text"
//                   autoFocus
//                   allowEmpty
//                 /> : 
//                 <Typography variant="h6" fontWeight={isUpMd&&"bold"} onClick={()=>{setViewNameEditing(true)}} sx={{cursor: "pointer", color:!view.name&&"gray","&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"},ml:1,pr:1}}>{view.name || "View Title"}</Typography>                
//             }            
//             <div style={{flexGrow:1}}></div>
//             {!readOnly && <>

//               <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={()=>{setMenuAnchorEl(null)}} MenuListProps={{dense:true}}>
//                 <DeleteMenuItemWithDialog onDelete={()=>{removeView();setMenuAnchorEl(null)}} onClose={()=>{setMenuAnchorEl(null)}} message={"「"+(view?.name || "無題のグラフ") +"」を削除しようとしています。この操作は戻すことができません。"}/>
//               </Menu>      
//             </>}
//           </Stack>}
//           <div className='flex w-full'>
//             <Grid container xs={12} spacing={1} justifyContent='flex-start' display='flex' sx={{pl:2}}>
//               {view.items.map((item,i)=>(
//                 <Grid item justifyContent='center' alignItems='center' display='flex' key={item} style={{marginBottom:'-4px'}}> 
//                   <FiberManualRecord sx={{color:item.color}} />
//                   <Typography variant='subtitle2' noWrap>{item.label}</Typography>
//                 </Grid>
//               ))}
//             </Grid>
//             {!readOnly && !isUpMd && <>
//               <FaintNeumoButton size="small" onClick={e=>{setDialogOpen(true);changingRef.current=engine.isPlaying;engine.setIsPlaying(false)}} >
//                 <Tune/>
//               </FaintNeumoButton>
//               <FaintNeumoButton onClick={e=>{setMenuAnchorEl(e.currentTarget)}} size="small" sx={{ml:1,backgroundColor:"transparent !important"}}><ExpandMore/></FaintNeumoButton>
//               <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={()=>{setMenuAnchorEl(null)}} MenuListProps={{dense:true}}>
//                 <DeleteMenuItemWithDialog onDelete={()=>{removeView();setMenuAnchorEl(null)}} onClose={()=>{setMenuAnchorEl(null)}} message={"グラフ「"+view?.name +"」を削除しようとしています。この操作は戻すことができません。"}/>
//               </Menu>      
//             </>}
//           </div>
//         </Stack>
//         <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%'}}>
//           <div id={"scichart-root"+initialView.id} style={{width: '100%',height:'100%'}}/>
//         </Box>
//         <Stack alignItems='center' spacing={1}>
//           {view.items.map((item,index)=><>
//             <Stack direction={isUpMd ?'row':'column'} justifyContent='center' alignItems='flex-start' spacing={1} p={1}>
//               {isUpMd && <DragIndicator sx={{alignSelf:"center", mr:2,cursor:"pointer"}}/>}
//               <ToggleButtonGroup
//                 color="primary"
//                 value={readyToRecordRef.current[item.id]}
//                 exclusive
//                 onChange={(e,v) => {readyToRecordRef.current[item.id]=v; forceUpdate()}}
//                 size="small"
//                 sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
//               >
//                 <ToggleButton value={true}>{engine?.isPlaying ? "Recording" : "Ready"}</ToggleButton>
//                 <ToggleButton value={false}>Pause</ToggleButton>
//               </ToggleButtonGroup>   
//               <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
//                 <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>ラベル</Typography>
//                 <ReactiveInput value={item.label} 
//                   updateValue={(newValue)=>{
//                     setView(draft=>{draft.items[index].label=newValue})
//                   }} 
//                   type="text" 
//                   required
//                 />  
//               </Stack>              
//               <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
//                 <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70} >患者</Typography>
//                 <NeumoSelect
//                   id={item.patientId + "_" + item.hdp}
//                   value={item.patientId}
//                   required
//                   onChange={(e)=>{
//                     setView(draft=>{
//                       const newItem = {...draft.items[index], patientId: e.target.value, label: getLabel(e.target.value,draft.items[index].hdp) }
//                       draft.items[index] = newItem
//                       changeSubscription(newItem)
//                     }); }}
                 
//                 >
//                   {patients.map(p=><MenuItem value={p.id} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{p.name || "無題の患者"}</MenuItem>)}
//                 </NeumoSelect>
//               </Stack>
//               <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
//                 <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>x軸</Typography>
//                 <NeumoSelect
//                   id={item.id}
//                   value={item.xMetric}
//                   required
//                   onChange={(e)=>{
//                     setView(draft=>{
//                       const newItem = {...draft.items[index], xMetric: e.target.value, label: getLabel(draft.items[index].patientId,e.target.value) }
//                       draft.items[index] = newItem
//                       xMetricsRef.current[item.id] = new metrics[e.target.value](); 
//                     })}}
                  
//                   sx={{minWidth: '110px'}}
//                 >
//                   {metricOptions?.map(metricOption =><MenuItem value={metricOption} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{t[metricOption]}</MenuItem>)}
//                 </NeumoSelect> 
//               </Stack>
//               <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
//                 <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>y軸</Typography>
//                 <NeumoSelect
//                   id={item.id}
//                   value={item.yMetric}
//                   required
//                   onChange={(e)=>{
//                     setView(draft=>{
//                       const newItem = {...draft.items[index], yMetric: e.target.value, label: getLabel(draft.items[index].patientId,e.target.value) }
//                       yMetricsRef.current[item.id] = new metrics[e.target.value](); 
//                       draft.items[index] = newItem
//                     })}}
                  
//                   sx={{minWidth: '110px'}}
//                 >
//                   {metricOptions?.map(metricOption =><MenuItem value={metricOption} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{t[metricOption]}</MenuItem>)}
//                 </NeumoSelect> 
//               </Stack>              
//               <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
//                 <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>カラー</Typography>
//                 <PopoverPicker 
//                   color={item.color} 
//                   onChange={newColor=>{
//                     setView(draft=>{
//                       draft.items[index] = {...draft.items[index], color:newColor}
//                     })
//                   }} 
//                 />
//               </Stack>
//               <IconButton sx={{ alignSelf: 'center'}} onClick={()=>{setView(draft=>{draft.items.splice(index,1)});}}>
//                 <Delete/>
//               </IconButton>                                                     
//             </Stack>
//             <Divider light/>
//           </>)}
//         </Stack>
//       </Box>
//       <Box sx={{display: loading? 'block': 'none', zIndex:100, position: 'absolute'}}>
//         <CircularProgress/>
//       </Box>
//     </Box>
//   )
// })

// export default PlotPanel


