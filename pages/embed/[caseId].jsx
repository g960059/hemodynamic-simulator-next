import React, {useRef, useState, useEffect} from 'react'
import {Box,Typography,Grid,Tab,Tabs, Divider,AppBar,Tooltip, Toolbar,Button,IconButton,Stack,Switch,Dialog,DialogContent,DialogActions,DialogTitle,Popover,Autocomplete,TextField,List,ListItem,ListItemButton,ListItemText,Link,ToggleButtonGroup,ToggleButton,Avatar,useMediaQuery} from '@mui/material'
import {ArrowBack,Add,Check,Tune,FavoriteBorder,DragIndicator} from '@mui/icons-material';
import {useEngine, user$} from '../../src/hooks/usePvLoop'
import { useRouter } from 'next/router'
import PlaySpeedButtonsNext from '../../src/components/PlaySpeedButtonsNext'
import {a11yProps, TabPanel} from '../../src/components/TabUtils'
import { makeStyles } from '@mui/styles';
import {useTranslation} from '../../src/hooks/useTranslation'
import OutputPanel from '../../src/components/OutputPanel'
import ControllerPanelNext from '../../src/components/controllers/ControllerPanelNext'
import {DEFAULT_DATA, DEFAULT_TIME,DEFAULT_HEMODYANMIC_PROPS, DEFAULT_CONTROLLER_NEXT} from '../../src/utils/presets'
import {COLORS} from '../../src/styles/chartConstants'

import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import dynamic from 'next/dynamic'
import {useObservable} from "reactfire"
import {db,auth,app} from "../../src/utils/firebase"
import { mergeMap,filter,tap,map} from "rxjs/operators";
import {forkJoin, combine, combineLatest,of} from "rxjs"
import { docData, collectionData} from 'rxfire/firestore';
import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc} from 'firebase/firestore';
import { useImmer } from "use-immer";
import { nanoid } from 'nanoid'
import {objectWithoutKey,objectWithoutKeys,getRandomEmoji,useLeavePageConfirmation} from "../../src/utils/utils"
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import Lottie from 'react-lottie-player' 
import LoadingAnimation from "../../src/lotties/LoadingAnimation.json"

const RealTimeChartNext = dynamic(()=>import('../../src/components/RealTimeChartNext'), {ssr: false});
const PressureVolumeCurveNext = dynamic(()=>import('../../src/components/PressureVolumeCurveNext'), {ssr: false,});
const CombinedChart = dynamic(()=>import('../../src/components/combined/CombinedChart'), {ssr: false,});

SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY);

const useStyles = makeStyles((theme) =>(
  {
    background: {
      position: "fixed",
      zIndex: -1,
      top: "0px",
      left: "0px",
      width: "100%",
      overflow: "hidden",
      transform: "translate3d(0px, 0px, 0px)",
      height: "-webkit-fill-available",
      background: "radial-gradient(50% 50% at 50% 50%, rgb(255, 0, 122) 0%, rgb(247, 248, 250) 100%)",
      opacity: 0.15,
      userSelect: "none",
      pointerEvents: "none"
    },
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
  })
);


