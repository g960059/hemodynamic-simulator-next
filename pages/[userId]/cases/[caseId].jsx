import React, {useRef, useState, useEffect, useCallback} from 'react'
import {Box,Typography,Grid,Tab,Tabs, Divider,AppBar,Tooltip, Toolbar,Button,IconButton,Stack,Menu,Dialog,DialogContent,DialogActions,DialogTitle,Popover,MenuItem,TextField,List,ListItem,ListItemButton,ListItemText,Link,ToggleButtonGroup,ToggleButton,Avatar,useMediaQuery, DialogContentText, NoSsr} from '@mui/material'
import {ArrowBack,Add,Favorite,FavoriteBorder,EventNoteOutlined,FeedOutlined,SettingsOutlined,Logout,Feed,EventNote, Edit,CalendarToday, ConstructionOutlined} from '@mui/icons-material';
import Masonry from '@mui/lab/Masonry';
import {useEngine, user$,cases$, allCases$} from '../../../src/hooks/usePvLoop'
import { useRouter } from 'next/router'
import PlaySpeedButtonsNext from '../../../src/components/PlaySpeedButtonsNext'
import {a11yProps, TabPanel} from '../../../src/components/TabUtils'
import { makeStyles } from '@mui/styles';
import {useTranslation} from '../../../src/hooks/useTranslation'
import OutputPanel from '../../../src/components/OutputPanel'
import ControllerPanelNext from '../../../src/components/controllers/ControllerPanelNext'
import ReactiveInput from "../../../src/components/ReactiveInput";
import Image from 'next/image'
import {signOut} from "firebase/auth";

import { SciChartSurface } from "scichart/Charting/Visuals/SciChartSurface";
import dynamic from 'next/dynamic'
import { NextSeo } from 'next-seo';
import {useObservable} from "reactfire"
import {db,StyledAuth,auth} from "../../../src/utils/firebase"

import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc, getDocs, getDoc, query, collectionGroup, orderBy, limit, increment} from 'firebase/firestore';
import { useImmer } from "use-immer";
import {nanoid,formatDateDiff} from "../../../src/utils/utils"
import Split from 'react-split'
import { getRandomColor } from '../../../src/styles/chartConstants';
import Lottie from 'react-lottie-player' 
import LoadingAnimation from "../../../src/lotties/LoadingAnimation.json"
import {format} from "date-fns"
import { combineLatest, filter, map, mergeMap, of, zip } from 'rxjs';
import { collectionData, docData } from 'rxfire/firestore';
import { useLocalStorage } from "../../../src/hooks";

const RealTimeChartNext = dynamic(()=>import('../../../src/components/RealTimeChartNext'), {ssr: false});
const PressureVolumeCurveNext = dynamic(()=>import('../../../src/components/PressureVolumeCurveNext'), {ssr: false,});
const CombinedChart = dynamic(()=>import('../../../src/components/combined/CombinedChart'), {ssr: false,});

SciChartSurface.setRuntimeLicenseKey(process.env.NEXT_PUBLIC_LICENSE_KEY);

