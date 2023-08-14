import React, {useRef, useState, useEffect} from 'react'
import {Box,Typography,Grid,Tab,Tabs, Divider,AppBar,Tooltip, Toolbar,Button,IconButton,Stack,Switch,Dialog,DialogContent,DialogActions,DialogTitle,Popover,Autocomplete,TextField,List,ListItem,ListItemButton,ListItemText,Link,ToggleButtonGroup,ToggleButton,Avatar,useMediaQuery, NoSsr} from '@mui/material'
import {ArrowBack,Add,Check,Tune,FavoriteBorder,DragIndicator} from '@mui/icons-material';
import {useEngine, user$,cases$, allCases$} from '../../src/hooks/usePvLoop'
import { useRouter } from 'next/router'
import {useTranslation} from '../../src/hooks/useTranslation'
import ReactiveInput from "../../src/components/ReactiveInput";
import {DEFAULT_DATA, DEFAULT_TIME,DEFAULT_HEMODYANMIC_PROPS, DEFAULT_CONTROLLER_NEXT, paramPresets} from '../../src/utils/presets'
import {COLORS} from '../../src/styles/chartConstants'

import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo';
import {useObservable} from "reactfire"
import {db} from "../../src/utils/firebase"
import { mergeMap,filter,tap,map} from "rxjs/operators";
import {forkJoin, combine, combineLatest,of} from "rxjs"
import { docData, collectionData} from 'rxfire/firestore';
import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc, getDocs, limit, collectionGroup,  query} from 'firebase/firestore';
import { useImmer } from "use-immer";
import { nanoid } from 'nanoid'
import isEqual from "lodash/isEqual"
import {objectWithoutKey,objectWithoutKeys,getRandomEmoji,useLeavePageConfirmation} from "../../src/utils/utils"
import { Picker } from 'emoji-mart'
import { getRandomColor } from '../../src/styles/chartConstants';
import Lottie from 'react-lottie-player' 
import LoadingAnimation from "../../src/lotties/LoadingAnimation.json"
import Background from '../../src/elements/Background';
import NeumoButton from '../../src/elements/NeumoButton';

const CaseEditor = dynamic(() => import('../../src/components/CaseEditor'),{ssr:false})



