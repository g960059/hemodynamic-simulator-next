import React, { useRef, useState, useEffect, useCallback} from 'react'
import {Box,Grid, Typography, Stack,MenuItem, Checkbox, ListItemText, Menu,Divider,ListSubheader,Collapse, List, IconButton,MenuList,ListItemIcon,Tab, CircularProgress, Button,Dialog,DialogTitle,DialogContent,DialogActions,Select,FormControl,InputLabel, useMediaQuery} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';
import {Tune,Delete,Add,DragIndicator,ExpandMore} from '@mui/icons-material';
import { makeStyles} from '@mui/styles';
import { alpha } from '@mui/material/styles';
import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import { chartBuilder } from "scichart/Builder/chartBuilder";
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
import ReactiveInput from "../components/ReactiveInput";
import {PopoverPicker} from "../components/PopoverPicker"
import  DeleteMenuItemWithDialog from "../components/DeleteMenuItemWithDialog"
import { nanoid } from 'nanoid'


const TIME_WINDOW_GAP = 300
const pressureTypes = ['AoP','Pla','Plv','PAP','Pra','Prv']

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

const getTimeSeriesFn = ({ 
  Rcs,Rcp,Ras,Rvs,Rap,Rvp,Ras_prox,Rap_prox,Rmv,Rtv,Cas,Cvs,Cap,Cvp,Cas_prox,Cap_prox,
  LV_Ees,LV_V0,LV_alpha,LV_beta,LV_Tmax,LV_tau,LV_AV_delay,
  LA_Ees,LA_V0,LA_alpha,LA_beta,LA_Tmax,LA_tau,LA_AV_delay,
  RV_Ees,RV_V0,RV_alpha,RV_beta,RV_Tmax,RV_tau,RV_AV_delay,
  RA_Ees,RA_V0,RA_alpha,RA_beta,RA_Tmax,RA_tau,RA_AV_delay,HR,
  Ravs, Ravr, Rmvr, Rmvs, Rpvr, Rpvs, Rtvr, Rtvs,
}) => {
  const Plv = x => x['Plv']
  const Pla = x => x['Pla']
  const Prv = x => x['Prv']
  const Pra = x => x['Pra']
  const Iasp = x => x['Iasp']
  const Iapp = x=> x['Iapp']
  const AoP = x => x['AoP']
  const PAP = x=>x['PAP']
  return {Plv, Pla, Prv, Pra, Iasp,Iapp, AoP, PAP}
}

const RealTimeChart = React.memo(({engine,initialView,setInitialView,removeView,patients,readOnly=false}) =>{
  const [view, setView] = useImmer(initialView);
  const [originalView, setOriginalView] = useImmer(initialView);
  const TIME_WINDOW =  6000
  const t = useTranslation();
  const classes = useStyles();
  const [loading, setLoading] = useState(true);
  const dataRef = useRef({})
  const fastLineSeriesRef = useRef({})
  const sciChartSurfaceRef = useRef();
  const wasmContextRef = useRef();
  const subscriptionsRef = useRef([]);
  const changingRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState("0");
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  const [viewNameEditing, setViewNameEditing] = useState(false);
  const [isNewItemEditing, setIsNewItemEditing] = useState(false);
  const [newItem, setNewItem] = useImmer({});
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);


  const addDataSeries = (item)=>{
    const {id} = item;
    if(!dataRef.current[id]){
      dataRef.current[id]=[]
    }
    for(let j=0; j<2; j++){
      console.log(dataRef.current[id], wasmContextRef.current)
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
      const {patientId,subscriptionId} = subscriptionsRef.current.find(sub => sub.id==id);
      engine.unsubscribe(patientId)(subscriptionId);
    }catch(e){
      console.log(e)
    }
  }

  const initSciChart = async () => {
    SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY);
    SciChartSurface.configure( {
      dataUrl: "/scichart2d.data",
      wasmUrl: "/scichart2d.wasm"
    })
    const { sciChartSurface, wasmContext } = await chartBuilder.buildChart("scichart-root"+initialView.id, {
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

  const update = item=>{
    const {hdp,patientId, id} = item
    const dataSeries = dataRef.current[id]
    return (data, time, hdprops) => {
      if(!dataSeries) return;
      const _time = data['t']?.map(x=>x%TIME_WINDOW)
      const newTime = data['t'][_time.length-1] % TIME_WINDOW
      const startTime = _time[0]
      const endTime = _time[_time.length-1]
      const _data = getTimeSeriesFn(hdprops)[hdp](data)
      const j =  data['t'][_time.length-1] % (TIME_WINDOW * 2) < TIME_WINDOW ? 0 : 1;
      const k = j ? 0 : 1;

      if(!(startTime <= TIME_WINDOW && TIME_WINDOW <= endTime) && startTime <= endTime){
        dataSeries[j].appendRange(_time, _data)
      }
      const indiceRange1 = dataSeries[j].getIndicesRange(new NumberRange(newTime, TIME_WINDOW))
      if(indiceRange1.max - indiceRange1.min > 0 ){
        dataSeries[j].removeRange(indiceRange1.min, indiceRange1.max - indiceRange1.min)
      }
      const indiceRange2 = dataSeries[k].getIndicesRange(new NumberRange(startTime,endTime+TIME_WINDOW_GAP)) 
      if(indiceRange2.max - indiceRange2.min > 0 ){
        dataSeries[k].removeRange(indiceRange2.min, indiceRange2.max-indiceRange2.min+1)
      }
      if(TIME_WINDOW - newTime < 200){
        dataSeries[k].clear()
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
    return pressureTypes.filter(pt => !existingItems.includes(pt)) 
  }

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
        const oldItems = originalView.items.filter(oldItem => !initialView.items.some(item=> item.id===oldItem.id && item.hdp === oldItem.hdp && item.patientId === oldItem.patientId && item.color === oldItem.color))
        const newItems = initialView.items.filter(item => !originalView.items.some(oldItem=> oldItem.id==item.id && item.hdp === oldItem.hdp && item.patientId === oldItem.patientId && item.color === oldItem.color))
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
    <Box display='flex' justifyContent='center' alignItems='center' sx={{position: 'relative',backgroundColor:'white', p:[0.5,2],py:2}}>
      <Box width={1} style={{opacity: loading ? 0 : 1}}>
        <Stack alignItems='center' sx={{zIndex: 100, position: "relative"}}>
          <Stack direction="row" pr={1} pl={2} pb={1} justifyContent="center" sx={{width:1}}>
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
              <IconButton size="small" className={classes.faintNeumoButton} onClick={e=>{setDialogOpen(true);changingRef.current=engine.isPlaying;engine.setIsPlaying(false)}} >
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
                                {pressureTypes.map(hdpOption =><MenuItem value={hdpOption} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{t[hdpOption]}</MenuItem>)}
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
                                  {pressureTypes.map(hdpOption =><MenuItem value={hdpOption} sx={{"&.MuiMenuItem-root.Mui-selected":{backgroundColor:'#e0efff'}}}>{t[hdpOption]}</MenuItem>)}
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
          </Dialog>

        </Stack>
        <Box display='flex' justifyContent='center' alignItems='center' style={{ width: '100%',aspectRatio: '2 / 1'}}>
          <div id={"scichart-root"+initialView.id} style={{width: '100%',height:'100%'}}></div>
        </Box>
      </Box>
      <Box sx={{display: loading? 'block': 'none', zIndex:100, position: 'absolute'}}>
        <CircularProgress/>
      </Box>
    </Box>
  )
})

export default RealTimeChart


