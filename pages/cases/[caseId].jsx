import React, {useRef, useState, useEffect} from 'react'
import {Box,Typography,Grid,Tab,Tabs, Divider,AppBar,Tooltip, Toolbar,Button,IconButton,Stack,Switch,Dialog,DialogContent,DialogActions,DialogTitle,Popover,Autocomplete,TextField,List,ListItem,ListItemButton,ListItemText,Link,ToggleButtonGroup,ToggleButton,Avatar,useMediaQuery, NoSsr} from '@mui/material'
import {ArrowBack,Add,Check,Tune,FavoriteBorder,DragIndicator} from '@mui/icons-material';
import {useEngine, user$,cases$, allCases$} from '../../../hooks/usePvLoop'
import { useRouter } from 'next/router'
import {useTranslation} from '../../../hooks/useTranslation'
import ReactiveInput from "../../../components/ReactiveInput";
import {DEFAULT_DATA, DEFAULT_TIME,DEFAULT_HEMODYANMIC_PROPS, DEFAULT_CONTROLLER_NEXT, paramPresets} from '../../../utils/presets'

import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo';
import {useObservable} from "reactfire"
import {db,auth} from "../../../utils/firebase"
import { mergeMap,filter,tap,map} from "rxjs/operators";
import {forkJoin, combine, combineLatest,of} from "rxjs"
import { docData, collectionData} from 'rxfire/firestore';
import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc, getDocs, limit, collectionGroup,  query} from 'firebase/firestore';
import { useImmer } from "use-immer";
import { nanoid } from 'nanoid'
import isEqual from "lodash/isEqual"
import {objectWithoutKey,objectWithoutKeys,getRandomEmoji,useLeavePageConfirmation, deepEqual,deepEqual2} from "../../../utils/utils"
import { Picker } from 'emoji-mart'
import { getRandomColor } from '../../../styles/chartConstants';
import Lottie from 'react-lottie-player' 
import LoadingAnimation from "../../../lotties/LoadingAnimation.json"
import Background from '../../../elements/Background';
import Layout from '../../../components/layout';
import Footer from '../../../components/Footer';

const CaseEditor = dynamic(() => import('../../../components/CaseEditor'),{ssr:false})