const App = () => {

  const t = useTranslation();
  const router = useRouter()
  const {data:user} = useObservable("user",user$)
  const loadedCase = useObservable("case"+router.query.caseId, user$.pipe(
    tap(user=>{console.log(user)}),
    mergeMap(user => user ?  combineLatest({
      caseData: docData(doc(db,'users',user?.uid,"cases",router.query.caseId),{idField:"id"}),
      patients: collectionData(collection(db,'users',user?.uid,"cases",router.query.caseId,"patients"),{idField: 'id'}),
      views: collectionData(collection(db,'users',user?.uid,"cases",router.query.caseId,"views"),{idField: 'id'}),
      outputs:collectionData(collection(db,'users',user?.uid,"cases",router.query.caseId,"outputs"),{idField: 'id'})
    }) : of({caseData:{},patients:[],views:[],outputs:[]})),
  ))
  const cases = useObservable("cases", combineLatest([user$,cases$]).pipe(
    filter(([user_])=>!!user_?.uid),
    mergeMap(([user_,cases_]) =>
      combineLatest(cases_.map(caseData_ => collectionData(collection(db,'users',user_.uid,"cases",caseData_.id,"patients"),{idField: 'id'}))).pipe(
        map((patients_) =>cases_.map((case_,index)=>({...case_,patients: patients_[index]})))
      )
    )
  ));
  
  const [loading, setLoading] = useState(true);

  const engine = useEngine()
  const [patients, setPatients] = useImmer([]);
  const [views, setViews] = useImmer([]);
  const [defaultPatients, setDefaultPatients] = useState([]);
  const [defaultViews, setDefaultViews] = useState([]);
  const [caseData, setCaseData] = useImmer({});
  const [defaultCaseData, setDefaultCaseData] = useState({});
  const [allCases, setAllCases] = useState([]);

  const [caseNameEditing, setCaseNameEditing] = useState(false);
  const [openPublishDialog, setOpenPublishDialog] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);

  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'), {noSsr: true});

  const isChanged = (loadedCase.status == "success" && loadedCase.data?.caseData &&
    (!isEqual(objectWithoutKeys(caseData,["updatedAt","createdAt","id"]),objectWithoutKeys(loadedCase.data.caseData,["updatedAt","createdAt","id"])) || 
    !patients.every(p=>{
      const originalPatient = loadedCase.data?.patients.find(({id})=>id===p.id);
      if(!originalPatient) return false;
      return originalPatient.name === p.name  && isEqual(originalPatient.initialHdps,p.getHdps())
    }) || !isEqual(views,loadedCase.data.views))) || 
    (
      !loadedCase.data?.caseData &&
      (!isEqual(objectWithoutKey(caseData,"updatedAt"),objectWithoutKey(defaultCaseData,"updatedAt")) || 
      !patients.every(p=>{
        const originalPatient = defaultPatients.find(({id})=>id===p.id);
        if(!originalPatient) return false;
        return originalPatient.name === p.name  && isEqual(originalPatient.initialHdps,p.getHdps())
      }) || !isEqual(views,defaultViews) )
    )

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
      // setOutputs(loadedCase.data.outputs)
      engine.setIsPlaying(true);
    }else{
      if(router.query.newItem && loadedCase.status == "success"){
        engine.setIsPlaying(false);
        const newPatientId = nanoid();
        const newPateint = {
          id: newPatientId,
          ...paramPresets["Normal"]
        }
        engine.register(newPateint);
        setPatients([{...engine.getPatient(newPatientId),...newPateint}]);
        setDefaultPatients([{...engine.getPatient(newPatientId),...newPateint}]);
        const newViewId = nanoid();
        const newPlaySpeedId = nanoid();
        const newOutputId = nanoid();
        const newControllerId = nanoid();
        const newViews = [
          {
            id: newControllerId,
            name: "Basic Parameters",
            type: "Controller",
            patientId: newPatientId,
            items: [
              {mode:"basic",label: t["Volume"],hdp:'Volume',options:[], id:nanoid()},
              {mode:"basic",label: t["HR"],hdp:'HR',options:[], id:nanoid()},
              {mode:"basic",label: t["LV_Ees"],hdp:'LV_Ees',options:[], id:nanoid()},
              {mode:"basic",label: t["LV_alpha"],hdp:'LV_alpha',options:[], id:nanoid()},
              {mode:"basic",label: t["Rcs"],hdp:'Rcs',options:[], id:nanoid()},
              {mode:"advanced",label: t["Hb"],hdp:'Hb',options:[], id:nanoid()},
              {mode:"advanced",label: t["VO2"],hdp:'VO2',options:[], id:nanoid()}
            ],
          },
          {
            id: newViewId,
            name: "Pressure Chart",
            type: "PressureCurve",
            items: [
              {
                patientId:newPatientId,
                id:nanoid(),
                hdp:"Plv",
                label:"左室圧",
                color: getRandomColor()
              },{
                patientId:newPatientId,
                id:nanoid(),
                hdp:"AoP",
                label:"大動脈圧",
                color: getRandomColor()
              },{
                patientId:newPatientId,
                id:nanoid(),
                hdp:"Pla",
                label:"左房圧",
                color: getRandomColor()
              },
            ],
            options: {
              timeWindow: 6,
            },
          },{
            id: newPlaySpeedId,
            type: "PlaySpeed",
          },{
            id: newOutputId,
            name: "Metrics",
            type: "Metrics",
            items:[
              {
                id: nanoid(),
                label: "大動脈圧",
                patientId: newPatientId,
                hdp: "Aop",
              },
              {
                id: nanoid(),
                label: "中心静脈圧",
                patientId: newPatientId,
                hdp: "Cvp",
              },
              {
                id: nanoid(),
                label: "心拍出量",
                patientId: newPatientId,
                hdp: "Co",
              },
              {
                id: nanoid(),
                label: "EF",
                patientId: newPatientId,
                hdp: "Ef",
              },
              {
                id: nanoid(),
                label: "左室仕事量",
                patientId: newPatientId,
                hdp: "Cpo",
              },
              {
                id: nanoid(),
                label: "LMT流量",
                patientId: newPatientId,
                hdp: "Ilmt",
              },
              {
                id: nanoid(),
                label: "SVO2",
                patientId: newPatientId,
                hdp: "Svo2",
              },
              {
                id: nanoid(),
                label: "CS-SVO2",
                patientId: newPatientId,
                hdp: "Cssvo2",
              }
            ]
          }
        ]
        setViews(newViews);
        setDefaultViews(newViews);
        const newCaseData = {
          name:"",
          visibility: "private",
          emoji: getRandomEmoji(),
          tags:[],
          heartCount:0,
          userId: user?.userId,
          uid: user?.uid,
          displayName: user?.displayName,
          photoURL: user?.photoURL,
          layouts:{
            xs: [{i:newControllerId,x:0,y:0,w:12,h:12, minW:3},{i:newViewId,x:0,y:1,w:12,h:10,minW:3},{i: newOutputId, x:0,y:2,w:12,h:7}, {i:newPlaySpeedId,x:0,y:2,w:12,h:2},], 
            md:[{i:newControllerId,x:0,y:0,w:4,h:10, minW:3},{i:newViewId,x:4,y:0,w:7,h:9,minW:3}, {i:newPlaySpeedId,x:11,y:0,w:1,h:4},{i: newOutputId, x:4,y:9,w:8,h:3}],
          },
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


  useEffect(() => {
    const getAllCases = async () => {
      const tmpAllCases = []
      const allCasesSnap = await getDocs(query(collectionGroup(db,'cases'),limit(50)))
      allCasesSnap.forEach(async d=>{
        const caseData_ = d.data()
        const casePatients = []
        const casePatientsSnap = await getDocs(collection(db,'users',caseData_.uid,'cases',d.id,'patients'))
        casePatientsSnap.forEach(d=>{casePatients.push({...d.data(),id:d.id})})
        tmpAllCases.push({...caseData_,patients:casePatients})
      })
      setAllCases(tmpAllCases)
    }
    getAllCases()
  }, []);


  useLeavePageConfirmation(Boolean(isChanged))

  // const addPatient = patient =>{
  //   const newPatient = {...patient,id:nanoid()}
  //   engine.register(newPatient);
  //   setPatients(draft=>{draft.push({...newPatient, ...engine.getPatient(newPatient.id)})})
  //   setCaseData(draft=>{draft.patientIds.push(newPatient.id)})
  //   setTimeout(()=>{scrollPatientBottomRef.current?.scrollIntoView({behavior: "smooth"});},100)
  // }

  const updateCase = async () =>{
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    if(!loadedCase.data.caseData){
      batch.set(doc(db,'users',user?.uid,"cases",router.query.caseId),{...caseData,updatedAt:timestamp,createdAt:timestamp})
    }else{
      batch.update(doc(db,'users',user?.uid,"cases",router.query.caseId),{...caseData,updatedAt:timestamp})
    }
    loadedCase.data?.patients.forEach(p=>{
      if(!patients.some(({id})=>id===p.id)){
        batch.delete(doc(db,'users',user?.uid,"cases",router.query.caseId,"patients",p.id))
      }
    })
    patients.forEach(p=>{
      const patient = loadedCase.data?.patients.find(({id})=>id===p.id);
      console.log(patient)
      if(!patient){
        batch.set(doc(db,'users',user?.uid,"cases",router.query.caseId,"patients",p.id),{
          name: p.name,
          initialHdps:p.getHdps(),
          initialData: p.getDataSnapshot(),
          initialTime: p.getTimeSnapshot(),
        })
      }else{
        if(patient.name !== p.name || !isEqual(p.initialHdps,p.getHdps())){
          batch.update(doc(db,'users',user?.uid,"cases",router.query.caseId,"patients",p.id),{
            name: p.name,
            initialHdps:p.getHdps(),
            initialData: p.getDataSnapshot(),
            initialTime: p.getTimeSnapshot(),
          })
        }
      }
    })
    loadedCase.data?.views.forEach(v=>{
      if(!views.some(({id})=>id===v.id)){
        batch.delete(doc(db,'users',user?.uid,"cases",router.query.caseId,"views",v.id))
      }
    })
    views.forEach(v=>{
      const view = loadedCase.data?.views.find(({id})=>id===v.id)
      if(!view){
        batch.set(doc(db,'users',user?.uid,"cases",router.query.caseId,"views",v.id),{...v})
      }else{
        if(!isEqual(view,v)){
          batch.update(doc(db,'users',user?.uid,"cases",router.query.caseId,"views",v.id),{...v})
        }
      }
    })
    // loadedCase.data?.outputs.forEach(o=>{
    //   if(!outputs.some(({id})=>id===o.id)){
    //     batch.delete(doc(db,'users',user?.uid,"cases",router.query.caseId,"outputs",o.id))
    //   }
    // })
    // outputs.forEach(o=>{
    //   const output = loadedCase.data?.outputs.find(({id})=>id===o.id)
    //   if(!output){
    //     batch.set(doc(db,'users',user?.uid,"cases",router.query.caseId,"outputs",o.id),{...o})
    //   }else{
    //     if(!isEqual(output,o)){
    //       batch.update(doc(db,'users',user?.uid,"cases",router.query.caseId,"outputs",o.id),{...o})
    //     }
    //   }
    // })
    await batch.commit()
  }

  if (!loading ) return <div>
      <nav className="bg-white shadow md:sticky md:top-0 md:right-0 z-[1100]">
        <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className='flex h-16 justify-between items-center'>
            <Box onClick={()=>{router.push("/dashboard/cases")}} sx={{cursor:"pointer",fontFamily: "GT Haptik Regular" ,fontWeight: 'bold',display:"flex"}}>
              <IconButton><ArrowBack/></IconButton>
            </Box>
            <Box sx={{display:{xs:"none",md:"block"}}}>
            {
              caseNameEditing ? 
                <ReactiveInput 
                  value={caseData.name} 
                  updateValue={(newValue)=>{
                    setCaseData(draft=>{draft.name=newValue})
                    setCaseNameEditing(false)
                  }} 
                  type="text" autoFocus  allowEmpty
                /> : 
                <Typography variant="h4" fontWeight="bold" onClick={()=>{setCaseNameEditing(true)}} sx={{"&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"},cursor:"pointer",px:1,color:!caseData.name&&"gray"}}>{caseData.name || "Title"}</Typography>                
              }          
            </Box>
            <div style={{flexGrow:1}}/>
            <IconButton sx={{ml:.5}} onClick={()=>{setOpenPublishDialog(true)}}><Tune/></IconButton>
            <Switch checked={caseData.visibility=="public"} onChange={e=>{const newVal = e.target.checked ? "public":"private"; setCaseData(draft =>{draft.visibility=newVal})}}/>
            <Typography variant='button' sx={{color: caseData.visibility=="public" ? "black": "gray", mr:1}}>{t["Publish"]}</Typography>
            <Button
              className="font-bold text-white"
              variant='contained' 
              disableElevation 
              onClick={caseData.visibility=="private" || caseData.visibility=="public" && loadedCase.data?.caseData?.visibility=="public" ? ()=>{updateCase()} : ()=>{setOpenPublishDialog(true)}}
              disabled={!isChanged}
              endIcon = {!isChanged&&<Check/>}
            >
              {isChanged ? (caseData.visibility=="private" ? "下書き保存" : (caseData.visibility=="public" && loadedCase.data?.visibility=="public" ? "保存する" : t["Publish"] )) : t["Saved"]}
            </Button>

          </div>
        </div>
      </nav>   
      <NextSeo title={t["Simulator"]}/>
      <Background/>
      {!isUpMd && <div className="bg-slate-200 h-full w-screen fixed -z-10"/>}
      <div className='md:hidden p-2'>
        {
          caseNameEditing ? 
            <ReactiveInput 
              value={caseData.name} 
              updateValue={(newValue)=>{
                setCaseData(draft=>{draft.name=newValue})
                setCaseNameEditing(false)
              }} 
              type="text" autoFocus allowEmpty fullWidth
            /> : 
            <Typography variant="h6" fontWeight="bold" onClick={()=>{setCaseNameEditing(true)}} sx={{"&:hover":{backgroundColor:"rgba(0, 0, 0, 0.04)"},cursor:"pointer",px:1,color:!caseData.name&&"gray"}}>{caseData.name || "Title"}</Typography>                
          } 
      </div>
      <div className='px-2 md:px-4 lg:px-6'>
        {loading && <Lottie loop animationData={LoadingAnimation} play style={{ objectFit:"contain" }} />}
        {!loading && caseData?.createdAt &&  <CaseEditor engine={engine} caseData={caseData} setCaseData={setCaseData} patients={patients} setPatients={setPatients} views={views} setViews={setViews} allCases={allCases} user={user}/>
        }
      </div>
    <Dialog open={openPublishDialog} onClose={()=>setOpenPublishDialog(false)} sx={{minHeight:'340px'}}>
      <DialogTitle >
        症例の設定
      </DialogTitle>
      <DialogContent>
        <Stack direction="row" sx={{backgroundColor:"#edf2f6",borderRadius:"10px",color:"#6e7b85",mb:2,mt:1,p:2,position:"relative",alignItems:"center"}}>
          <Box onClick={e=>{setEmojiAnchorEl(e.currentTarget)}} sx={{fontSize:"50px",cursor:"pointer"}}>{caseData.emoji}</Box>
          <Popover open={Boolean(emojiAnchorEl)} anchorEl={emojiAnchorEl} onClose={()=>{setEmojiAnchorEl(null)}} anchorOrigin={{vertical: 'bottom',horizontal:'left'}}>
            <Picker emoji={caseData.emoji} onSelect={newEmoji=>{setCaseData(draft=>{draft.emoji = newEmoji.native})}} showPreview={false} showSkinTones={false}/>
          </Popover>
          <Divider orientation="vertical" flexItem sx={{mx:2}}/>
          <Typography variant='subtitle2'>アイキャッチ絵文字を変更する</Typography>
        </Stack>
        <Typography variant='subtitle1' fontWeight="bold">Title</Typography>
        <ReactiveInput value={caseData.name} updateValue={newName=>{setCaseData(draft=>{draft.name=newName});}} type="text" autoFocus/>
        <Typography variant='subtitle1' fontWeight="bold" sx={{mt:2}}>Tags</Typography>
        <Stack direction="column">
          <Typography variant="caption" color="#6e7b85">関連するタグを選んでください。</Typography>
          <Typography variant="caption" color="#6e7b85">最初のタグが一覧で表示されます。</Typography>
        </Stack>
        <Box mt={1}>
          <Autocomplete 
            freeSolo multiple value={caseData.tags} 
            onChange={(e,newTags)=>{setCaseData(draft=>{draft.tags=newTags})}}
            options={[]}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
              />)}
            sx={{ "&.MuiAutocomplete-root":{
              backgroundColor: '#f1f5f9',
              borderRadius: '4px',
              border: '1px solid #5c93bb2b',
              '&:hover': {
                borderColor: '#3ea8ff',
              },
              "& .MuiOutlinedInput-root":{padding:"3px 9px"},
              "& .MuiInput-input": {border: 'none',padding: '8px 0 8px 16px'},
              "& p.MuiTypography-root":{
                fontSize: "0.7rem"
              },
              "& .Mui-focused .MuiOutlinedInput-notchedOutline":{border:"none"}
            }}}
            />
        </Box>
      </DialogContent>
      <DialogActions sx={{display:"flex", justifyContent:"center",mb:2}}>
        <Button onClick={()=>{updateCase();setOpenPublishDialog(false)}} variant='contained' disableElevation disabled={!isChanged} className='font-bold text-white'>
          {isChanged ? (caseData.visibility=="private" || caseData.visibility=="public" && loadedCase.data?.caseData?.visibility=="public" ? t["Save"] : t["Publish"]) : t["Saved"]}
        </Button>
      </DialogActions>
    </Dialog>
  </div>
}

export default App


