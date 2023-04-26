import React, {useRef, useState, useEffect, useCallback} from 'react'
import {Box,Typography,Button,IconButton,Stack,Menu,Dialog,DialogContent,DialogActions,DialogTitle,Popover,MenuItem,TextField,List,ListItem,ListItemButton,ListItemText,Link,ToggleButtonGroup,ToggleButton,Avatar,useMediaQuery,NoSsr} from '@mui/material'
import {Add,FavoriteBorder,} from '@mui/icons-material';
import Masonry from '@mui/lab/Masonry';
import PlaySpeedButtonsNext from './PlaySpeedButtonsNext'
import { makeStyles } from '@mui/styles';
import OutputPanel from './OutputPanel'
import ControllerPanelNext from './controllers/ControllerPanelNext'
import ReactiveInput from "./ReactiveInput";
import Image from 'next/image'

import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import dynamic from 'next/dynamic'
import { useImmer } from "use-immer";
import {nanoid,formatDateDiff} from "../utils/utils"
import { getRandomColor } from '../styles/chartConstants';
import {getTimeSeriesPressureFn, pressureTypes, flowTypes, getTimeSeriesFlowFn}  from "../utils/presets"

import { Allotment } from "allotment";
import "allotment/dist/style.css";

const RealTimeChartNext = dynamic(()=>import('./RealTimeChartNext'), {ssr: false});
const PressureVolumeCurveNext = dynamic(()=>import('./PressureVolumeCurveNext'), {ssr: false,});
const Tracker = dynamic (()=>import('./Tracker'), {ssr: false,});
const CombinedChart = dynamic(()=>import('./combined/CombinedChart'), {ssr: false,});

SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY);

const useStyles = makeStyles((theme) =>(
  {
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
    shadowBox: {
      backgroundColor: "white",
      boxShadow: "0 10px 20px #4b57a936",
      border: "1px solid rgba(239, 246, 251, 0.6)"
    },       
  })
);