const App = () => {

  const t = useTranslation();
  const router = useRouter()
  const {data:user} = useObservable(`user_${auth?.currentUser?.uid}`,user$)
  const caseUid = router.query.caseUid || user?.uid
  
  const loadedCase = useObservable("case"+router.query.caseId, of(caseUid).pipe(
    mergeMap(caseUid => caseUid ?  combineLatest({
      caseData: docData(doc(db,'users',caseUid,"cases",router.query.caseId),{idField:"id"}),
      patients: collectionData(collection(db,'users',caseUid,"cases",router.query.caseId,"patients"),{idField: 'id'}),
      views: collectionData(collection(db,'users',caseUid,"cases",router.query.caseId,"views"),{idField: 'id'}),
    }) : of({caseData:{},patients:[],views:[]})),
    map(data => {
      const updatedData = { ...data };
      if (updatedData.caseData && typeof updatedData.caseData.layouts === 'string') {
        try {
          updatedData.caseData.layouts = JSON.parse(updatedData.caseData.layouts);
        } catch (error) {
          console.error("Error parsing layouts JSON: ", error);
        }
      }
      if (updatedData.views && Array.isArray(updatedData.views)) {
        updatedData.views = updatedData.views.map(view => {
          if (view.type === "Note" && typeof view.content === 'string') {
            try {
              view.content = JSON.parse(view.content);
            } catch (error) {
              console.error("Error parsing view content JSON: ", error);
            }
          }
          return view;
        });
      }      
      return updatedData;
    })
  ));
  
  const [loading, setLoading] = useState(true);

  const engine = useEngine()
  const [patients, setPatients] = useImmer([]);
  const [views, setViews] = useImmer([]);
  const [defaultPatients, setDefaultPatients] = useState([]);
  const [defaultViews, setDefaultViews] = useState([]);
  const [caseData, setCaseData] = useImmer({});
  const [defaultCaseData, setDefaultCaseData] = useState({});
  const isOwner = caseData.uid == user?.uid 

  const [caseNameEditing, setCaseNameEditing] = useState(false);
  const [openPublishDialog, setOpenPublishDialog] = useState(false);
  const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);

  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'), {noSsr: true});
  
  const isCaseDataChanged = loadedCase.status == "success" && loadedCase.data?.caseData &&
                            !(deepEqual(caseData, loadedCase.data.caseData, ["updatedAt","createdAt","id","layouts"])  && caseData?.layouts &&  deepEqual2(JSON.parse(JSON.stringify(caseData?.layouts)), loadedCase.data.caseData?.layouts,[],true) )

  const isNewCaseDataChanged = !loadedCase.data?.caseData && !deepEqual(caseData, defaultCaseData, ["updatedAt","createdAt","id"]) 
  const isPatientsChanged = loadedCase.status == "success" && loadedCase.data?.patients && !patients.every(p=>{
    const originalPatient = loadedCase.data?.patients.find(({id})=>id===p.id);
    if(!originalPatient) return false;
    return originalPatient.name === p.name  && deepEqual(originalPatient.initialHdps,p.getHdps())
  })
  const isNewPatientsChanged = !loadedCase.data?.caseData && !patients.every(p=>{
    const originalPatient = defaultPatients.find(({id})=>id===p.id);
    if(!originalPatient) return false;
    return originalPatient.name === p.name  && deepEqual(originalPatient.initialHdps,p.getHdps())
  })
  const isViewsChanged = loadedCase.status == "success" && loadedCase.data?.views && !views.every(v=>{
    const originalView = loadedCase.data?.views.find(({id})=>id===v.id);
    return originalView && deepEqual(originalView,v)
  })
  const isNewViewsChanged = !loadedCase.data?.caseData && !views.every(v=>{
    const originalView = defaultViews.find(({id})=>id===v.id);
    return originalView && deepEqual(originalView,v)
  })

  const isChanged = isCaseDataChanged || isNewCaseDataChanged || isPatientsChanged || isNewPatientsChanged || isViewsChanged || isNewViewsChanged
 

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
        const newNoteId = nanoid();
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
          },{
            id: newNoteId,
            name: "Note",
            type: "Note",
            content: [{id:nanoid(),type:"paragraph",props:{textColor:"default",backgroundColor:"default",textAlignment:"left"},content:[],children:[]}],
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
            xs: [{i:newControllerId,x:0,y:0,w:12,h:12, minW:3},{i:newViewId,x:0,y:1,w:12,h:10,minW:3},{i: newOutputId, x:0,y:2,w:12,h:7}, {i:newPlaySpeedId,x:0,y:2,w:12,h:2},{i: newNoteId, x:0,y:3,w:12,h:3}], 
            md:[{i:newControllerId,x:0,y:0,w:4,h:10, minW:3},{i:newViewId,x:4,y:0,w:7,h:10,minW:3}, {i:newPlaySpeedId,x:11,y:0,w:1,h:6},{i: newOutputId, x:6,y:10,w:6,h:3}, {i: newNoteId, x:0,y:10,w:6,h:6}],
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
  }, [loadedCase.status, loadedCase.data]);


  useLeavePageConfirmation(Boolean(isChanged))


  const updateCase = async () =>{
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();
    if(!loadedCase.data.caseData){
      batch.set(doc(db,'users',user?.uid,"cases",router.query.caseId),{...caseData,layouts: JSON.stringify(caseData.layouts), updatedAt:timestamp,createdAt:timestamp})
    }else{
      batch.update(doc(db,'users',user?.uid,"cases",router.query.caseId),{...caseData,layouts: JSON.stringify(caseData.layouts),updatedAt:timestamp})
    }
    loadedCase.data?.patients.forEach(p=>{
      if(!patients.some(({id})=>id===p.id)){
        batch.delete(doc(db,'users',user?.uid,"cases",router.query.caseId,"patients",p.id))
      }
    })
    patients.forEach(p=>{
      const patient = loadedCase.data?.patients.find(({id})=>id===p.id);
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
        if(v.type == "Note"){
          batch.set(doc(db,'users',user?.uid,"cases",router.query.caseId,"views",v.id),{...v,content:JSON.stringify(v.content)})
        }else{
          batch.set(doc(db,'users',user?.uid,"cases",router.query.caseId,"views",v.id),{...v})
        }
      }else{
        if(!isEqual(view,v)){
          if(v.type == "Note"){
            batch.update(doc(db,'users',user?.uid,"cases",router.query.caseId,"views",v.id),{...v,content:JSON.stringify(v.content)})
          }else{
            batch.update(doc(db,'users',user?.uid,"cases",router.query.caseId,"views",v.id),{...v})
          }
        }
      }
    })

    await batch.commit()
  }
  if(loading || isOwner == undefined){return (
    <Lottie loop animationData={LoadingAnimation} play style={{ objectFit:"contain" }} />
  )}else{
    if (isOwner){
      return <div>
          <nav className="bg-white shadow md:sticky md:top-0 md:right-0 z-[1100]">
            <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
              <div className='flex h-16 justify-between items-center'>
                <Box onClick={()=>{router.push("/")}} sx={{cursor:"pointer",fontFamily: "GT Haptik Regular" ,fontWeight: 'bold',display:"flex"}}>
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
            {caseData?.createdAt &&  <CaseEditor engine={engine} caseData={caseData} setCaseData={setCaseData} patients={patients} setPatients={setPatients} views={views} setViews={setViews} user={user} isOwner={isOwner}/>}   
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
    }else{
      return <>
      <Layout>
        <div className='md:hidden p-2'>
          <h1 className='font-bold text-lg'>{caseData?.name || "Title"}</h1>    
        </div>
        <div className='px-2 md:px-4 lg:px-6'>
          {caseData?.createdAt  &&   <CaseEditor engine={engine} caseData={caseData} setCaseData={setCaseData} patients={patients} setPatients={setPatients} views={views} setViews={setViews} user={user} isOwner={isOwner}/>}   
        </div>
      </Layout>
      <hr className="border-0 border-b border-slate-200"/>
      <Footer/>
    </>
    }
  }

  
}

