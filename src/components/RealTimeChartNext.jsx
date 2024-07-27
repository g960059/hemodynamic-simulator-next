import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box, Typography, CircularProgress, Popover, useMediaQuery, NoSsr} from '@mui/material'
import { alpha } from '@mui/material/styles';
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { NumericAxis } from "scichart/Charting/Visuals/Axis/NumericAxis";
import {FastLineRenderableSeries} from "scichart/Charting/Visuals/RenderableSeries/FastLineRenderableSeries";
import {XyDataSeries} from "scichart/Charting/Model/XyDataSeries";
import {EAxisAlignment} from "scichart/types/AxisAlignment";
import { EAxisType } from "scichart/types/AxisType";
import {EAutoRange} from "scichart/types/AutoRange";
import { NumberRange } from "scichart/Core/NumberRange";
import {NumericLabelProvider} from "scichart/Charting/Visuals/Axis/LabelProvider/NumericLabelProvider";
import { ELineDrawMode } from "scichart/Charting/Drawing/WebGlRenderContext2D";
import {FiberManualRecord,MoreVert,Check} from "@mui/icons-material"
import {LightTheme, COLORS, ALPHA_COLORS,getRandomColor} from '../styles/chartConstants'
import { useTranslation } from '../hooks/useTranslation';
import {doc,updateDoc} from 'firebase/firestore';
import { useImmer } from "use-immer";
import ChartDialog from './ChartDialog';
import  DeleteMenuItemWithDialog from "../components/DeleteMenuItemWithDialog"
import { nanoid } from 'nanoid'


const TIME_WINDOW_GAP = 300
const isClient = () => typeof window !== 'undefined'



const TIME_WINDOW = 6000

