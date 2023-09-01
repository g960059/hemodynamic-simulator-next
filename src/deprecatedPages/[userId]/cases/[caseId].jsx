import React, {useRef, useState, useEffect, useCallback} from 'react'
import {Box,Typography,Grid,Tab,Tabs, Divider,AppBar,Tooltip, Toolbar,Button,IconButton,Stack,Menu,Dialog,DialogContent,DialogActions,DialogTitle,Popover,MenuItem,TextField,List,ListItem,ListItemButton,ListItemText,Link,ToggleButtonGroup,ToggleButton,Avatar,useMediaQuery, DialogContentText, NoSsr} from '@mui/material'
import {ArrowBack,Add,Favorite,FavoriteBorder,EventNoteOutlined,FeedOutlined,SettingsOutlined,Logout,Feed,EventNote, Edit,CalendarToday, ConstructionOutlined} from '@mui/icons-material';
import {useEngine, user$,cases$, allCases$} from '../../../../hooks/usePvLoop'
import { useRouter } from 'next/router'
import {useTranslation} from '../../../../hooks/useTranslation'
import CaseEditor from "../../../../components/CaseEditor"
import Image from 'next/image'
import {getAuth, signOut} from "firebase/auth";


import { NextSeo } from 'next-seo';
import {useObservable} from '../../../hooks/useObservable'
import {StyledAuth} from "../../../../utils/firebase"

import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc, getDocs, getDoc, query, collectionGroup, orderBy, limit, increment, getFirestore} from 'firebase/firestore';
import { useImmer } from "use-immer";
import {nanoid,formatDateDiff} from "../../../../utils/utils"
import Lottie from 'react-lottie-player' 
import LoadingAnimation from "../../../../lotties/LoadingAnimation.json"
import {format} from "date-fns"
import { combineLatest, filter, map, mergeMap, of, zip } from 'rxjs';
import { collectionData, docData } from 'rxfire/firestore';
import Background from '../../../../elements/Background';



// const useStyles = makeStyles((theme) =>(
//   {

//     favoritedButton: {
//       color: "#f76685",
//       backgroundColor: "#ffeaf4",
//       border: "none",
//       "& .MuiOutlinedInput-notchedOutline": {border:"none"}
//     },     
//   })
// );


const CaseReader = () => {
  const classes = useStyles();
  const t = useTranslation();
  const router = useRouter()
  const db = getFirestore()
  const auth = getAuth()
  const [allCases, setAllCases] = useState([]);
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
      collectionData(collection(db,'users',uid,"cases",caseId,"views"),{idField: 'id'}),
      collectionData(collection(db,'users',uid,"cases",caseId,"outputs"),{idField: 'id'}),
    ])),
    map(([caseData,patients,views,outputs])=>({caseData,patients,views,outputs})),
  ))

  const caseUser$= uid$.pipe(
    filter(Boolean),
    mergeMap(uid=>docData(doc(db,'users',uid),{idField: 'uid'})),
  )

  const {data:caseUser} = useObservable(`user_${router.query.caseId}`,caseUser$)
  const {data:user} = useObservable("user",user$)


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
  const [loading, setLoading] = useState(true);

  const engine = useEngine()
  const [patients, setPatients] = useImmer([]);
  const [views, setViews] = useImmer([]);
  const [caseData, setCaseData] = useImmer();
  const [outputs, setOutputs] = useImmer([]);

  const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'), {noSsr: true});
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
      setOutputs(loadedCase.data.outputs)
      engine.setIsPlaying(true);
    }
    setLoading(false)
  }, [loadedCase.status]);



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
      <AppBar position="static" elevation={0} className="bg-white text-inherit" >
        <Toolbar sx={{py:.5}}>
          <Box onClick={()=>{router.push("/")}} sx={{cursor:"pointer",fontFamily: "GT Haptik Regular" ,fontWeight: 'bold',display:"flex", alignItems:"center"}}>
            <Box mb={-1} mr={1}><Image src="/HeaderIcon.png" width={32} height={32} alt="HeaderIcon"/></Box>
            <div className='overflow-x-scroll'>
              <Typography variant={isUpMd ? 'h5':'subtitle1'} fontWeight="bold" textAlign="left" className='whitespace-nowrap'>{caseData?.name || "無題の症例"}</Typography>
              {!isUpMd && <div sx={{cursor:"pointer", mt:-.5}} className="text-gray-500" onClick={()=>{router.push(`/users/${caseUser?.userId}`)}}>{caseUser?.displayName}</div>}
            </div>
          </Box>
          {isUpMd && !loading && caseData && <NoSsr>
            <Avatar onClick={()=>{router.push(`/${caseUser.userId}`)}} sx={{ width: "34px", height: "34px" ,cursor:"pointer",ml:4}}>
              <Image src={caseUser?.photoURL} layout='fill' alt="userPhoto"/>
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
              (heart.data ? <IconButton onClick={removeHeart}  sx={{width: "40px",height:"40px",mr:1}} >
                  <Favorite sx={{width:"28px",height:"28px"}}/>
                </IconButton>
              : <IconButton onClick={addHeart} sx={{width:"40px",height:"40px",mr:1}} >
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
                <Image src="/HeaderIcon.png" width={40} height={40} alt="headerIcon"/>
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
      <Background/>
      {/* {!isUpMd && <div className="bg-slate-200 h-screen w-screen fixed -z-10"/>} */}
      {loading && <Box>
          <Lottie loop animationData={LoadingAnimation} play style={{ objectFit:"contain" }} />
        </Box>
      }
      {!loading && caseData &&  <CaseEditor engine={engine} caseData={caseData} setCaseData={setCaseData} patients={patients} setPatients={setPatients} outputs={outputs} setOutputs={setOutputs} views={views} setViews={setViews} allCases={allCases}/>
      }
  </>
}

export default CaseReader






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