import React,{ useEffect, useRef,useState,useCallback}  from 'react'
import {Box, Grid, Typography, Divider,Button,Stack, Tab,Avatar, useMediaQuery,NoSsr} from '@mui/material'
import {TabContext,TabList,TabPanel} from '@mui/lab';
import {Twitter,Facebook, Link as LinkIcon,FavoriteBorder} from "@mui/icons-material"
import { makeStyles} from '@mui/styles';
import { useRouter } from 'next/router'
import Footer from "../../src/components/Footer"
import {auth,db} from '../../src/utils/firebase'
import {useObservable} from "reactfire"
import {collection,doc, updateDoc,serverTimestamp,writeBatch,deleteDoc, setDoc, getDoc, getDocs, arrayUnion, arrayRemove, where,} from 'firebase/firestore';
import Layout from "../../src/components/layout"
import { collectionData, docData } from 'rxfire/firestore';
import { filter, map, mergeMap, of } from 'rxjs';
import Image from 'next/image'
import { formatDateDiff } from '../../src/utils/utils';
import { user$ } from '../../src/hooks/usePvLoop';
import clsx from 'clsx';
import { query } from 'firebase/database';
import { useAuthState} from 'react-firebase-hooks/auth';
import {useDocumentData} from "react-firebase-hooks/firestore"
// import { adminDB } from '../../src/utils/server';

const useStyles = makeStyles((theme) =>({
  background: {
    position: "fixed",
    zIndex: -1,
    top: "0px",
    left: "0px",
    width: "100%",
    overflow: "hidden",
    transform: "translate3d(0px, 0px, 0px)",
    height: "-webkit-fill-available",
    background: "white",
    opacity: 1,
    userSelect: "none",
    pointerEvents: "none"
  },
  featuredBox: {
    transition: "background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, box-shadow 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, border-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms, color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    color: "rgb(69, 90, 100)",
    boxShadow: "rgb(0 0 0 / 10%) 0px 2px 4px -2px",
    backgroundColor: "white",
    border: "1px solid rgba(92, 147, 187, 0.17)",
    borderRadius: "12px",
  },
  bookCover: {
    boxShadow: "-6px 6px 10px -2px #001b4440, 0 0 3px #8f9aaf1a",
    position: "relative",
    maxWidth: "100%",
    width: "100px",
    height: "140px",
    "&::after": {
      bottom: 0,
      content: '""',
      height: "100%",
      left: "0",
      position: "absolute",
      width: "100%",
      borderRadius: "5px",
      background: "linear-gradient(-90deg,#fff0,#ffffff1a 80%,#ffffff4d 95%,#fff6 96.5%,#cbcbcb14 98%,#6a6a6a1a)",
    }
  }
}),
);