export default App


  // const cases = useObservable("cases", combineLatest([user$,cases$]).pipe(
  //   filter(([user_])=>!!user_?.uid),
  //   mergeMap(([user_,cases_]) =>
  //     combineLatest(cases_.map(caseData_ => collectionData(collection(db,'users',user_.uid,"cases",caseData_.id,"patients"),{idField: 'id'}))).pipe(
  //       map((patients_) =>cases_.map((case_,index)=>({...case_,patients: patients_[index]})))
  //     )
  //   )
  // ));
  
    // useEffect(() => {
  //   const getAllCases = async () => {
  //     const tmpAllCases = []
  //     const allCasesSnap = await getDocs(query(collectionGroup(db,'cases'),limit(50)))
  //     allCasesSnap.forEach(async d=>{
  //       const caseData_ = d.data()
  //       const casePatients = []
  //       const casePatientsSnap = await getDocs(collection(db,'users',caseData_.uid,'cases',d.id,'patients'))
  //       casePatientsSnap.forEach(d=>{casePatients.push({...d.data(),id:d.id})})
  //       tmpAllCases.push({...caseData_,patients:casePatients})
  //     })
  //     setAllCases(tmpAllCases)
  //   }
  //   getAllCases()
  // }, []);

    // const addPatient = patient =>{
  //   const newPatient = {...patient,id:nanoid()}
  //   engine.register(newPatient);
  //   setPatients(draft=>{draft.push({...newPatient, ...engine.getPatient(newPatient.id)})})
  //   setCaseData(draft=>{draft.patientIds.push(newPatient.id)})
  //   setTimeout(()=>{scrollPatientBottomRef.current?.scrollIntoView({behavior: "smooth"});},100)
  // }


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