const CaseEditor = ({engine,caseData,setCaseData,patients,setPatients ,views, setViews, outputs,setOutputs,allCases}) => {
  const classes = useStyles();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedView, setSelectedView] = useState(null);

  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'), {noSsr: true});
  const [openAddPatientDialog, setOpenAddPatientDialog] = useState(false);
  const [patientListMode, setPatientListMode] = useState(null);
  const scrollPatientBottomRef = useRef(null);

  const addPatient = patient =>{
    const newPatient = {...patient,id:nanoid()}
    engine.register(newPatient);
    setPatients(draft=>{draft.push({...newPatient, ...engine.getPatient(newPatient.id)})})
    setCaseData(draft=>{draft.patientIds.push(newPatient.id)})
    setTimeout(()=>{scrollPatientBottomRef.current?.scrollIntoView({behavior: "smooth"});},100)
  }

  useEffect(() => {
    if(caseData?.viewIds && !selectedView){setSelectedView(views.find(v=>caseData?.viewIds[0]==v.id))}
    if(patients?.length>0 && !selectedPatient){setSelectedPatient(patients.find(p=>caseData?.patientIds[0]==p.id))}
  }, [caseData,patients, views]);

  return <> 
    <Allotment vertical={!isUpMd} className='w-full h-[calc(100vh_-_102px)] md:h-[calc(100vh_-_66px)]'>
      {isUpMd && <div className='overflow-scroll h-[calc(100vh_-_66px)]'>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mx:{xs:2,md:"auto"},mt:{xs:2,md:2},mb:1, maxWidth:"407px"}}>
            <Typography variant="h5" color="secondary" sx={{cursor: "default"}}>Patients</Typography>
            <Button onClick={()=>{setOpenAddPatientDialog(true)}} startIcon={<Add/>} variant='contained' disableElevation className={classes.neumoButton}>比較</Button>                                
          </Stack>
          <Stack justifyContent="center" alignItems="center">
            {caseData.patientIds?.map((patientId,index)=>{
              const patient = patients.find(({id})=>id===patientId);
              if(patient){
                return <Box maxWidth={{xs:"100%",md:"420px"}} width={1} mx={1} ref={(index==patients.length-1)? scrollPatientBottomRef : null}>
                  <ControllerPanelNext
                    key={patient.id}
                    patient={patient} 
                    setPatient={newPatient=>{setPatients(draft=>{draft.findIndex(p=>p.id===patient.id)===-1? draft.push(newPatient) : draft.splice(draft.findIndex(p=>p.id===patient.id),1,newPatient);})}}
                    removePatient={()=>{
                      setViews(draft=>{
                        for(var i=0; i<draft.length; i++){
                          draft[i].items = draft[i].items.filter(item=>item.patientId != patient.id)
                        }
                      })
                      setCaseData(draft=>{draft.patientIds=draft.patientIds.filter(id=>id!=patient.id)})
                      engine.unregister(patient.id);
                      setPatients(patients.filter(p=>p.id!=patient.id));
                    }}
                    clonePatient={()=>{
                      const newPatient = {
                        ...patient,
                        id: nanoid(),   
                        name: patient.name+"の複製",
                      }
                      engine.register(newPatient);
                      setPatients(draft=>{draft.push({...newPatient, ...engine.getPatient(newPatient.id)})})
                      setCaseData(draft=>{draft.patientIds.push(newPatient.id)})
                      setTimeout(()=>{scrollPatientBottomRef.current?.scrollIntoView({behavior: "smooth"});},100)
                    }}
                    setViews={setViews} 
                    patientIndex = {index}
                  />
                </Box>
              }
            })}
          </Stack>
        </div>
      }
      {isUpMd && 
        <Allotment vertical>
          <div className='overflow-y-scroll h-[calc(100vh_-_66px)] pb-10'>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{mx:2,mt:2,mb:1}}>
              <Typography variant="h5" color="secondary" sx={{cursor: "default"}}>Views</Typography>
              <NewAddViewDialog 
                addViewItem={(viewItem)=>{
                  setCaseData(draft=>{draft.viewIds.push(viewItem.id)})
                  setViews(draft=>{draft.push(viewItem)})
                }} 
                patients={patients}
              />
            </Stack>
            <Stack alignItems="center" px={1} pb={8}>
              { caseData.viewIds?.map(viewId=>{
                const view = views.find(v=>v.id===viewId);
                if(view){ 
                  return <Box key={view.id} sx={{border:"1px solid #5c93bb2b", borderRadius:"8px",backgroundColor:"white",my:1,mx:1,pt:1,pb:3,boxShadow:"0 10px 20px #4b57a936", overflow:"auto", maxWidth: "1600px", width:1,minWidth:{xs:"auto",md:"400px"}}}>
                  {view.type === "PressureCurve" && 
                    <RealTimeChartNext engine={engine} initialView={view} patients={patients}
                      setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} 
                      removeView={()=>{
                        setCaseData(draft=>{
                          draft.viewIds=draft.viewIds.filter(id=>id!=view.id)
                        })
                        setViews(draft=>{
                          draft.splice(draft.findIndex(v=>v.id===view.id),1)
                        })
                      }}
                      getTimeSeriesFn = {getTimeSeriesPressureFn}
                      hdpTypes = {pressureTypes}
                    />
                  }
                  {view.type === "FlowCurve" && 
                    <RealTimeChartNext engine={engine} initialView={view} patients={patients}
                      setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} 
                      removeView={()=>{
                        setCaseData(draft=>{
                          draft.viewIds=draft.viewIds.filter(id=>id!=view.id)
                        })
                        setViews(draft=>{
                          draft.splice(draft.findIndex(v=>v.id===view.id),1)
                        })
                      }}
                      getTimeSeriesFn = {getTimeSeriesFlowFn}
                      hdpTypes = {flowTypes}
                    />
                  }                  
                  {view.type === "PressureVolumeCurve" && 
                    <PressureVolumeCurveNext engine={engine} initialView={view} 
                      setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} 
                      removeView={()=>{
                        setCaseData(draft=>{
                          draft.viewIds=draft.viewIds.filter(id=>id!=view.id)
                        })
                        setViews(draft=>{
                          draft.splice(draft.findIndex(v=>v.id===view.id),1)
                        })
                      }}
                      patients={patients}/>
                  }
                  {
                    view.type === "Tracker" &&
                    <Tracker engine={engine} initialView={view} patients = {patients}
                      setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}}
                      removeView={()=>{
                        setCaseData(draft=>{
                          draft.viewIds=draft.viewIds.filter(id=>id!=view.id)
                        })
                        setViews(draft=>{
                          draft.splice(draft.findIndex(v=>v.id===view.id),1)
                        })
                      }
                    }/>
                  }
                </Box>
              }})}
            </Stack> 
          </div>
          <Allotment.Pane preferredSize={120} className='flex justify-center overflow-y-scroll'>
            {
              patients?.length>0  && 
              <div className='overflow-hidden w-full'>
                <OutputPanel outputs = {outputs} setOutputs={setOutputs} patients = {patients}/>
              </div>
            }
          </Allotment.Pane>
        </Allotment>
      }
      {isUpMd && 
        <Allotment.Pane preferredSize={88} className='pt-5 px-3'>
          <PlaySpeedButtonsNext engine={engine} vertical/>
        </Allotment.Pane>
      }   
      {!isUpMd && 
        <Allotment.Pane preferredSize={350}>
          <div className='flex w-full -mb-px'>
            <nav className="flex space-x-8 overflow-x-scroll ">
              <div className='flex w-full'>
                {caseData.viewIds?.map(viewId=>{
                  const view = views.find(v=>v.id===viewId);
                  if(view){ 
                    return <div key={view.id} className='flex-shrink-0 flex-grow-0'>
                      <div className={`btn py-2 px-5 text-sm font-bold mr-px text-center transition-all duration-150 ${selectedView?.id==view?.id ? "bg-white": "text-slate-600"} `} onClick={()=>{
                        setSelectedView(view)
                      }}>
                        {view?.name || "無題のグラフ"}
                      </div>
                    </div>
                  }
                } )}
                <NewAddViewDialog 
                  addViewItem={(viewItem)=>{
                    setCaseData(draft=>{draft.viewIds.push(viewItem.id)})
                    setViews(draft=>{draft.push(viewItem)})
                  }} 
                  patients={patients}
                />
              </div>
            </nav>
            <div className="flex-grow"></div>
            <PlaySpeedButtonsNext engine={engine}/>
          </div>
          <div>
          { caseData.viewIds?.map(viewId=>{
              const view = views.find(v=>v.id===viewId);            
              return  (view?.type === "PressureCurve" && view.id === selectedView?.id && 
                <RealTimeChartNext engine={engine} initialView={view} patients={patients}
                  setInitialView={newView=>{
                    setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===selectedView.id),1,newView)})
                    setSelectedView(newView)
                  }} 
                  removeView={()=>{
                    setCaseData(draft=>{
                      draft.viewIds=draft.viewIds.filter(id=>id!=selectedView.id)
                    })
                    setViews(draft=>{
                      draft.splice(draft.findIndex(v=>v.id===selectedView.id),1)
                    })
                  }}
                  getTimeSeriesFn = {getTimeSeriesPressureFn}
                  hdpTypes = {pressureTypes}
                />) || 
              (view?.type === "FlowCurve" && view.id === selectedView?.id && 
                <RealTimeChartNext engine={engine} initialView={view} patients={patients}
                  setInitialView={newView=>{
                    setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===selectedView.id),1,newView)})
                    setSelectedView(newView)
                  }} 
                  removeView={()=>{
                    setCaseData(draft=>{
                      draft.viewIds=draft.viewIds.filter(id=>id!=selectedView.id)
                    })
                    setViews(draft=>{
                      draft.splice(draft.findIndex(v=>v.id===selectedView.id),1)
                    })
                  }}
                  getTimeSeriesFn = {getTimeSeriesFlowFn}
                  hdpTypes = {flowTypes}
                />) ||                 
              (view?.type === "PressureVolumeCurve" && view.id === selectedView?.id &&
                <PressureVolumeCurveNext engine={engine} initialView={selectedView} 
                  setInitialView={newView=>{
                    setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===selectedView.id),1,newView)})
                    setSelectedView(newView)
                  }} 
                  removeView={()=>{
                    setCaseData(draft=>{
                      draft.viewIds=draft.viewIds.filter(id=>id!=selectedView.id)
                    })
                    setViews(draft=>{
                      draft.splice(draft.findIndex(v=>v.id===selectedView.id),1)
                    })
                  }}
                  patients={patients}
                />
              )  || 
              (view?.type === "Tracker" && view.id !== selectedView?.id &&
                  <Tracker engine={engine} initialView={view} patients={patients}
                    setInitialView={newView=>{
                      setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===selectedView.id),1,newView)})
                      setSelectedView(newView)
                    }}
                    removeView={()=>{
                      setCaseData(draft=>{
                        draft.viewIds=draft.viewIds.filter(id=>id!=selectedView.id)
                      })
                      setViews(draft=>{
                        draft.splice(draft.findIndex(v=>v.id===selectedView.id),1)
                      })
                    }}
                />) || null
            }
          )}
          </div>
        </Allotment.Pane>
      }
      {!isUpMd && 
        <Allotment.Pane preferredSize={88} className='z-20 bg-slate-200'>
          {patients?.length>0 && <OutputPanel outputs = {outputs} patients = {patients} setOutputs={setOutputs}/>}
        </Allotment.Pane>
      }
      {!isUpMd &&
        <div className='z-30'>
          <div className='flex w-full bg-slate-200 -mb-px'>
            <nav className="flex overflow-x-scroll ">
              <div className='flex w-full'>
                {caseData.patientIds?.map((patientId,index)=>{
                  const patient = patients.find(({id})=>id===patientId);
                  if(patient?.id){ 
                    return <div key={patient.id} className='flex-shrink-0 flex-grow-0'>
                      <div className={`btn py-2 px-5 text-sm font-bold mr-px text-center transition-all duration-150 ${selectedPatient?.id==patient.id ? "bg-white": "text-slate-600"} `} onClick={()=>{
                        setSelectedPatient(patient);
                      }}>
                        {patient?.name || "無題の患者"}
                      </div>
                    </div>
                  }
                } )}
              </div>
              <div className={`bg-white px-1.5 m-1.5 mx-2 inline-flex items-center rounded-sm cursor-pointer hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300`} onClick={()=>{setOpenAddPatientDialog(true)}}  >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </nav>
          </div>
          <div>
            {selectedPatient?.id && <ControllerPanelNext
              key={selectedPatient.id}
              patient={selectedPatient} 
              setPatient={newPatient=>{setPatients(draft=>{draft.findIndex(p=>p.id===selectedPatient.id)===-1? draft.push(newPatient) : draft.splice(draft.findIndex(p=>p.id===selectedPatient.id),1,newPatient);})}}
              removePatient={()=>{
                setViews(draft=>{
                  for(var i=0; i<draft.length; i++){
                    draft[i].items = draft[i].items.filter(item=>item.patientId != selectedPatient.id)
                  }
                })
                setCaseData(draft=>{draft.patientIds=draft.patientIds.filter(id=>id!=selectedPatient.id)})
                engine.unregister(selectedPatient.id);
                setPatients(patients.filter(p=>p.id!=selectedPatient.id));
              }}
              clonePatient={()=>{
                const newPatient = {
                  ...selectedPatient,
                  id: nanoid(),   
                  name: selectedPatient.name+"の複製",
                }
                engine.register(newPatient);
                setPatients(draft=>{draft.push({...newPatient, ...engine.getPatient(newPatient.id)})})
                setCaseData(draft=>{draft.patientIds.push(newPatient.id)})
                setTimeout(()=>{scrollPatientBottomRef.current?.scrollIntoView({behavior: "smooth"});},100)
              }}
              setViews={setViews} 
              patientIndex = {patients.findIndex(p=>p.id===selectedPatient.id)}
            />}
          </div>
        </div>
      }                     
    </Allotment>
    <Dialog open={openAddPatientDialog} onClose={()=>{setOpenAddPatientDialog(false);setPatientListMode(null)}} sx={{minHeight:'340px',"& .MuiPaper-root":{width:"100%"}}} >
      <DialogTitle >
        比較対象を追加する
      </DialogTitle>
      <DialogContent>
        {
          !patientListMode && <>
            <Typography variant="h6" fontWeight="bold">My Patients</Typography>
            <Masonry columns={{xs:1,md:3}} spacing={2} sx={{mt:.5}}>
              <Box className={classes.shadowBox} minWidth="120px">
                <Typography variant="body1" sx={{backgroundColor:"#edf2f6",px:2,py:1}}>{caseData.emoji +" "+ caseData.name}</Typography>
                <List>
                  {
                    patients?.map(p=>{return <ListItem disablePadding onClick={()=>{addPatient(p);setOpenAddPatientDialog(false)}}> 
                        <ListItemButton>
                          <ListItemText primary={p.name || "無題の患者"}/>
                        </ListItemButton>
                    </ListItem>
                  })}
                </List>
              </Box>
            </Masonry>
            <Link underline="hover" sx={{cursor:"pointer",my:1}} onClick={()=>{setPatientListMode("myPatients")}}>see more my patients →</Link>
            <Typography variant="h6" fontWeight="bold" sx={{mt:2}}>Popular</Typography>
            <Masonry columns={{xs:1,md:3}} spacing={2} sx={{mt:.5}}>
              {allCases?.filter(x=>x.patients?.length>0 && x.visibility != "private").slice(0,6).map(c=>{
                return <Box className={classes.shadowBox} minWidth="120px">
                    <Stack sx={{backgroundColor:"#edf2f6",px:2,py:1}} >
                      <Typography variant="body1">{c.emoji +" "+ (c.name || "無題の症例")}</Typography>
                      <Stack direction="row" justifyContent="center" alignItems="center">
                        <Avatar sx={{ width: 16, height: 16 }}>
                          <Image src={c?.photoURL} layout='fill'/>
                        </Avatar>
                        <Typography variant="caption" sx={{mx:1}} >{c.displayName}</Typography>
                        <div style={{flexGrow:1}}/>
                        <FavoriteBorder sx={{color:"#6e7b85",fontSize:16}}/>
                        <Typography variant="caption" sx={{color:"#6e7b85"}}>{c.favs}</Typography>
                      </Stack>
                    </Stack>
                    <List>
                      {
                        c.patients?.map(p=>{
                          return( 
                          <ListItem disablePadding onClick={()=>{addPatient(p);setOpenAddPatientDialog(false)}} >
                            <ListItemButton>
                              <ListItemText primary={p.name || "無題の患者"}/>
                            </ListItemButton>
                          </ListItem>
                        )})}
                    </List>
                  </Box>
                })}  
              </Masonry>                    
            <Link underline="hover" sx={{cursor:"pointer",my:1}} onClick={()=>{setPatientListMode("popular")}}>see more public patients →</Link> 
          </>
        }
        {
          patientListMode && <>
            <ToggleButtonGroup
              color="primary"
              value={patientListMode}
              exclusive
              onChange={(e,newValue)=>{setPatientListMode(newValue)}}
              sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
            >
              <ToggleButton value="myPatients">My Patients</ToggleButton>
              <ToggleButton value="popular">Popular</ToggleButton>
            </ToggleButtonGroup>
          </>
        }
        {patientListMode == "myPatients" && <>
          <Masonry columns={{xs:1,md:3}} spacing={2} sx={{mt:.5}}>
            <Box className={classes.shadowBox} minWidth="120px">
              <Typography variant="body1" sx={{backgroundColor:"#edf2f6",px:2,py:1}}>{caseData.emoji +" "+ caseData.name}</Typography>
              <List>
                {
                  patients?.map(p=>{return <ListItem disablePadding onClick={()=>{addPatient(p);setOpenAddPatientDialog(false)}}> 
                      <ListItemButton>
                        <ListItemText primary={p.name}/>
                      </ListItemButton>
                  </ListItem>
                })}
              </List>
            </Box>
            {cases.data?.filter(c=>c.id!=caseData.id).sort((a,b)=>a.updatedAt > b.updatedAt ? -1 : 1).map(c=>{
              return <Box className={classes.shadowBox} minWidth="120px">
                  <Typography variant="body1" sx={{backgroundColor:"#edf2f6",px:2,py:1}}>{c.emoji +" "+ c.name}</Typography>
                  <List>
                    {
                      c.patients?.map(p=>{return <ListItem disablePadding onClick={()=>{addPatient(p);setOpenAddPatientDialog(false)}}> 
                          <ListItemButton>
                            <ListItemText primary={p.name}/>
                          </ListItemButton>
                      </ListItem>
                    })}
                  </List>
                </Box>
            })}
          </Masonry>                        
        </>}
        {patientListMode == "popular" && <>
          <Masonry columns={{xs:1,md:3}} spacing={2} sx={{mt:.5}}>
            {allCases.data?.map(c=>{
              return <Box className={classes.shadowBox} minWidth="120px">
                  <Stack sx={{backgroundColor:"#edf2f6",px:2,py:1}} >
                    <Typography variant="body1">{c.emoji +" "+ c.name}</Typography>
                    <Stack direction="row" justifyContent="center" alignItems="center">
                      <Avatar sx={{ width: 16, height: 16 }}>
                        <Image src={c?.photoURL} layout='fill'/>
                      </Avatar>
                      <Typography variant="caption" sx={{mx:1}} >{c.displayName}</Typography>
                      <div style={{flexGrow:1}}/>
                      <FavoriteBorder sx={{color:"#6e7b85",fontSize:16}}/>
                      <Typography variant="caption" sx={{color:"#6e7b85"}}>{c.favs}</Typography>
                    </Stack>
                  </Stack>
                  <List>
                    {
                      c.patients?.map(p=>{
                        return( 
                        <ListItem disablePadding onClick={()=>{addPatient(p);setOpenAddPatientDialog(false)}} >
                          <ListItemButton>
                            <ListItemText primary={p.name}/>
                          </ListItemButton>
                        </ListItem>
                      )})}
                  </List>
                </Box>
              })}  
            </Masonry>                           
        </>}
      </DialogContent>
    </Dialog>             
  </>
}


