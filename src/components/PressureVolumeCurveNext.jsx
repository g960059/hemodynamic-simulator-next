import React, { useRef, useState, useEffect} from 'react'
import {Box,Typography, Popover, CircularProgress, alpha} from '@mui/material'
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
import {FiberManualRecord,} from "@mui/icons-material"
import {LightTheme, } from '../styles/chartConstants'
import { useImmer } from "use-immer";
import ChartDialog from './ChartDialog';
import  DeleteMenuItemWithDialog from "../components/DeleteMenuItemWithDialog"


const PV_COUNT = 1000
const EDPVR_STEP = 50
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

const PVPlot = React.memo(({engine,view,updateView,removeView,patients,isOwner}) =>{

  const [originalView, setOriginalView] = useImmer(view);

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

  const xAxisRef = useRef();
  const yAxisRef = useRef();
  const yMaxRef = useRef({});
  const xMaxRef = useRef({});
  const yMaxPrevRef = useRef({});
  const xMaxPrevRef = useRef({});
  const tcRef = useRef({});
  const changedVisibleRange = useRef(false);
  const autoScaleRef = useRef(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState();

  const updateCounterRef = useRef(0);

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
      "scichart-pv-root"+view.id
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


  useEffect(() => {
    const intervalId = setInterval(()=>{
      changedVisibleRange.current = false
      if(autoScaleRef.current ){
        const newXMax = Math.max(...Object.values(xMaxRef.current))
        if(newXMax != xMaxRef.current["All"] && newXMax && xAxisRef.current){
          xAxisRef.current.visibleRange = new NumberRange(0,format(newXMax));
          xMaxRef.current["All"] = format(newXMax);
          changedVisibleRange.current =true;
        }
        const newYMax = Math.max(...Object.values(yMaxRef.current))
        if(newYMax != yMaxRef.current["All"] && newYMax && yAxisRef.current){
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
      if(typeof window !== 'undefined'){
        const isEnginePlaying = engine.isPlaying
        engine.setIsPlaying(false)
        await initSciChart()
        for(let item of view.items){
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
        deleteDataSeries(item.id);
      }
      sciChartSurfaceRef.current?.delete()
    }
  }, []);


  useEffect(() => {
    (async ()=>{
      if(sciChartSurfaceRef.current &&  wasmContextRef.current){
        const isEnginePlaying = engine.isPlaying
        engine.setIsPlaying(false)
        const oldItems = originalView.items.filter(oldItem => !view.items.some(item=> item.id===oldItem.id && item.hdp === oldItem.hdp && item.patientId === oldItem.patientId && item.color === oldItem.color))
        const newItems = view.items.filter(item => !originalView.items.some(oldItem=> oldItem.id==item.id && item.hdp === oldItem.hdp && item.patientId === oldItem.patientId && item.color === oldItem.color))
        for(let item of oldItems){
          deleteDataSeries(item.id)
        }
        for(let item of newItems){
          addDataSeries(item)
        }
        updateCounterRef.current=0;
        setOriginalView(view)
        setLoading(false)
        if(isEnginePlaying){
          engine.setIsPlaying(true);
        }
      }
    })();
  }, [view.items]);




  return (
    <div className="w-full h-full">
      <div className="w-full h-full" style={{opacity: loading ? 0 : 1}}>
        <div className='flex p-2 pb-1 pl-4 mb-2 border-solid border-0 border-b border-b-slate-200'>
          <div className='draggable cursor-move font-bold text-base md:text-lg pl-1 whitespace-nowrap overflow-x-auto'>{view?.name || ""}</div>
          <div className='draggable cursor-move flex-grow'></div>
          {isOwner && <div className='p-1 px-3 -my-2 flex items-center cursor-pointer text-slate-600 hover:text-lightBlue-500 transition' onClick={e => { setAnchorEl(e.currentTarget)}}>
            <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
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
          PaperProps={{style: {backgroundColor: 'transparent'}}}
        >
          <div className='flex flex-col items-center justify-center py-2 bg-white  border-solid border border-slate-200 rounded shadow-md m-2 mr-1 mt-0'>
            <div onClick={()=> {setDialogOpen(true); setAnchorEl(null)}} 
              className="cursor-pointer text-sm text-slate-700 inline-flex w-full pl-2 pr-6 py-1 hover:bg-slate-200"
            >
              <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" >
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </div>
            <DeleteMenuItemWithDialog raw onDelete={()=>{removeView()}} onClose={()=>setAnchorEl(null)} message ={"「"+(view?.name || "Chart") + "」を削除しようとしています。この操作は戻すことができません。"}>
              <div className="cursor-pointer text-sm inline-flex w-full pl-2 pr-6 py-1  text-red-500 hover:bg-red-500 hover:text-white">
                <svg className='w-4 h-4 mr-3' xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>                                
                Delete
              </div>
            </DeleteMenuItemWithDialog>
          </div>
        </Popover>
        <ChartDialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} initialView={view} updateView={(newView)=>{updateView({id:view.id, ...newView});}} patients={patients}/>
        
        <div className='flex w-full'>
          <div className='flex flex-row px-4 pt-2 flex-wrap'>
            {view.items.map((item,i)=>(
              <div className='flex flex-row' key={item} > 
                <FiberManualRecord sx={{color:item.color}} />
                <Typography variant='subtitle2' noWrap>{item.label}</Typography>
              </div>
            ))}
          </div>
        </div>

        <div id={"scichart-pv-root"+view.id} style={{width: '100%',height:"calc(100% - 98px)", aspectRatio : "auto"}}/>
      </div>
      <Box sx={{display: loading  ? 'block': 'none', zIndex:100, position: 'absolute'}}>
        <CircularProgress/>
      </Box>
    </div>
  )
})

export default PVPlot