const App = () => {
  const classes = useStyles();
  const t = useTranslation();
  const router = useRouter()
  const {data:user} = useObservable("user",user$)
  const loadedCase = useObservable("case"+router.query.caseId,user$.pipe(
    filter(user => !!user?.uid),
    mergeMap(user => combineLatest([
      docData(doc(db,'users',user?.uid,"cases",router.query.caseId)),
      collectionData(collection(db,'users',user?.uid,"cases",router.query.caseId,"patients"),{idField: 'id'}),
      collectionData(collection(db,'users',user?.uid,"cases",router.query.caseId,"views"),{idField: 'id'})
    ])),
    map(([caseData,patients,views])=>({caseData,patients,views})),
  ))

  const scrollPatientBottomRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const engine = useEngine()
  const [patients, setPatients] = useImmer([]);
  const [defaultPatients, setDefaultPatients] = useState([]);
  const [views, setViews] = useImmer([]);
  const [defaultViews, setDefaultViews] = useState([]);
  const [caseData, setCaseData] = useImmer({});
  const [defaultCaseData, setDefaultCaseData] = useState({});

  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'), {noSsr: true});
  const controllerRef = useRef(null);
  const viewRef = useRef(null);
    
  useEffect(() => {
    setLoading(true)
    if(loadedCase.status == "success" && loadedCase.data?.patients.length>0){
      engine.setIsPlaying(false);
      loadedCase.data.patients.forEach(p=>{
        engine.register(p);
      })
      setPatients(engine.getAllPatinets().map(p=>({...p,...loadedCase.data.patients.find(_p=>_p.id==p.id)})));
      setViews(loadedCase.data.views)
      setCaseData(loadedCase.data.caseData)
      engine.setIsPlaying(true);
    }else{
      if(router.query.newItem){
        engine.setIsPlaying(false);
        const newPatientId = nanoid();
        const newPateint = {
          id: newPatientId,
          name: "",
          initialHdps: DEFAULT_HEMODYANMIC_PROPS,
          initialData: DEFAULT_DATA,
          initialTime: DEFAULT_TIME,
          controller:{ id:nanoid(), controllers: DEFAULT_CONTROLLER_NEXT, items:[],name:""},
        }
        engine.register(newPateint);
        setPatients([{...engine.getPatient(newPatientId),...newPateint}]);
        setDefaultPatients([{...engine.getPatient(newPatientId),...newPateint}]);
        const newViews = [{
          id:nanoid(),
          name: "",
          type: "PressureCurve",
          items: [
            {
              patientId:newPatientId,
              id:nanoid(),
              hdp:"Plv",
              label:"左室圧",
              color: COLORS[0]
            },{
              patientId:newPatientId,
              id:nanoid(),
              hdp:"AoP",
              label:"大動脈圧",
              color: COLORS[1]
            },{
              patientId:newPatientId,
              id:nanoid(),
              hdp:"Pla",
              label:"左房圧",
              color: COLORS[2]
            },
          ],
          options: {
            timescale: 6,
          },
        }]
        setViews(newViews);
        setDefaultViews(newViews);
        const newCaseData = {
          name:"",
          visibility: "private",
          emoji: getRandomEmoji(),
          tags:[],
          favs:0,
          uid:user.uid,
          displayName:user.displayName,
          photoURL:user.photoURL,
          patientIds:[newPatientId],
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        }
        setCaseData(newCaseData);
        setDefaultCaseData(newCaseData);
        engine.setIsPlaying(true);
      }
    }
    setLoading(false)
  }, [loadedCase.status]);


  return <div>
      {loading && <Box>
          <Lottie loop animationData={LoadingAnimation} play style={{ objectFit:"contain" }} />
        </Box>
      }
      {loadedCase.status=="success" && !loading && (isUpMd != null && isUpMd != undefined) && <> 
        <Allotment minSize={8} className="h-screen flex flex-row overflow-hidden" defaultSizes={[1,99]}>
          <Box className="h-screen overflow-auto z-[1000] bg-slate-100" ref={controllerRef}>
            <div className="p-2 flex items-center justify-center flex-col">
              {caseData.patientIds?.map((patientId,index)=>{
                const patient = patients.find(({id})=>id===patientId);
                if(patient){
                  return <Box ref={(index==patients.length-1)? scrollPatientBottomRef : null} className="w-full">
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
                      readOnly={true}
                    />
                  </Box>
                }
              })}
              <div className="mx-auto mt-2">
                <PlaySpeedButtonsNext engine={engine}/>
              </div>
            </div>
          </Box>
          <Box ref={viewRef} className="h-screen relative overflow-auto">
            <div className="px-2 py-2 flex flex-col justify-center items-center ">
              {views.map(view=>{
                return <Box key={view.id} sx={{border:"1px solid #5c93bb2b", borderRadius:"8px",backgroundColor:"white",my:1,mx:1,boxShadow:"0 10px 20px #4b57a91a", overflow:"auto",width:"100%", minWidth:{xs:"300px",md:"460px"}}} className="max-w-xl mx-auto">
                  {view.type === "PressureCurve" && 
                    <RealTimeChartNext engine={engine} initialView={view} patients={patients}
                      setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} 
                      removeView={()=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1)})}}
                      readOnly={true}
                      />
                  }
                  {view.type === "PressureVolumeCurve" && 
                    <PressureVolumeCurveNext engine={engine} initialView={view} setInitialView={newView=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1,newView)})}} removeView={()=>{setViews(draft=>{draft.splice(draft.findIndex(v=>v.id===view.id),1)})}} patients={patients} readOnly={true}/>
                  }
                </Box>
              })}
            </div>
          </Box>
        </Allotment>
      </>
      }
  </div>
}

export default App