export default CaseEditor


const NewAddViewDialog = ({addViewItem,patients})=>{
  const classes = useStyles()
  const [openAddViewDialog, setOpenAddViewDialog] = useState(false);
  const [view, setView] = useImmer({name: "", type: "PressureCurve", items:[{hdp:"Plv",label:"左室圧",color:getRandomColor(),patientId:patients[0]?.id,id:nanoid()}]});
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));

  return <>
    {isUpMd && <Button onClick={()=>{setOpenAddViewDialog(true)}} startIcon={<Add/>} variant='contained' disableElevation className={classes.neumoButton}>追加する</Button>}
    {!isUpMd && <div className={`bg-white px-1.5 m-1.5 mx-2 inline-flex items-center rounded-sm cursor-pointer hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300`} onClick={()=>{setOpenAddViewDialog(true)}} >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
    }
    <Dialog open={openAddViewDialog} onClose={()=>{setOpenAddViewDialog(false)}} sx={{ ".MuiDialog-paper": {m:0}}}>
      <DialogTitle>Viewを追加する</DialogTitle>
      <DialogContent>
        <Stack justifyContent='center' alignItems='flex-start' spacing={2}>
          <Stack spacing={.5}>
            <Typography variant='subtitle1' fontWeight="bold">Title</Typography>
            <ReactiveInput value={view.name} updateValue={newName=>{setView(draft=>{draft.name=newName});}} type="text" autoFocus placeholder="タイトル"/>
          </Stack>
          <Stack spacing={.5}>
            <Typography variant='subtitle1' fontWeight="bold">グラフの種類</Typography>
            <ToggleButtonGroup
              color="primary"
              value={view.type}
              exclusive
              onChange={(e,newValue)=>{setView(draft=>{
                draft.type= newValue;
                switch (newValue) {
                  case "FlowCurve": draft.items =[{hdp:"Ilad",label:"左前下行枝流量",color:getRandomColor(),patientId:patients[0].id,id:nanoid()}] ; break;
                  case "PressureCurve": draft.items =[{hdp:"Plv",label:"左室圧",color:getRandomColor(),patientId:patients[0].id,id:nanoid()}]; break;
                  case "PressureVolumeCurve": draft.items =[{hdp:"LV",label:"左室",color:getRandomColor(),patientId:patients[0].id,id:nanoid()}]; break;
                  case "Tracker" : draft.items =[{xMetric:"Lvedp",yMetric: "Sv",label:"LVEDP vs SV",recordingFrequency :3, color:getRandomColor(),patientId:patients[0].id,id:nanoid()}]; break;
                  default: draft.items = [{hdp:"Plv",label:"左室圧",color:getRandomColor(),patientId:patients[0].id,id:nanoid()}];
                }
              })}}
              sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
            >
              <ToggleButton value="PressureCurve">圧曲線</ToggleButton>
              <ToggleButton value="FlowCurve">流量曲線</ToggleButton>
              <ToggleButton value="PressureVolumeCurve">圧容量曲線</ToggleButton>
              {/* <ToggleButton value="PressureVolumeVsPressureCurve">圧容量vs圧曲線</ToggleButton> */}
              <ToggleButton value="Tracker">実験・記録</ToggleButton>
            </ToggleButtonGroup>    
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={()=>{setOpenAddViewDialog(false)}} color="inherit">キャンセル</Button>
        <Button onClick={()=>{
          addViewItem({...view,id:nanoid()});
          setView({name: "", type: "PressureCurve", items:[]})
          setOpenAddViewDialog(false)
        }} color="primary" variant="contained" className="text-white font-bold">追加する</Button>
      </DialogActions>
    </Dialog>
  </>
}