const RealTimeChart =  React.memo(({engine,view,updateView,removeView,patients, getTimeSeriesFn, isOwner}) =>{

  const [originalView, setOriginalView] = useImmer(view);
  const timeWindow = view.options?.timeWindow *1000 || TIME_WINDOW;
  const t = useTranslation();
  const [loading, setLoading] = useState(true);
  const dataRef = useRef({})
  const fastLineSeriesRef = useRef({})
  const sciChartSurfaceRef = useRef();
  const wasmContextRef = useRef();
  const subscriptionsRef = useRef([]);
  const lastUpdatedTimeRef = useRef({});

  const [dialogOpen, setDialogOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState();


  const addDataSeries = (item)=>{
    const {id} = item;
    if(!dataRef.current[id]){
      dataRef.current[id]=[]
    }
    for(let j=0; j<2; j++){
      dataRef.current[id][j] = new XyDataSeries(wasmContextRef.current);
      const fastLineSeries = new FastLineRenderableSeries(wasmContextRef.current, { 
        stroke: alpha(item.color, 0.6),
        strokeThickness: 3,
        dataSeries: dataRef.current[id][j],
        drawNaNAs:ELineDrawMode.PolyLine
      })
      fastLineSeriesRef.current[id] = fastLineSeriesRef.current[id] ? [...fastLineSeriesRef.current[id], fastLineSeries] : [fastLineSeries]
      sciChartSurfaceRef.current.renderableSeries.add(fastLineSeries)
    }
    subscriptionsRef.current.push({id:item.id, patientId: item.patientId, subscriptionId: engine.subscribe(item.patientId)(update(item))})
  }
  const deleteDataSeries = (id) => {
    dataRef.current[id]?.forEach(x=>{x.delete()})
    delete dataRef.current[id];
    fastLineSeriesRef.current[id]?.forEach(x=>{sciChartSurfaceRef.current.renderableSeries.remove(x)})
    delete fastLineSeriesRef.current[id];
    try{
      const res =  subscriptionsRef.current.find(sub => sub.id==id);
      if (!res) return;
      const {patientId,subscriptionId} = res
      engine.unsubscribe(patientId)(subscriptionId);
    }catch(e){
      console.log(e)
    }
  }

  const initSciChart = async () => {
    SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY);
    SciChartSurface.configure({
      dataUrl: "/scichart2d.data",
      wasmUrl: "/scichart2d.wasm",
    })
    const { sciChartSurface, wasmContext } = await SciChartSurface.create("scichart-root-realtime"+view.id) 
    sciChartSurfaceRef.current = sciChartSurface
    wasmContextRef.current = wasmContext
    sciChartSurface.applyTheme(LightTheme)
    const xAxis = new NumericAxis(wasmContext,
      {
        autoRange: EAutoRange.Never,
        visibleRange:new NumberRange(0, timeWindow), 
        drawLabels:false,
        drawMinorTickLines:false,
        drawMajorGridLines: false,
        drawMinorGridLines: false,
      }
    )     
    const yAxis = new NumericAxis(wasmContext,
      {
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
    );
    sciChartSurface.xAxes.add(xAxis);
    sciChartSurface.yAxes.add(yAxis);

  }  

  function countOutOfOrder(arr) {
    let count = 0;
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] < arr[i - 1]) {
        count++;
      }
    }
    return count;
  }
  const update = item=>{
    const {hdp,patientId, id} = item
    const dataSeries = dataRef.current[id]
    return (data, time, hdprops) => {
      if(lastUpdatedTimeRef.current[id] && lastUpdatedTimeRef.current[id] >= time){
        return
      }else{
        lastUpdatedTimeRef.current[id] = time;
      }
      const _time = data['t']?.map(x=>x%timeWindow)
      const startTime = _time[0]
      const endTime = _time[_time.length-1]
      if(data["t"][0] % (timeWindow * 2) >  data['t'][_time.length-1] % (timeWindow * 2)) {
        dataSeries[0]?.clear()
        return;
      }else if (startTime > endTime){
        dataSeries[1]?.clear()
        return;
      }
      const j =  data['t'][_time.length-1] % (timeWindow * 2) < timeWindow ? 0 : 1;
      const k = j ? 0 : 1;
      if(timeWindow - endTime <= TIME_WINDOW_GAP){
        dataSeries[k]?.clear()
      }
      const _data = getTimeSeriesFn(hdprops)[hdp](data)

      // if(!(startTime <= timeWindow && timeWindow <= endTime) && startTime <= endTime && dataSeries[j].getXRange().max <= _time[0] ){ 
        dataSeries[j].appendRange(_time, _data)
      // }
      if(dataSeries[j]?.hasValues ){
        const indiceRange1 = dataSeries[j]?.getIndicesRange(new NumberRange(endTime, timeWindow))
        const indexMin1 = indiceRange1.min
        const indexMax1 = indiceRange1.max
        if(indexMax1 - indexMin1 > 0 ){
          dataSeries[j]?.removeRange(indexMin1, indexMax1 - indexMin1)
        }
      }
      if(dataSeries[k]?.hasValues ){
        const indiceRange2 = dataSeries[k]?.getIndicesRange(new NumberRange(startTime,endTime+TIME_WINDOW_GAP)) 
        if(indiceRange2.max - indiceRange2.min > 0 ){
          dataSeries[k]?.removeRange(indiceRange2.min, indiceRange2.max-indiceRange2.min+1)
        }
      }

    }
  }

  useEffect(() => {
    (async ()=>{
      if(isClient){
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
        if(!dataRef.current[item.id]){
          deleteDataSeries(item.id);
        }
      }
      sciChartSurfaceRef.current?.delete()
    }
  }, [view.options?.timeWindow]);

  useEffect(() => {
    (async ()=>{
      if(sciChartSurfaceRef.current &&  wasmContextRef.current){
        const isEnginePlaying = engine.isPlaying
        engine.setIsPlaying(false)
        const oldItems = originalView.items.filter(oldItem => !view.items.some(item=> item.id===oldItem.id && item.hdp === oldItem.hdp && item.patientId === oldItem.patientId && item.color === oldItem.color))
        const newItems = view.items.filter(item => !originalView.items.some(oldItem=> oldItem.id==item.id && item.hdp === oldItem.hdp && item.patientId === oldItem.patientId && item.color === oldItem.color))
        for(let item of oldItems){
          if(dataRef.current[item.id]){
            deleteDataSeries(item.id)
          }
        }
        for(let item of newItems){
          addDataSeries(item)
        }
        setOriginalView(view)
        setLoading(false)
        if(isEnginePlaying){
          engine.setIsPlaying(true);
        }
      }
    })();
  }, [view.items]);

  useEffect(() => {
    const subscriptionId = engine?.subscribeAllHdpMutation((patientId, key, value) => {
      if (key === 'DELETE_MODEL') {
        //患者(patient)が削除された場合に、同一PatientIdのデータを全て削除した上で、viewのitemsから同一PatientIdのデータを削除
        const deletingItems = view.items.filter(item => item.patientId == patientId);
        for(let item of deletingItems){
          deleteDataSeries(item.id)
        }
        updateView(draft => {
          draft.items = draft.items.filter(item => item.patientId !== patientId);
        });
        if(view.items.filter(item=>item.patientId !== patientId).length === 0){
          removeView()
        }
      }
    });
    return () => {
      engine?.unsubscribeAllHdpMutation(subscriptionId);
    };
  }, [engine, view]);


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
        <ChartDialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} initialView={view} updateView={(newView)=>{updateView({id:view.id, ...newView});}} patients={patients} />
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
        <div id={"scichart-root-realtime"+view.id} style={{width: '100%',height:"calc(100% - 100px)", aspectRatio : "auto"}}/>
      </div>
      <Box sx={{display: loading? 'block': 'none', zIndex:100, position: 'absolute'}}>
        <CircularProgress/>
      </Box>
    </div>
  )
})