const useStyles = makeStyles((theme) =>(
  {
    containerBox: {
      height: `calc(100vh - 56px)`,
    },
    subContainerBox: {
      height: `auto`,
      [theme.breakpoints.up('md')]: {
        maxHeight : `calc(100vh - 174px)`,
      },
    },
    appBar: {
      backgroundColor: 'transparent',
      color: 'inherit'
    },
    background: {
      position: "fixed",
      zIndex: -1,
      top: "0px",
      left: "0px",
      width: "100%",
      overflow: "hidden",
      transform: "translate3d(0px, 0px, 0px)",
      height: "-webkit-fill-available",
      background: "radial-gradient(50% 50% at 50% 50%, #3ea8ff 0%, #f5f5f5 100%)",
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
    shadowBox: {
      backgroundColor: "white",
      boxShadow: "0 10px 20px #4b57a936",
      border: "1px solid rgba(239, 246, 251, 0.6)"
    },   
    split: {
      display: "flex",
      overflow: "hidden",
      [theme.breakpoints.up('md')]: {
        height: `calc(100vh - 64px)`,
        flexDirection: "row",
        "& .gutter.gutter-horizontal":{
          backgroundImage: 'url("/vertical.png")',
          backgroundColor: "rgb(229, 231, 235)",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "50% center",
          zIndex:1000,
          cursor: "col-resize",
        }
      },
      [theme.breakpoints.down('md')]: {
        height: `calc(100vh - 59px)`,
        flexDirection: "column",
        "& .gutter.gutter-vertical":{
          backgroundImage: 'url("/horizontal.png")',
          backgroundColor: "#f1f4f9",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "50% center",
          zIndex:1000
        }
      },      
    }, 
    childSplit: {
      height: `calc(100vh - 66px)`,
      "& .gutter.gutter-vertical":{
        backgroundImage: 'url("/horizontal.png")',
        backgroundColor: "#f1f4f9",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "50% center",
        zIndex:1000
      }   
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
    favoritedButton: {
      color: "#f76685",
      backgroundColor: "#ffeaf4",
      border: "none",
      "& .MuiOutlinedInput-notchedOutline": {border:"none"}
    },     
  })
);


const CaseReader = () => {
  const classes = useStyles();
  const t = useTranslation();
  const router = useRouter()
  const [allCases, setAllCases] = useState([]);
  const [selectedView, setSelectedView] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showController, setShowController] = useState(true );

  const uid$ = of(router.query.userId).pipe(
    filter(Boolean),
    mergeMap(userId=> docData(doc(db,'userIds',userId))),
    map(user => user?.uid)
  );
  const caseId$ = of(router.query.caseId).pipe(
    filter(Boolean),
  )

  const loadedCase = useObservable("case"+router.query?.caseId,combineLatest([uid$,of(router.query?.caseId)]).pipe(
    filter(([uid,caseId])=>uid && caseId),
    mergeMap(([uid,caseId]) => combineLatest([
      docData(doc(db,'users',uid,"cases",caseId)),
      collectionData(collection(db,'users',uid,"cases",caseId,"patients"),{idField: 'id'}),
      collectionData(collection(db,'users',uid,"cases",caseId,"views"),{idField: 'id'})
    ])),
    map(([caseData,patients,views])=>({caseData,patients,views})),
  ))

  const caseUser$= uid$.pipe(
    filter(Boolean),
    mergeMap(uid=>docData(doc(db,'users',uid),{idField: 'uid'})),
  )

  const {data:caseUser} = useObservable(`user_${router.query.caseId}`,caseUser$)
  const {data:user} = useObservable("caseData",user$)


  const [dialogOpen, setDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [newItemAnchorEl, setNewItemAnchorEl] = useState(null);

  const createNewCase =  async () => {
    const caseId = nanoid()
    router.push({pathname:`/cases/${caseId}`,query:{newItem:true}})
    setNewItemAnchorEl(null)
  }
  const createNewArticle =  async () => {
    const articleId = nanoid()
    router.push({pathname:`/articles/${articleId}`,query:{newItem:true}})
    setNewItemAnchorEl(null)
  }  

  const scrollPatientBottomRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const engine = useEngine()
  const [patients, setPatients] = useImmer();
  const [views, setViews] = useImmer();
  const [caseData, setCaseData] = useImmer();
  const [outputs, setOutputs] = useImmer([
    {
      id: "safasdf",
      label: "tab1",
      items:[
        {
          id: "tete",
          label: "大動脈圧",
          patientId: "7b819fa14a378b",
          metric: "Aop",
        },
        {
          id: "dsdfaf",
          label: "",
          patientId: "7b819fa14a378b",
          metric: "Co",
        }
      ]
    },
    {
      id: "sajhjhjk",
      label: "tab2",
      items:[
        {
          id: "dgasd",
          label: "",
          patientId: "7b819fa14a378b",
          metric: "Co",
        }
      ]
    }
  ]);

  const [openAddPatientDialog, setOpenAddPatientDialog] = useState(false);
  const [patientListMode, setPatientListMode] = useState(null);
  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'), {noSsr: true});
  const [sizes, setSizes] = useLocalStorage("circleHeartSizes",(isUpMd ? [30,63,7] : [43,13,44]));
  const [viewSizes, setViewSizes] = useLocalStorage("circleHeartViewSizes",[70,30]);
  const [heartDiff, setHeartDiff] = useState(0);
  

  const heart = useObservable('/cases/'+caseData?.id+'/heart', zip([uid$,caseId$]).pipe(
    filter(([uid,caseId])=>Boolean(uid)&&Boolean(caseId)),
    mergeMap(([uid,caseId]) => auth.currentUser?  docData(doc(db,'users',uid,'cases',caseId,'hearts',auth.currentUser.uid)):of(null)))
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
      setCaseData(loadedCase.data.caseData)
      if(loadedCase.data.caseData?.viewIds){setSelectedView(loadedCase.data.views.find(v=>loadedCase.data.caseData?.viewIds[0]==v.id))}
      engine.setIsPlaying(true);
    }
    setLoading(false)
  }, [loadedCase.status]);

  useEffect(() => {
    if(patients?.length>0){setSelectedPatient(patients.find(p=>loadedCase.data.caseData?.patientIds[0]==p.id))}
  }, [patients]);

  useEffect(() => {
    const getAllCases = async () => {
      const tmpAllCases = []
      const allCasesSnap = await getDocs(query(collectionGroup(db,'cases'),limit(50)))
      allCasesSnap.forEach(async d=>{
        const caseData_ = d.data()
        console.log(d.data())
        const casePatients = []
        const casePatientsSnap = await getDocs(collection(db,'users',caseData_.uid,'cases',d.id,'patients'))
        casePatientsSnap.forEach(d=>{casePatients.push({...d.data(),id:d.id})})
        tmpAllCases.push({...caseData_,patients:casePatients})
      })
      setAllCases(tmpAllCases)
    }
    getAllCases()
  }, []);

  const addPatient = patient =>{
    const newPatient = {...patient,id:nanoid()}
    engine.register(newPatient);
    setPatients(draft=>{draft.push({...newPatient, ...engine.getPatient(newPatient.id)})})
    setCaseData(draft=>{draft.patientIds.push(newPatient.id)})
    setTimeout(()=>{scrollPatientBottomRef.current?.scrollIntoView({behavior: "smooth"});},100)
  }
  const cloneCase = async () => {
    const batch = writeBatch(db);
    const newCaseId = nanoid()
    const timestamp = serverTimestamp();
    const newCaseData = {...caseData,id:newCaseId,updatedAt:timestamp,createdAt:timestamp}
    const newPatients = []
    const newPatientIds = []
    caseData.patientIds.forEach(
      patientId => {
        const newPatientId = nanoid()
        const newPatient = {...patients.find(p=>p.id==patientId)}
        newPatients.push(newPatient)
        newPatientIds.push(newPatientId)
        batch.set(doc(db,'users',user?.uid,"cases",newCaseId,"patients",newPatientId),{
          name: newPatient.name,
          controller: newPatient.controller,
          initialHdps: newPatient.getHdps(),
          initialData: newPatient.getDataSnapshot(),
          initialTime: newPatient.getTimeSnapshot(),          
        })
      }
    )
    const newViews = []
    const newViewIds = []
    caseData.viewIds.forEach(
      viewId => {
        const newViewId = nanoid()
        const newView = {...views.find(v=>v.id==viewId)}
        newView.items = newView.items.map(item =>({...item, patientId:newPatientIds[caseData.patientIds.findIndex(p=>p==item.patientId)]}))
        newViews.push(newView)
        newViewIds.push(newViewId)
        batch.set(doc(db,'users',user?.uid,"cases",newCaseId,"views",newViewId),newView)
      }
    )
    newCaseData.patientIds = newPatientIds
    newCaseData.viewIds = newViewIds
    newCaseData.name = newCaseData.name+"のコピー"
    batch.set(doc(db,'users',user.uid,'cases',newCaseId),newCaseData)
    await batch.commit();
    router.push({pathname:`/cases/${newCaseId}/`})
  }
  const addHeart = useCallback(async () => {
    console.log(caseUser)
    const uid = caseUser?.uid
    if(!uid) return
    const batch = writeBatch(db);
    batch.update(doc(db,`users/${uid}/cases/${caseData.id}`),{heartCount:increment(1)})
    batch.update(doc(db,`users/${uid}`),{caseHeartCount:increment(1)})
    batch.set(doc(db,`users/${uid}/cases/${caseData.id}/hearts/${auth.currentUser.uid}`),{uid:auth.currentUser.uid})
    await batch.commit()
    setHeartDiff(prev=>prev+1);
  },[caseData?.id])
  const removeHeart = useCallback(async () => {
    const uid = caseUser?.uid
    if(!uid) return
    const batch = writeBatch(db);
    batch.update(doc(db,`users/${uid}/cases/${caseData.id}`),{heartCount:increment(-1)})
    batch.update(doc(db,`users/${uid}`),{caseHeartCount:increment(-1)})
    batch.delete(doc(db,`users/${uid}/cases/${caseData.id}/hearts/${auth.currentUser.uid}`))
    await batch.commit()
    setHeartDiff(prev=>prev-1);
  },[caseData?.id])

  useEffect(() => {
    if(user){
      setDialogOpen(false)
    }
  }, [user]);

  return <>
      <AppBar position="static" elevation={0} className={classes.appBar} >
        <Toolbar sx={{py:.5}}>
          <Box onClick={()=>{router.push("/")}} sx={{cursor:"pointer",fontFamily: "GT Haptik Regular" ,fontWeight: 'bold',display:"flex", alignItems:"center"}}>
            <Box mb={-1} mr={1}><Image src="/HeaderIcon.png" width={32} height={32}/></Box>
            <div>
              <Typography variant={isUpMd ? 'h5':'subtitle1'} fontWeight="bold" textAlign="left">{caseData?.name || "無題の症例"}</Typography>
              {!isUpMd && <Typography variant="subtitle2" sx={{cursor:"pointer", mt:-.5}} className="text-gray-500" onClick={()=>{router.push(`/users/${caseUser?.userId}`)}}>{caseUser?.displayName}</Typography>}
            </div>
          </Box>
          {isUpMd && !loading && caseData && <NoSsr>
              <Avatar onClick={()=>{router.push(`/${caseUser.userId}`)}} sx={{ width: "34px", height: "34px" ,cursor:"pointer",ml:4}}>
                <Image src={caseUser?.photoURL} layout='fill'/>
              </Avatar>
              <Stack mx={1} >
                <Typography variant="subtitle2" sx={{cursor:"pointer"}} onClick={()=>{router.push(`/users/${caseUser?.userId}`)}}>{caseUser?.displayName}</Typography>
                <Typography  variant="body2" sx={{color:"#6e7b85"}}>{ format(caseData?.updatedAt?.toDate(),'yyyy年M月dd日') }</Typography>
              </Stack>
              <Button variant='outlined'>Follow</Button>
            </NoSsr>}
          <div style={{flexGrow:1}}/>
          {!loading  && auth.currentUser &&<Stack direction="row">
            {heart.status=="success" && 
              (heart.data ? <IconButton onClick={removeHeart} className={classes.favoritedButton} sx={{width: "40px",height:"40px",mr:1}} >
                  <Favorite sx={{width:"28px",height:"28px"}}/>
                </IconButton>
              : <IconButton onClick={addHeart} className={classes.faintNeumoButton} sx={{width:"40px",height:"40px",mr:1}} >
                  <FavoriteBorder sx={{width:"28px",height:"28px"}}/>
                </IconButton>
              )
            }
          </Stack>}
          {!isUpMd && auth.currentUser && <div className='bg-white px-1.5 my-1 mr-1 inline-flex items-center rounded cursor-pointer' onClick={cloneCase}>
            <svg viewBox="0 0 100 100" className='h-6 w-6 fill-slate-500'><path d="M84.339 62.504a15.805 15.805 0 00-11.313 4.721 40.187 40.187 0 01-1.578-1.572c-6.965-7.211-14.451-19.189-22.311-29.678-7.977-10.209-16.196-20.413-29.012-20.906H0v14.37h20.126c2.555-.111 6.556 1.993 11.208 6.914 6.961 7.197 14.454 19.171 22.315 29.662 4.822 6.164 9.759 12.293 15.741 16.289 1.99 6.191 7.93 10.688 14.949 10.688 8.648 0 15.661-6.824 15.661-15.244s-7.013-15.244-15.661-15.244zM51.541 29.438h18.986c2.637 4.795 7.831 8.059 13.811 8.059 8.648 0 15.661-6.824 15.661-15.243S92.986 7.01 84.338 7.01c-5.979 0-11.174 3.264-13.811 8.058H36.3c6.007 3.551 10.861 8.924 15.241 14.37z"></path></svg>
          </div>}
          {
            user && <>
              <IconButton size="small" id="profile-button" aria-controls="profile-menu" aria-haspopup="true"  onClick={e=>setAnchorEl(e.currentTarget)}>
                <Avatar src={user?.photoURL} className= "inline-block h-9 w-9 md:h-11 md:w-11 rounded-full ">{user?.displayName[0]}</Avatar>
              </IconButton> 
              <Button disableElevation variant='contained' className="text-white" sx={{ml:2,display:{xs:"none",md:"inherit"},fontWeight:"bold"}} onClick={cloneCase} startIcon={<Edit/>}>編集する</Button>
            </>
          }{
            !user && <Button variant='contained' className="font-bold text-white" onClick={()=>{setDialogOpen(true)}} disableElevation>Log in</Button>
          }
          <Dialog open={dialogOpen} onClose={()=>{setDialogOpen(false)}} sx={{'& .firebaseui-idp-button':{borderRadius: "0.45em"}, '& .MuiDialog-paper':{borderRadius: '9px'},'& .MuiDialogContent-root':{maxWidth:"400px"}, '& .MuiBackdrop-root':{background:"rgba(0, 0, 0, 0.2)"}}}>
            <DialogContent>
              <Box width={1} display='flex' justifyContent='center' alignItems='center' sx={{mt:2,mb:3}}>
                <Image src="/HeaderIcon.png" width={40} height={40}/>
                <Typography variant="h5" noWrap component="div" sx={{fontFamily: "GT Haptik Regular",fontWeight: 'bold', fontSize:{xs:'h6.fontSize',sm:'h5.fontSize'}}}>
                  {t['Title']}
                </Typography>
              </Box>
              <DialogContentText variant="body2">
                循環動態シミュレーターで様々な病態や治療法への理解を深めていきましょう。
              </DialogContentText>
              <Box width={1} display='flex' justifyContent='center' alignItems='center' 
                sx={{"& .firebaseui-idp-button":{
                  transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
                  boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
                  backgroundColor: "#EFF6FB99",
                  border: "1px solid rgba(92, 147, 187, 0.17)",
                  "&:hover":{
                      backgroundColor: "rgba(239, 246, 251, 0.6)",
                      borderColor: "rgb(207, 220, 230)"
                  },
                  "& .firebaseui-idp-text":{
                    fontSize: "1rem",
                    color:"black"
                  }
                }}}>
                <StyledAuth/>
              </Box>
              <DialogContentText sx={{mt:.5}} variant="body2">
                利用規約、プライバシーポリシーに同意したうえでログインしてください。
              </DialogContentText>
            </DialogContent>
          </Dialog>
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={()=>{setAnchorEl(null);}}
            MenuListProps={{
              'aria-labelledby': 'profile-button',
            }}
            className={classes.menuList}
          >
            <MenuItem onClick={()=>{router.push("/" + user?.userId);setAnchorEl(null)}} disableRipple sx={{fontWeight:"bold",height:"50px"}}>{user?.displayName}</MenuItem>
            <Divider light sx={{margin:"0 !important"}}/>
            <MenuItem onClick={()=>{router.push("/dashboard/cases");setAnchorEl(null)}} disableRipple ><EventNoteOutlined/>症例の管理</MenuItem>
            <MenuItem onClick={()=>{router.push("/dashboard/articles");setAnchorEl(null)}} disableRipple ><FeedOutlined/>記事の管理</MenuItem>
            <MenuItem onClick={()=>{router.push("/dashboard/favorites");setAnchorEl(null)}} disableRipple ><FavoriteBorder/>いいねした投稿</MenuItem>
            <MenuItem onClick={()=>{router.push("/settings/account");setAnchorEl(null)}} disableRipple ><SettingsOutlined/>アカウント設定</MenuItem>
            <Divider light sx={{margin:"0 !important"}}/>
            <MenuItem onClick={()=>{signOut(auth).then(()=>{setAnchorEl(null);})}} disableRipple ><Logout/>ログアウト</MenuItem>
          </Menu>
          <Menu
            id="newItem-menu"
            anchorEl={newItemAnchorEl}
            open={Boolean(newItemAnchorEl)}
            onClose={()=>{setNewItemAnchorEl(null);}}
            MenuListProps={{
              'aria-labelledby': 'newItem-button',
            }}
          >
            <MenuItem onClick={createNewCase} disableRipple sx={{pr:3}}><Feed sx={{mr:1.5,my:1, color:"#6e7b85"}}/>症例を作成</MenuItem>
            <MenuItem onClick={createNewArticle} disableRipple sx={{pr:3}}><EventNote sx={{mr:1.5, my:1,color:"#6e7b85"}}/>記事を作成</MenuItem>
          </Menu>                      
        </Toolbar>
      </AppBar>
      <Divider sx={{borderColor:"#5c93bb2b"}}/>
      <NextSeo title={"症例"+caseData?.name}/>
      <div className={classes.background}/> 
      {!isUpMd && <div className="bg-slate-200 h-screen w-screen fixed -z-10"/>}
      {loading && <Box>
          <Lottie loop animationData={LoadingAnimation} play style={{ objectFit:"contain" }} />
        </Box>
      }
      {!loading && (isUpMd != null && isUpMd != undefined) && caseData &&  <> 
        <Split 
          className={classes.split} 
          sizes={sizes} 
          gutterSize={12} 
          minSize={[0,0,0]} 
          direction={isUpMd? "horizontal":"vertical"} 
          cursor={isUpMd ? "col-resize" : "row-resize"} 
          onDragEnd={(newSizes)=>{
            localStorage.setItem('case-split-sizes', JSON.stringify(newSizes)); 
            setSizes(newSizes)
          }}
        >
          {isUpMd &&<Box sx={{overflow:"auto",backgroundColor:!isUpMd && "#f1f5f9",zIndex:1000}}>
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
            </Box>
          }
          <div className={`z-10  ${!isUpMd && "bg-slate-200"}`}>
            {/* <Box sx={{height: isUpMd && "100%",position: isUpMd &&"relative",display:isUpLg && "flex", flexDirection: isUpLg && "row"}}>     
              <Box sx={{height: isUpMd && "100%",overflow: isUpMd && "auto",flexGrow:isUpLg && 1,pr:isUpLg&&"88px",pl:isUpLg&& 1, pb:"88px"}}> */}
                {isUpMd && 
                  <Split 
                    sizes={viewSizes} 
                    gutterSize={12} 
                    minSize={[0,0]}
                    direction="vertical"
                    cursor="row-resize"
                    onDragEnd={(newSizes)=>{
                      setViewSizes(newSizes)
                    } }
                    className={classes.childSplit}
                  >
                    <div className='overflow-y-scroll'>
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
                      <Stack alignItems="center" px={1}>
                        { caseData.viewIds?.map(viewId=>{
                          const view = views.find(v=>v.id===viewId);
                          if(view){ 
                            return <Box key={view.id} sx={{border:"1px solid #5c93bb2b", borderRadius:"8px",backgroundColor:"white",my:1,mx:1,py:1,boxShadow:"0 10px 20px #4b57a936", overflow:"auto", maxWidth: "750px", width:1,minWidth:{xs:"auto",md:"400px"}}}>
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
                          </Box>
                        }})}
                      </Stack> 
                    </div>
                    <div className='flex justify-center overflow-y-scroll'>
                      {
                        patients?.length>0  && 
                        <div className='overflow-hidden w-full'>
                          <OutputPanel outputs = {outputs} setOutputs={setOutputs} patients = {patients}/>
                        </div>
                      }
                    </div>
                  </Split>
                  }
                {
                  !isUpMd && <div>
                    <div className='flex w-full -mb-px'>
                      <nav className="flex space-x-8 overflow-x-scroll ">
                        <div className='flex w-full'>
                          {caseData.viewIds?.map(viewId=>{
                            const view = views.find(v=>v.id===viewId);
                            if(view){ 
                              return <div key={view.id} className='flex-shrink-0 flex-grow-0'>
                                <div className={`btn py-2 px-5 text-sm font-bold mr-px text-center transition-all duration-150 ${selectedView.id==view.id ? "bg-white": "text-slate-600"} `} onClick={()=>{
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
                      {selectedView.type === "PressureCurve" && 
                        <RealTimeChartNext engine={engine} initialView={selectedView} patients={patients}
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
                        />
                      }
                      {selectedView.type === "PressureVolumeCurve" && 
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
                          patients={patients}/>
                      }
                    </div>
                  </div>
                }
          </div>
          {!isUpMd ? <>
            <div className='z-20 bg-slate-200'>
              {patients?.length>0 && <OutputPanel outputs = {outputs} patients = {patients} setOutputs={setOutputs}/>}
            </div>
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
            </> : <div className='flex flex-col'>
              <div className='pt-5 px-3'>
                <PlaySpeedButtonsNext engine={engine} vertical/>
              </div>  
            </div>
          }              
        </Split>
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
  </>
}

export default CaseReader


const NewAddViewDialog = React.memo(({addViewItem,patients})=>{
  const classes = useStyles()
  const [openAddViewDialog, setOpenAddViewDialog] = useState(false);
  const [view, setView] = useImmer({name: "", type: "PressureCurve", items:[{hdp:"Plv",label:"左室圧",color:getRandomColor(),patientId:patients[0].id,id:nanoid()}]});
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
                draft.type=newValue;
                draft.items = [{hdp:"LV",label:"左室圧",color:getRandomColor(),patientId:patients[0].id,id:nanoid()}];
              })}}
              sx={{"& .MuiToggleButton-root": { padding:"3px 14px 2px"}}}
            >
              <ToggleButton value="PressureCurve">圧曲線</ToggleButton>
              <ToggleButton value="PressureVolumeCurve">圧容量曲線</ToggleButton>
              <ToggleButton value="PressureVolumeVsPressureCurve">圧容量vs圧曲線</ToggleButton>
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
})

// export const getStaticPaths= async () => {
//   return {
//     paths: [],
//     fallback: 'blocking',
//   };
// };



// export const getStaticProps = async (ctx) => {
//   const { userId,caseId } = ctx.params
//   const convertTimestampToJson = (data)=>{
//     const newData = {...data}
//     if(data?.updatedAt){
//       newData.updatedAt = data.updatedAt.toJSON()
//     }
//     if(data?.createdAt){
//       newData.createdAt = data.createdAt.toJSON()
//     }
//     return newData
//   }
//   const uidSnap = await getDoc(doc(db,'userIds',userId))
//   const uid = uidSnap.data().uid
//   const userSnap = await getDoc(doc(db,'users',uid))
//   const user = {...convertTimestampToJson(userSnap.data()),uid}
//   const caseSnap = await getDoc(doc(db,'users',uid,'cases',caseId))
//   const caseData = {...convertTimestampToJson(caseSnap.data()),id:caseId}
//   const patientsSnap = await getDocs(collection(db,'users',uid,'cases',caseId,'patients'))
//   const viewsSnap = await getDocs(collection(db,'users',uid,'cases',caseId,'views'))
//   const patients =[];
//   const views = [];
//   const allCases = [];
//   patientsSnap.forEach(d=>{patients.push({...convertTimestampToJson(d.data()),id:d.id})})
//   viewsSnap.forEach(d=>{views.push({...convertTimestampToJson(d.data()),id:d.id})})
//   const allCasesSnap = await getDocs(query(collectionGroup(db,'cases'),orderBy("favs"),limit(50)))
//   allCasesSnap.forEach(async d=>{
//     const caseData_ = d.data()
//     const casePatients = []
//     const casePatientsSnap = await getDocs(collection(db,'users',caseData_.uid,'cases',d.id,'patients'))
//     casePatientsSnap.forEach(d=>{casePatients.push({...convertTimestampToJson(d.data()),id:d.id})})
//     allCases.push({...caseData_,patients:casePatients})
//   })
//   return {
//     props: {caseUser:user,caseData,patients,views,allCases},
//     revalidate: 1
//   }
// }


  // const allCases$ = collectionData(query(collectionGroup(db,'cases'),orderBy("favs"),limit(50)),{idField: "id"}).pipe(
  //   mergeMap(cases=>combineLatest(
  //     cases.map(caseData=>
  //       zip({
  //         caseData: of({...caseData}),
  //         patients: collectionData(collection(db,'users',caseData.uid,'cases',caseData.id,'patients'))
  //       })
  //     )
  //   ))
  // )
  
  // const {data: allcases} = useObservable(`allcases`,allCases$)
  // console.log(allcases)
  // const caseData$ = zip([uid$,caseId$]).pipe(
  //   filter(([uid,caseId])=>Boolean(uid)&&Boolean(caseId)),
  //   mergeMap(([uid,caseId])=>docData(doc(db,'users',uid,'cases',caseId))),
  // )
  // const patients$ = zip([uid$,caseId$]).pipe(
  //   filter(([uid,caseId])=>Boolean(uid)&&Boolean(caseId)),
  //   mergeMap(([uid,caseId])=>collectionData(collection(db,'users',uid,'cases',caseId,'patients'))),
  // )
  // const views$ = zip([uid$,caseId$]).pipe(
  //   filter(([uid,caseId])=>Boolean(uid)&&Boolean(caseId)),
  //   mergeMap(([uid,caseId])=>collectionData(collection(db,'users',uid,'cases',caseId,'views'))),
  // )
  // const {data:initialCaseData} = useObservable(`case_${router.query.caseId}`,caseData$);
  // const {data: initialPatients} = useObservable(`patients_${router.query.caseId}`,patients$);
  // const {data:initialViews} = useObservable(`views_${router.query.caseId}`,views$);

  //   {!isUpMd && <>
  //   <Box px={2} py={1} width={1} sx={{borderBottom:"1px solid #5c93bb2b",background:"white"}}>
  //     <Stack direction="row" justifyContent="center" alignItems="center">
  //       <Avatar onClick={()=>{router.push(`/${caseUser.userId}`)}} sx={{ width: "34px", height: "34px" ,cursor:"pointer"}}>
  //         <Image src={caseUser.photoURL} layout='fill'/>
  //       </Avatar>
  //       <Stack ml={1} flexGrow={1}>
  //         <Typography variant="subtitle2" sx={{cursor:"pointer"}} onClick={()=>{router.push(`/${caseUser.userId}`)}}>{caseUser.displayName}</Typography>
  //         <Stack direction="row">
  //           <Typography  variant="body2" sx={{color:"#6e7b85"}}>{ format(caseData?.updatedAt?.toDate(),'yyyy年M月dd日') }</Typography>
  //         </Stack>
  //       </Stack>
  //       <div style={{flexGrow:1}}/>
  //       <Stack direction="row">
  //         {heart.status=="success" && 
  //           (heart.data ? <IconButton onClick={removeHeart} className={classes.favoritedButton}sx={{width:"43px",height:"43px",mr:1}} ><Favorite sx={{width:"30px",height:"30px"}}/></IconButton>
  //           : <IconButton onClick={addHeart} className={classes.faintNeumoButton}sx={{width:"43px",height:"43px",mr:1}} ><FavoriteBorder sx={{width:"30px",height:"30px"}}/></IconButton>)
  //         }
  //       </Stack>                    
  //     </Stack>
    
  //   </Box>
  // </>}                      