const UserSummary = ({uid}) => {
  const classes = useStyles();
  const router = useRouter()
  const [tabValue, setTabValue] = useState(router.query?.tabValue || "account");
  
  return <p>{uid}</p>
  // const isUpMd = useMediaQuery((theme) => theme.breakpoints.up('md'));
  // // const [user, setUser] = useState();
  // const [cases, setCases] = useState();
  // const [articles, setArticles] = useState();
  // const [books, setBooks] = useState();
  // const [followerDiff, setFollowerDiff] = useState(0);
  // const [currentUser] = useAuthState(auth)

  // const followedUser = useObservable("following"+uid, docData(doc(db,"followers",uid)));
  // const isFollowing = followedUser.status="success" && followedUser.data?.users?.includes(auth.currentUser?.uid);
  // const follow = async () => {
  //   if(!followedUser.data?.users){
  //     await setDoc(doc(db,"followers",uid),{users: [auth.currentUser?.uid]})
  //   }else{
  //     await updateDoc(doc(db,"followers",uid),{users: arrayUnion(auth.currentUser?.uid)})
  //   }
  //   setFollowerDiff(followerDiff+1)
  // }
  // const unfollow = async () => {
  //   await updateDoc(doc(db,"followers",uid),{users: arrayRemove(auth.currentUser?.uid)})
  //   setFollowerDiff(followerDiff-1)
  // }

  // useEffect(() => {
  //   (async ()=>{
  //     if(uid){
  //       const loadedCases = []
  //       const loadedCasesSnap = await getDocs(query(collection(db,'users',uid,'cases'),where("visibility","!=","private")));
  //       loadedCasesSnap.forEach(async (caseSnap) => {
  //         loadedCases.push({...caseSnap.data(),id:caseSnap.id})
  //       })
  //       setCases(loadedCases)
  //       const loadedArticles = []
  //       const loadedArticlesSnap = await getDocs(query(collection(db,'users',uid,'articles'),where("visibility","!=","private")))
  //       loadedArticlesSnap.forEach(async (articleSnap) => {
  //         loadedArticles.push({...articleSnap.data(),id:articleSnap.id})
  //       })
  //       setArticles(loadedArticles)
  //       const loadedBooks = []
  //       const loadedBooksSnap = await getDocs(query(collection(db,'users',uid,'books'),where("visibility","!=","private")))
  //       loadedBooksSnap.forEach(async (bookSnap) => {
  //         loadedBooks.push({...bookSnap.data(),id:bookSnap.id})
  //       })
  //       setBooks(loadedBooks)        
  //     }
  //   })()
  // }, [uid]);

  // useEffect(() => {
  //   if(router.query.tabValue){
  //     setTabValue(router.query.tabValue )
  //   }else{
  //     if(articles?.length>0){
  //       setTabValue("articles")
  //     }else{
  //       if(cases?.length>0){
  //         setTabValue("cases")
  //       }else{
  //         setTabValue("books")
  //       }
  //     }
  //   }
  // }, [router.query.tabValue, articles, cases, books]);

  // return <>
  //   {
  //     user && <>
  //       <Stack width={1} justifyContent="center" alignItems="center">
  //         <NoSsr>
  //           <Stack className='w-full max-w-6xl mx-auto' direction={isUpMd ?"row" : "column"} pt={isUpMd?6:4} pb={isUpMd?4:1} px={isUpMd?10:2} spacing={3}>
  //             <Avatar src={user?.photoURL} sx={{width:"100px",height:"100px"}}>
  //               {user?.displayName[0]}
  //             </Avatar>
  //             <Stack flexGrow={1} spacing={1}>
  //               <Stack direction="row" >
  //                 <Typography variant="h5" fontWeight="bold">{user?.displayName}</Typography>
  //                 <div style={{flexGrow:1}}/>
  //                 {user.uid === currentUser?.uid ? <Button onClick={()=>{router.push(`/settings/profile`)}} className="btn-neumorphic">プロフィールを編集</Button> : (isFollowing ? <Button variant="contained" onClick={unfollow} className="text-white font-bold" disableElevation size="small">フォロー中</Button> : <Button variant="outlined" onClick={follow} size="small">フォローする</Button>)}
  //               </Stack>
  //               {user?.description && <Typography variant="body1">{user?.description}</Typography>}
  //               <Stack direction="row" spacing={2}>
  //                 {user?.caseHeartCount+user?.articleHeartCount >0 && <Box display="flex" alignItems="center"> 
  //                     <Typography variant="subtitle1" sx={{fontWeight:"bold",mr:.5}}>{user?.caseHeartCount+user?.articleHeartCount}</Typography>
  //                     <Typography variant="body2" color="secondary">Likes</Typography>
  //                   </Box>
  //                 }
  //                 {followers?.length+followerDiff >0 && <Box display="flex" alignItems="center">
  //                   <Typography variant="subtitle1" sx={{fontWeight:"bold",mr:.5}}>{followers?.length+followerDiff}</Typography>
  //                   <Typography variant="body2" color="secondary">Followers</Typography>
  //                 </Box> }
  //               </Stack>
  //               <Stack direction="row" spacing={isUpMd ? 2 :1.5}>
  //                 {user?.twitterUserName && <a href={"https://twitter.com/"+user?.twitterUserName} target="_blank" style={{color:"#93a5b1"}}><Twitter sx={{"&:hover":{color:"#000000d1"}}}/></a>}
  //                 {user?.facebookUserName && <a href={"https://facebook.com/"+user?.facebookUserName} target="_blank" style={{color:"#93a5b1"}}><Facebook sx={{"&:hover":{color:"#000000d1"}}}/></a>}
  //                 {user?.url && <a href={user?.url} target="_blank" style={{color:"#93a5b1"}}><LinkIcon sx={{"&:hover":{color:"#000000d1"}}}/></a>}
  //               </Stack>
  //             </Stack>
  //           </Stack>
  //         </NoSsr>
  //       </Stack>
  //         {(cases || articles) && <TabContext value={tabValue}>
  //           <div className="w-full max-w-5xl px-4 md:px-10 mx-auto">
  //             <Box sx={{ borderBottom: 1, borderColor: '#5c93bb2b',mx:{xs:-1,md:0} }}>
  //               <TabList onChange={(e,newValue)=>{setTabValue(newValue)}}  sx={{"& button.Mui-selected":{fontWeight:"bold",color:"black"}}} variant="scrollable" textColor="secondary" indicatorColor="secondary" >
  //                 {articles?.length>0 &&  <Tab label="記事" value="articles"/>}
  //                 {cases?.length >0 && <Tab label="症例" value="cases"/>}
  //                 {books?.length >0 && <Tab label="本" value="books"/>}
  //               </TabList>
  //             </Box>
  //           </div>
  //           <div className='bg-blue-50 min-h-[18rem] w-full'>
  //             <div className="w-full max-w-5xl py-4 px-4 md:px-10 mx-auto">
  //               <TabPanel value="articles" sx={{px:0}}>
  //                 <Grid container spacing={{xs:2,md:3}} sx={{width:"100%"}}>
  //                   {articles?.map(c => (
  //                     <Grid item xs={12} md={6} sx={{mb:{xs:3,md:0}}}>
  //                       <Stack onClick={()=>{router.push(`/${user.userId}/articles/${c.id}`)}} direction="row" sx={{overflow:"hidden",borderRadius:"9px", cursor:"pointer",height:"100%"}}>
  //                         <div className='bg-white rounded-lg flex justify-center items-center w-24 h-24 min-w-[6rem]'>
  //                           <span className='text-4xl'>{c?.emoji || "😊"}</span>
  //                         </div>   
  //                         <Stack sx={{pl:2, justifyContent:"flex-end",flexGrow:1}}>
  //                           <Typography variant='subtitle1' fontWeight="bold" textAlign="left">{c.name || "無題の記事"}</Typography>
  //                           <div style={{flexGrow:1}}/>
  //                           <Stack direction="row" >{c.tags?.map(tag=><Box sx={{color:"#f86684",background:"#ffc5c545",fontSize:"10px",borderRadius:"4px",padding:"2px 5px",margin:"3px 7px 3px 0"}}>{tag}</Box>)}</Stack>
  //                           <Stack direction="row" justifyContent="center" alignItems="center">
  //                             <Avatar  src={user?.photoURL} sx={{ width: "34px", height: "34px" }}>
  //                               {user?.displayName[0]}
  //                             </Avatar>
  //                             <Stack ml={1} flexGrow={1}>
  //                               <Typography variant="subtitle2" >{c.displayName}</Typography>
  //                               <Stack direction="row">
  //                                 <Typography  variant="body2" sx={{color:"#6e7b85"}}>{formatDateDiff(new Date(),c.updatedAt?.toDate())}</Typography>
  //                                 <FavoriteBorder fontSize="small" sx={{color:"#6e7b85",ml:2,mr:.5}}/>
  //                                 <Typography variant="body2" sx={{color:"#6e7b85"}}>{c.heartCount}</Typography>
  //                               </Stack>
  //                             </Stack>
  //                           </Stack>
  //                         </Stack>
  //                       </Stack>
  //                     </Grid>
  //                   ))}
  //                 </Grid>
  //               </TabPanel>
  //               <TabPanel value="cases" sx={{px:0}} >
  //                 <Grid container spacing={{xs:2,md:3}} sx={{width:"100%"}}>
  //                   {cases?.map(c => (
  //                     <Grid item xs={12} md={6} sx={{mb:{xs:3,md:0}}}>
  //                       <Stack onClick={()=>{router.push(`/${user.userId}/cases/${c.id}`)}} direction="row" sx={{overflow:"hidden",borderRadius:"9px", cursor:"pointer",height:"100%"}}>
  //                         <div className='bg-white rounded-lg flex justify-center items-center w-24 h-24'>
  //                           <span className='text-4xl'>{c?.emoji || "😊"}</span>
  //                         </div>                          
  //                         <Stack sx={{pl:2, justifyContent:"flex-end",flexGrow:1}}>
  //                           <Typography variant='subtitle1' fontWeight="bold" textAlign="left">{c.name || "無題の症例"}</Typography>
  //                           <div style={{flexGrow:1}}/>
  //                           <Stack direction="row" >{c.tags?.map(tag=><Box sx={{color:"#f86684",background:"#ffc5c545",fontSize:"10px",borderRadius:"4px",padding:"2px 5px",margin:"3px 7px 3px 0"}}>{tag}</Box>)}</Stack>
  //                           <Stack direction="row" justifyContent="center" alignItems="center">
  //                             <Avatar  src={user?.photoURL} sx={{ width: "34px", height: "34px" }}>
  //                               {user?.displayName[0]}
  //                             </Avatar>
  //                             <Stack ml={1} flexGrow={1}>
  //                               <Typography variant="subtitle2" >{c.displayName}</Typography>
  //                               <Stack direction="row">
  //                                 <Typography  variant="body2" sx={{color:"#6e7b85"}}>{formatDateDiff(new Date(),c.updatedAt?.toDate())}</Typography>
  //                                 <FavoriteBorder fontSize="small" sx={{color:"#6e7b85",ml:2,mr:.5}}/>
  //                                 <Typography variant="body2" sx={{color:"#6e7b85"}}>{c.heartCount}</Typography>
  //                               </Stack>
  //                             </Stack>
  //                           </Stack>
  //                         </Stack>
  //                       </Stack>
  //                     </Grid>
  //                   ))}
  //                 </Grid>
  //               </TabPanel>
  //               <TabPanel value="books" sx={{px:0}} >
  //                 <Grid container spacing={{xs:2,md:3}} sx={{width:"100%"}}>
  //                   {books?.filter(book=>book.visibility!="private").map(c => (
  //                     <Grid item xs={12} md={6} sx={{mb:{xs:3,md:0}}}>
  //                       <Stack onClick={()=>{router.push(`/${user.userId}/books/${c.id}`)}} direction="row" sx={{borderRadius:"9px", cursor:"pointer",height:"100%"}}>
  //                         { c?.coverURL ? <div className={clsx("rounded-md", "cursor-pointer",classes.bookCover) }>
  //                             <img src={c?.coverURL} width={100} height={140} className="object-cover rounded" />
  //                           </div> : 
  //                           <div className={clsx("bg-blue-100 rounded-md shadow-md cursor-pointer",classes.bookCover)}>
  //                             <div className='flex justify-center items-center w-full h-full' style={{width:"100px"}}>
  //                               <div className='font-bold text-xl text-slate-400'>{c.name}</div>
  //                             </div>
  //                           </div>
  //                         }                                 
  //                         <Stack sx={{pl:2, justifyContent:"flex-end",flexGrow:1}}>
  //                           <Typography variant='subtitle1' fontWeight="bold" textAlign="left">{c.name || "無題の本"}</Typography>
  //                           {c.premium && <div className='text-blue-500 font-bold'>￥ {c.amount}</div> }
  //                           <div style={{flexGrow:1}}/>
  //                           <Stack direction="row" >{c.tags?.map(tag=><Box sx={{color:"#f86684",background:"#ffc5c545",fontSize:"10px",borderRadius:"4px",padding:"2px 5px",margin:"3px 7px 3px 0"}}>{tag}</Box>)}</Stack>
  //                           <Stack direction="row" justifyContent="center" alignItems="center">
  //                             <Avatar  src={user?.photoURL} sx={{ width: "34px", height: "34px" }}>
  //                               {user?.displayName[0]}
  //                             </Avatar>
  //                             <Stack ml={1} flexGrow={1}>
  //                               <Typography variant="subtitle2" >{c.displayName}</Typography>
  //                               <Stack direction="row">
  //                                 <Typography  variant="body2" sx={{color:"#6e7b85"}}>{formatDateDiff(new Date(),c.updatedAt?.toDate())}</Typography>
  //                                 <FavoriteBorder fontSize="small" sx={{color:"#6e7b85",ml:2,mr:.5}}/>
  //                                 <Typography variant="body2" sx={{color:"#6e7b85"}}>{c.heartCount}</Typography>
  //                               </Stack>
  //                             </Stack>
  //                           </Stack>
  //                         </Stack>
  //                       </Stack>
  //                     </Grid>
  //                   ))}
  //                 </Grid>
  //               </TabPanel>                
  //             </div>
  //           </div>
  //           </TabContext> 
  //         }     
  //     </>
  //   }
  //   <Footer/>   
  //   <div className={classes.background}></div>
  // </>
}




export const getStaticPaths= async () => {
  return {
    paths: [],
    fallback: true,
  };
};

export const getStaticProps = async (ctx) => {
  const { userId } = ctx.params
  // const convertTimestampToJson = (data)=>{
  //   const newData = {...data}
  //   if(data?.updatedAt){
  //     newData.updatedAt = data.updatedAt?.toMillis()
  //   }
  //   if(data?.createdAt){
  //     newData.createdAt = data.createdAt?.toMillis()
  //   }
  //   return newData
  // }    
  // const uidSnap = await adminDB.collection("userIds").doc(userId).get()
  // const uid = uidSnap.data()?.uid

  // const userSnap = await adminDB.collection("users").doc(uid).get()
  // const user = {...convertTimestampToJson(userSnap.data()),uid}
  // const followersSnap = await adminDB.collection("followers").doc(uid).get()
  // const followers = followersSnap.data().users
  return {
    props: {uid: "userId"},
  }
}

export default UserSummary;