export default RealTimeChart


          {/* <Dialog open={dialogOpen} onClose={onDialogClose} maxWidth='md' sx={{minHeight:'340px',"& .MuiDialog-paper":{minWidth : isUpMd ? "800px": "100%"}}} >
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
                                {patients.map(p=><MenuItem value={p.id} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{p.name || "無題の患者"}</MenuItem>)}
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
                                {hdpTypes?.map(hdpOption =><MenuItem value={hdpOption} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{t[hdpOption]}</MenuItem>)}
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
                        {
                          isNewItemEditing ? 
                            <Stack direction="row" spacing={1} justifyContent='center' alignItems='flex-start' p={1} sx={{backgroundColor:"#f1f5f9"}}>
                              <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                                <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70} >患者</Typography>
                                <Select
                                  value={newItem.patientId}
                                  onChange={(e)=>{setNewItem(draft=>{draft.patientId=e.target.value;draft.label=t[draft?.hdp]+"("+engine.getPatientData(e.target.value).name+")"})}}
                                  className={classes.neumoSelectInvert}
                                >
                                  {patients.map(p=><MenuItem value={p.id} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{p.name}</MenuItem>)}
                                </Select>
                              </Stack>
                              <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                                <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>表示項目</Typography>
                                <Select
                                  value={newItem.hdp}
                                  onChange={(e)=>{setNewItem(draft=>{draft.hdp=e.target.value; draft.label=t[e.target.value]+"("+engine.getPatientData(draft?.patientId).name+")"})}}
                                  className={classes.neumoSelectInvert}
                                  sx={{minWidth: '110px'}}
                                >
                                  {hdpTypes?.map(hdpOption =><MenuItem value={hdpOption} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{t[hdpOption]}</MenuItem>)}
                                </Select> 
                              </Stack>
                              <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                                <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>ラベル</Typography>
                                <ReactiveInput value={newItem.label} 
                                  updateValue={(newValue)=>{
                                    setNewItem(draft=>{draft.label=newValue})
                                  }} 
                                  type="text" 
                                  invertColor
                                  required
                                />  
                              </Stack>
                              <Stack direction={!isUpMd ?'row':'column'} justifyContent='flex-start' alignItems={isUpMd ? 'flex-start': 'center'} spacing={!isUpMd && 1}>
                                <Typography variant={isUpMd ?'caption':'subtitle1'} fontWeight="bold" ml="3px" width={70}>カラー</Typography>
                                <PopoverPicker color={newItem.color} onChange={newColor=>{setNewItem(draft=>{draft.color=newColor})}} />
                              </Stack>
                            </Stack> :
                            <Box width={1} display="flex" p={1}>
                              <Button onClick={addNewItem} startIcon={<Add/>} className={classes.neumoButton}>追加する</Button>
                            </Box>
                        }
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
          </Dialog> */}
          // const getLabel = (patientId, hdp)=> t[hdp]+"("+patients.find(p=>p.id===patientId).name+")"
          // const getExcludeHdpList = (patientId)=>{
          //   const existingItems = subscriptionsRef.current.filter(s=>s.patientId == patientId)
          //   return hdpTypes?.filter(pt => !existingItems.includes(pt)) 
          // }
        
          // const useStyles = makeStyles((theme) =>({
          //   neumoButton: {
          //     transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
          //     color: "rgb(69, 90, 100)",
          //     boxShadow: "0 2px 4px -2px #21253840",
          //     backgroundColor: "white",
          //     border: "1px solid rgba(92, 147, 187, 0.17)",
          //     fontWeight:"bold",
          //     "&:hover":{
          //       backgroundColor: "rgba(239, 246, 251, 0.6)",
          //       borderColor: "rgb(207, 220, 230)"
          //     }
          //   },
          //   neumoIconButton:{
          //     color:"#93a5b1",
          //     boxShadow:"0 0 2px #4b57a926, 0 10px 12px -4px #0009651a",
          //     width:"44px",
          //     height:"44px",
          //     backgroundColor:"white",
          //     borderRadius:"50%",
          //     transition:".3s",
          //     "&:hover":{
          //       boxShadow:"0 25px 25px -10px #00096540",
          //       transform: "translateY(-2px)",
          //       color: "#f76685",
          //       backgroundColor:"white",
          //     }
          //   },
          //   neumoSelect: {
          //     backgroundColor: '#f1f5f9',
          //     borderRadius: '4px',
          //     border: '1px solid #5c93bb2b',
          //     '&:hover': {
          //         borderColor: '#3ea8ff',
          //     }, 
          //     "& .MuiOutlinedInput-notchedOutline":{border:"none"},
          //     "& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input":{paddingTop:"8px",paddingBottom:"8px"}
          //   },
          //   neumoSelectInvert: {
          //     backgroundColor: '#ffffff',
          //     borderRadius: '4px',
          //     border: '1px solid #5c93bb2b',
          //     '&:hover': {
          //         borderColor: '#3ea8ff',
          //     }, 
          //     "& .MuiOutlinedInput-notchedOutline":{border:"none"},
          //     "& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input":{paddingTop:"8px",paddingBottom:"8px"}
          //   },
          //   faintNeumoButton: {
          //     transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
          //     color: "#b3b3b3",
          //     backgroundColor: "#f1f4f9",
          //     border: "none",
          //     "&:hover":{
          //       backgroundColor: "#fff2f2",
          //       color: "#ec407a"
          //     },
          //     "& .MuiOutlinedInput-notchedOutline": {border:"none"}
          //   },
          // }),
          // );